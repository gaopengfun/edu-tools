// src/views/oss-check/composables/useOssCheck.ts

import { ref, computed } from 'vue'
import type { CheckStep, OssToken } from '../types'

const TOKEN_API =
  '/api-dihw-smarthw/token/uploadTokenNew?type=pyjLog&path=pyjLog&schoolId=1500000200068840595'

const TIMEOUT_MS = 30_000

function createSteps(): CheckStep[] {
  return [
    { name: '公网连通性检测', status: 'pending' },
    { name: 'OSS Endpoint 连通性检测', status: 'pending' },
    { name: 'OSS PUT 协议检测', status: 'pending' },
    { name: '实际上传测试', status: 'pending' },
  ]
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

export function useOssCheck() {
  const steps = ref<CheckStep[]>(createSteps())
  const running = ref(false)
  let cachedToken: OssToken | null = null

  const summary = computed(() => {
    const finished = steps.value.every(
      (s) => s.status === 'passed' || s.status === 'failed' || s.status === 'skipped',
    )
    if (!finished) return null

    const allPassed = steps.value.every((s) => s.status === 'passed')
    const totalDuration = steps.value.reduce((sum, s) => sum + (s.duration ?? 0), 0)
    const failedSteps = steps.value.filter((s) => s.status === 'failed')

    return { allPassed, totalDuration, failedSteps }
  })

  function updateStep(index: number, patch: Partial<CheckStep>) {
    steps.value[index] = { ...steps.value[index]!, ...patch }
  }

  async function runStep(index: number, fn: () => Promise<void>) {
    updateStep(index, { status: 'running' })
    const start = performance.now()
    try {
      await fn()
      updateStep(index, { status: 'passed', duration: Math.round(performance.now() - start) })
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      updateStep(index, {
        status: 'failed',
        duration: Math.round(performance.now() - start),
        error: msg,
      })
      return false
    }
  }

  // Step 1: 公网连通性
  async function checkInternet() {
    await fetchWithTimeout('https://www.aliyun.com', { mode: 'no-cors', method: 'HEAD' }, TIMEOUT_MS)
  }

  // Step 2: OSS Endpoint 连通性
  async function checkEndpoint() {
    await fetchWithTimeout(
      'https://oss-cn-beijing.aliyuncs.com',
      { mode: 'no-cors', method: 'HEAD' },
      TIMEOUT_MS,
    )
  }

  async function fetchToken(): Promise<OssToken> {
    if (cachedToken) return cachedToken
    const res = await fetchWithTimeout(TOKEN_API, {}, TIMEOUT_MS)
    if (!res.ok) throw new Error(`Token 接口返回 ${res.status}`)
    const data = await res.json()
    if (data.result !== 'success') throw new Error('Token 接口返回失败')
    const msg = typeof data.message === 'string' ? JSON.parse(data.message) : data.message
    cachedToken = msg as OssToken
    return cachedToken
  }

  function getDateStrings(date: Date) {
    const iso = date.toISOString()
    const dateStamp = iso.slice(0, 10).replace(/-/g, '')
    const amzDate = dateStamp + 'T' + iso.slice(11, 19).replace(/:/g, '') + 'Z'
    return { dateStamp, amzDate }
  }

  async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  }

  async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
    const buffer =
      typeof data === 'string' ? new TextEncoder().encode(data).buffer as ArrayBuffer : data
    const hash = await crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Step 3: 获取 Token + PUT 协议检测
  async function checkPutProtocol() {
    const token = await fetchToken()
    const host = `${token.bucket}.${token.endPoint}`
    // 发送预检请求验证 CORS 是否允许 PUT
    const res = await fetchWithTimeout(
      `https://${host}`,
      {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'PUT',
          'Access-Control-Request-Headers': 'x-oss-date,x-oss-security-token,x-oss-content-sha256',
          Origin: location.origin,
        },
      },
      TIMEOUT_MS,
    )
    const allowMethods = res.headers.get('Access-Control-Allow-Methods') ?? ''
    if (!allowMethods.toUpperCase().includes('PUT')) {
      throw new Error(`CORS 不允许 PUT，Allow-Methods: ${allowMethods}`)
    }
  }

  // Step 4: 实际上传
  async function checkUpload() {
    const token = await fetchToken()
    const blob = new Blob([crypto.getRandomValues(new Uint8Array(1024))], {
      type: 'application/octet-stream',
    })
    const objectKey = `${token.path}/oss-check-${Date.now()}.bin`
    const now = new Date()
    const { dateStamp, amzDate } = getDateStrings(now)
    const host = `${token.bucket}.${token.endPoint}`
    const region = token.region
    const scope = `${dateStamp}/${region}/oss/aliyun_v4_request`

    const payloadHash = await sha256Hex(await blob.arrayBuffer())

    const headerEntries: Record<string, string> = {
      host,
      'x-oss-content-sha256': payloadHash,
      'x-oss-date': amzDate,
      'x-oss-security-token': token.securityToken,
    }

    const signedHeaderKeys = Object.keys(headerEntries).sort()
    const signedHeadersStr = signedHeaderKeys.join(';')
    const canonicalHeaders = signedHeaderKeys.map((k) => `${k}:${headerEntries[k]}`).join('\n') + '\n'

    const canonicalRequest = [
      'PUT',
      `/${objectKey}`,
      '',
      canonicalHeaders,
      signedHeadersStr,
      payloadHash,
    ].join('\n')

    const stringToSign = [
      'OSS4-HMAC-SHA256',
      amzDate,
      scope,
      await sha256Hex(canonicalRequest),
    ].join('\n')

    const enc = new TextEncoder()
    let signingKey: ArrayBuffer = enc.encode(`aliyun_v4${token.accessKeySecret}`).buffer as ArrayBuffer
    for (const part of [dateStamp, region, 'oss', 'aliyun_v4_request']) {
      signingKey = await hmacSha256(signingKey, part)
    }
    const signature = await sha256Hex(await hmacSha256(signingKey, stringToSign))

    const authorization =
      `OSS4-HMAC-SHA256 Credential=${token.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeadersStr}, Signature=${signature}`

    const res = await fetchWithTimeout(
      `https://${host}/${objectKey}`,
      {
        method: 'PUT',
        headers: {
          Authorization: authorization,
          'x-oss-content-sha256': payloadHash,
          'x-oss-date': amzDate,
          'x-oss-security-token': token.securityToken,
        },
        body: blob,
      },
      TIMEOUT_MS,
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`上传失败 HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
  }

  async function startCheck() {
    running.value = true
    steps.value = createSteps()
    cachedToken = null

    const checks = [checkInternet, checkEndpoint, checkPutProtocol, checkUpload]

    for (let i = 0; i < checks.length; i++) {
      const passed = await runStep(i, checks[i]!)
      if (!passed) {
        // 后续步骤标记为跳过
        for (let j = i + 1; j < checks.length; j++) {
          updateStep(j, { status: 'skipped' })
        }
        break
      }
    }

    running.value = false
  }

  return { steps, running, summary, startCheck }
}
