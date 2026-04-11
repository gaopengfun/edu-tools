// src/views/oss-check/composables/useOssCheck.ts

import { ref, computed } from 'vue'
import type { CheckStep, OssToken } from '../types'

const TOKEN_API =
  'https://zytestaliyun.ceshiservice.cn/api-dihw-smarthw/token/uploadTokenNew?type=pyjLog&path=pyjLog&schoolId=1500000200068840595'

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

  // Step 3: 获取 Token + PUT 协议检测（下一个 Task 实现）
  async function checkPutProtocol() {
    // 占位，Task 3 实现
    throw new Error('not implemented')
  }

  // Step 4: 实际上传（下一个 Task 实现）
  async function checkUpload() {
    // 占位，Task 3 实现
    throw new Error('not implemented')
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
