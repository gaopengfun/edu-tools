// src/views/oss-check/composables/useOssCheck.ts

import { ref, computed } from 'vue';
import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';
import type { CheckStep, OssToken } from '../types';

const TOKEN_API =
  'https://zytestaliyun.ceshiservice.cn/api-dihw-smarthw/token/uploadTokenNew?type=pyjLog&path=pyjLog&schoolId=1500000200068840595';

const TIMEOUT_MS = 30_000;

function createSteps(): CheckStep[] {
  return [
    { name: '公网连通性检测', status: 'pending' },
    { name: '作业 OSS 连通性检测', status: 'pending' },
    { name: '作业 OSS PUT 协议检测', status: 'pending' },
    { name: '实际上传测试', status: 'pending' }
  ];
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
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
      (s) => s.status === 'passed' || s.status === 'failed' || s.status === 'skipped'
    );
    if (!finished) return null;

    const allPassed = steps.value.every((s) => s.status === 'passed');
    const totalDuration = steps.value.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const failedSteps = steps.value.filter((s) => s.status === 'failed');

    return { allPassed, totalDuration, failedSteps };
  });

  function updateStep(index: number, patch: Partial<CheckStep>) {
    steps.value[index] = { ...steps.value[index]!, ...patch };
  }

  async function runStep(index: number, fn: () => Promise<void>) {
    updateStep(index, { status: 'running' });
    const start = performance.now();
    try {
      await fn();
      updateStep(index, { status: 'passed', duration: Math.round(performance.now() - start) });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      updateStep(index, {
        status: 'failed',
        duration: Math.round(performance.now() - start),
        error: msg
      });
      return false;
    }
  }

  // Step 1: 公网连通性
  async function checkInternet() {
    await fetchWithTimeout(
      'https://www.aliyun.com',
      { mode: 'no-cors', method: 'HEAD' },
      TIMEOUT_MS
    );
  }

  // Step 2: OSS Endpoint 连通性
  async function checkEndpoint() {
    await fetchWithTimeout(
      'https://oss-cn-beijing.aliyuncs.com',
      { mode: 'no-cors', method: 'HEAD' },
      TIMEOUT_MS
    );
  }

  async function fetchToken(): Promise<OssToken> {
    if (cachedToken) return cachedToken;
    const res = await fetchWithTimeout(TOKEN_API, {}, TIMEOUT_MS);
    if (!res.ok) throw new Error(`Token 接口返回 ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error('Token 接口返回失败');
    const msg = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;
    cachedToken = msg as OssToken;
    return cachedToken;
  }

  // Step 3: 获取 Token + OSS PUT 端点可达性检测
  async function checkPutProtocol() {
    const token = await fetchToken();
    const host = `${token.bucket}.${token.endPoint}`;
    // 直连 OSS bucket 验证可达性；no-cors 避开 CORS 预检，fetch 不抛错即视为可达
    await fetchWithTimeout(`https://${host}/`, { method: 'HEAD', mode: 'no-cors' }, TIMEOUT_MS);
  }

  // Step 4: 实际上传 - 使用 ali-oss 官方 SDK
  async function checkUpload() {
    const token = await fetchToken();
    const contentType = 'application/octet-stream';
    const blob = new Blob(['pyj-oss-check\r\n', `${new Date().toLocaleString()}\r\n`, uuidv4()], {
      type: contentType
    });
    const objectKey = `${token.path}/pyj-oss-check-${uuidv4()}.txt`;

    const client = new OSS({
      region: token.region,
      endpoint: `https://${token.endPoint}`,
      accessKeyId: token.accessKeyId,
      accessKeySecret: token.accessKeySecret,
      stsToken: token.securityToken,
      bucket: token.bucket,
      secure: true,
      authorizationV4: true
    });

    await client.put(objectKey, blob, {
      mime: contentType,
      timeout: TIMEOUT_MS
    });
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
          updateStep(j, { status: 'skipped' });
        }
        break;
      }
    }

    running.value = false;
  }

  return { steps, running, summary, startCheck };
}
