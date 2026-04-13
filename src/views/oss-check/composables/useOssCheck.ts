// src/views/oss-check/composables/useOssCheck.ts

import { ref, computed } from "vue";
import type { CheckStep, OssToken } from "../types";

const TOKEN_API =
  "https://zytestaliyun.ceshiservice.cn/api-dihw-smarthw/token/uploadTokenNew?type=pyjLog&path=pyjLog&schoolId=1500000200068840595";

const TIMEOUT_MS = 30_000;

function createSteps(): CheckStep[] {
  return [
    { name: "公网连通性检测", status: "pending" },
    { name: "OSS Endpoint 连通性检测", status: "pending" },
    { name: "OSS PUT 协议检测", status: "pending" },
    { name: "实际上传测试", status: "pending" },
  ];
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export function useOssCheck() {
  const steps = ref<CheckStep[]>(createSteps());
  const running = ref(false);
  let cachedToken: OssToken | null = null;

  const summary = computed(() => {
    const finished = steps.value.every(
      (s) => s.status === "passed" || s.status === "failed" || s.status === "skipped",
    );
    if (!finished) return null;

    const allPassed = steps.value.every((s) => s.status === "passed");
    const totalDuration = steps.value.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const failedSteps = steps.value.filter((s) => s.status === "failed");

    return { allPassed, totalDuration, failedSteps };
  });

  function updateStep(index: number, patch: Partial<CheckStep>) {
    steps.value[index] = { ...steps.value[index]!, ...patch };
  }

  async function runStep(index: number, fn: () => Promise<void>) {
    updateStep(index, { status: "running" });
    const start = performance.now();
    try {
      await fn();
      updateStep(index, { status: "passed", duration: Math.round(performance.now() - start) });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      updateStep(index, {
        status: "failed",
        duration: Math.round(performance.now() - start),
        error: msg,
      });
      return false;
    }
  }

  // Step 1: 公网连通性
  async function checkInternet() {
    await fetchWithTimeout(
      "https://www.aliyun.com",
      { mode: "no-cors", method: "HEAD" },
      TIMEOUT_MS,
    );
  }

  // Step 2: OSS Endpoint 连通性
  async function checkEndpoint() {
    await fetchWithTimeout(
      "https://oss-cn-beijing.aliyuncs.com",
      { mode: "no-cors", method: "HEAD" },
      TIMEOUT_MS,
    );
  }

  async function fetchToken(): Promise<OssToken> {
    if (cachedToken) return cachedToken;
    const res = await fetchWithTimeout(TOKEN_API, {}, TIMEOUT_MS);
    if (!res.ok) throw new Error(`Token 接口返回 ${res.status}`);
    const data = await res.json();
    if (data.result !== "success") throw new Error("Token 接口返回失败");
    const msg = typeof data.message === "string" ? JSON.parse(data.message) : data.message;
    cachedToken = msg as OssToken;
    return cachedToken;
  }

  function getDateStrings(date: Date) {
    const iso = date.toISOString();
    const dateStamp = iso.slice(0, 10).replace(/-/g, "");
    const amzDate = dateStamp + "T" + iso.slice(11, 19).replace(/:/g, "") + "Z";
    return { dateStamp, amzDate };
  }

  async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  }

  async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
    const buffer =
      typeof data === "string" ? (new TextEncoder().encode(data).buffer as ArrayBuffer) : data;
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return bufferToHex(hash);
  }

  function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Step 3: 获取 Token + OSS PUT 端点可达性检测
  async function checkPutProtocol() {
    const token = await fetchToken();
    const host = `${token.bucket}.${token.endPoint}`;
    // 通过代理发 HEAD 请求验证 OSS bucket 可达
    const res = await fetchWithTimeout(
      import.meta.env.DEV ? "/oss-proxy/" : "https://zytestaliyun.ceshiservice.cn/",
      {
        method: "HEAD",
        headers: {
          "x-proxy-target-host": host,
        },
      },
      TIMEOUT_MS,
    );
    // OSS 对无签名的 HEAD 请求返回 403 或 200 都说明端点可达
    // 只有网络不通才会抛异常（fetch 失败）
    if (res.status >= 500) {
      throw new Error(`OSS 端点返回 ${res.status}`);
    }
  }

  // Step 4: 实际上传
  async function checkUpload() {
    const token = await fetchToken();
    const contentType = "application/octet-stream";
    const blob = new Blob([crypto.getRandomValues(new Uint8Array(1024))], {
      type: contentType,
    });
    const objectKey = `${token.path}/oss-check-${Date.now()}.bin`;
    const now = new Date();
    const { dateStamp, amzDate } = getDateStrings(now);
    const host = `${token.bucket}.${token.endPoint}`;
    const region = token.region;
    const scope = `${dateStamp}/${region}/oss/aliyun_v4_request`;

    const payloadHash = "UNSIGNED-PAYLOAD";

    // OSS V4 必签 header：host、content-type（若 body 存在浏览器会自动发送，必须参与签名）、
    // 以及所有 x-oss-* 头
    const headerEntries: Record<string, string> = {
      host,
      "content-type": contentType,
      "x-oss-content-sha256": payloadHash,
      "x-oss-date": amzDate,
      "x-oss-security-token": token.securityToken,
    };

    const signedHeaderKeys = Object.keys(headerEntries).sort();
    const canonicalHeaders =
      signedHeaderKeys.map((k) => `${k}:${headerEntries[k]}`).join("\n") + "\n";

    // OSS V4: AdditionalHeaders 仅列出非必签头（host / content-type / content-md5 / x-oss-* 已自动签名）
    // 此处所有 header 均为必签，故 additionalHeaders 为空
    const additionalHeadersStr = "";

    // OSS V4 CanonicalURI 始终包含 bucket 前缀，即使使用虚拟主机风格（bucket.endpoint）
    // 形如 /<BucketName>/<ObjectName>，这是 OSS V4 与 AWS SigV4 的关键差异
    const canonicalUri = `/${token.bucket}/${objectKey}`;

    const canonicalRequest = [
      "PUT",
      canonicalUri,
      "",
      canonicalHeaders,
      additionalHeadersStr,
      payloadHash,
    ].join("\n");

    const stringToSign = [
      "OSS4-HMAC-SHA256",
      amzDate,
      scope,
      await sha256Hex(canonicalRequest),
    ].join("\n");

    const enc = new TextEncoder();
    let signingKey: ArrayBuffer = enc.encode(`aliyun_v4${token.accessKeySecret}`)
      .buffer as ArrayBuffer;
    for (const part of [dateStamp, region, "oss", "aliyun_v4_request"]) {
      signingKey = await hmacSha256(signingKey, part);
    }
    // OSS V4 Signature = HEX(HMAC-SHA256(SigningKey, StringToSign))
    // 注意：只做 hex 编码，切勿再调用 sha256Hex（会多做一次 SHA-256 导致签名恒错）
    const signature = bufferToHex(await hmacSha256(signingKey, stringToSign));

    console.log("canonicalRequest", canonicalRequest);
    console.log("stringToSign", stringToSign);
    console.log("signature", signature);

    const authorization =
      `OSS4-HMAC-SHA256 Credential=${token.accessKeyId}/${scope}, ` + `Signature=${signature}`;

    const res = await fetchWithTimeout(
      `/oss-proxy/${objectKey}`,
      {
        method: "PUT",
        headers: {
          "x-proxy-target-host": host,
          Authorization: authorization,
          "Content-Type": contentType,
          "x-oss-content-sha256": payloadHash,
          "x-oss-date": amzDate,
          "x-oss-security-token": token.securityToken,
        },
        body: blob,
      },
      TIMEOUT_MS,
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`上传失败 HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
  }

  async function startCheck() {
    running.value = true;
    steps.value = createSteps();
    cachedToken = null;

    const checks = [checkInternet, checkEndpoint, checkPutProtocol, checkUpload];

    for (let i = 0; i < checks.length; i++) {
      const passed = await runStep(i, checks[i]!);
      if (!passed) {
        // 后续步骤标记为跳过
        for (let j = i + 1; j < checks.length; j++) {
          updateStep(j, { status: "skipped" });
        }
        break;
      }
    }

    running.value = false;
  }

  return { steps, running, summary, startCheck };
}
