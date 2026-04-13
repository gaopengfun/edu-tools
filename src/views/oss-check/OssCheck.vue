<script setup lang="ts">
import { computed } from 'vue';
import { useOssCheck } from './composables/useOssCheck';
import type { StepStatus } from './types';

const { steps, running, summary, startCheck } = useOssCheck();

const statusLabel: Record<StepStatus, string> = {
  pending: '等待中',
  running: '检测中...',
  passed: '通过',
  failed: '失败',
  skipped: '已跳过'
};

const started = computed(() => steps.value.some((s) => s.status !== 'pending'));
</script>

<template>
  <div class="oss-check-page">
    <div class="page-header">
      <h1 class="headline">作业图片上传能力检测</h1>
      <p class="subtitle">检测当前网络环境是否满足作业图片上传的条件</p>
    </div>

    <button class="md3-button" :disabled="running" @click="startCheck">
      <span v-if="running" class="spinner"></span>
      {{ running ? '检测中...' : started ? '重新检测' : '开始检测' }}
    </button>

    <div v-if="started" class="steps-card">
      <div v-for="(step, i) in steps" :key="i" class="step-row" :class="`step-${step.status}`">
        <div class="step-icon">
          <span v-if="step.status === 'pending'" class="icon-pending"></span>
          <span v-else-if="step.status === 'running'" class="icon-running"></span>
          <span v-else-if="step.status === 'passed'" class="icon-passed">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M7.5 13.5L4 10l-1 1 4.5 4.5 9.5-9.5-1-1z" fill="currentColor" />
            </svg>
          </span>
          <span v-else-if="step.status === 'failed'" class="icon-failed">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" fill="none" />
            </svg>
          </span>
          <span v-else class="icon-skipped">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2" />
            </svg>
          </span>
        </div>
        <div class="step-info">
          <span class="step-name">{{ step.name }}</span>
          <span v-if="step.error" class="step-error">{{ step.error }}</span>
        </div>
        <div class="step-result">
          <span class="status-chip" :class="`chip-${step.status}`">{{
            statusLabel[step.status]
          }}</span>
          <span v-if="step.duration != null" class="step-duration">{{ step.duration }}ms</span>
        </div>
      </div>
    </div>

    <div
      v-if="summary"
      class="summary-card"
      :class="summary.allPassed ? 'summary-passed' : 'summary-failed'"
    >
      <div class="summary-title">{{ summary.allPassed ? '检测通过' : '检测未通过' }}</div>
      <div class="summary-detail">总耗时：{{ summary.totalDuration }}ms</div>
      <div v-if="!summary.allPassed" class="summary-failures">
        <div v-for="s in summary.failedSteps" :key="s.name" class="failure-item">
          {{ s.name }}：{{ s.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---- MD3 Tokens ---- */
.oss-check-page {
  --md-primary: #1a73e8;
  --md-on-primary: #ffffff;
  --md-surface: #f8f9ff;
  --md-on-surface: #1a1c20;
  --md-outline: #74777f;
  --md-success: #1b6e2d;
  --md-success-container: #d4f5d0;
  --md-error: #ba1a1a;
  --md-error-container: #ffdad6;
  --md-surface-variant: #e1e2ec;

  max-width: 600px;
  margin: 0 auto;
  padding: 32px 16px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  color: var(--md-on-surface);
}

/* ---- Header ---- */
.page-header {
  margin-bottom: 24px;
}

.headline {
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--md-outline);
  margin: 0;
}

/* ---- MD3 Filled Button ---- */
.md3-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 24px;
  border: none;
  border-radius: 20px;
  background: var(--md-primary);
  color: var(--md-on-primary);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    opacity 0.2s;
}

.md3-button:hover:not(:disabled) {
  box-shadow:
    0 1px 3px 1px rgba(0, 0, 0, 0.15),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.md3-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---- Spinner ---- */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---- Steps Card ---- */
.steps-card {
  margin-top: 24px;
  background: var(--md-surface);
  border-radius: 12px;
  box-shadow:
    0 1px 3px 1px rgba(0, 0, 0, 0.07),
    0 1px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.step-row + .step-row {
  border-top: 1px solid var(--md-surface-variant);
}

/* ---- Step Icons ---- */
.step-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-pending {
  width: 20px;
  height: 20px;
  border: 2px solid var(--md-outline);
  border-radius: 50%;
  opacity: 0.4;
}

.icon-running {
  width: 20px;
  height: 20px;
  border: 2px solid var(--md-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.icon-passed {
  color: var(--md-success);
}

.icon-failed {
  color: var(--md-error);
}

.icon-skipped {
  color: var(--md-outline);
  opacity: 0.5;
}

/* ---- Step Info ---- */
.step-info {
  flex: 1;
  min-width: 0;
}

.step-name {
  font-size: 14px;
  line-height: 20px;
}

.step-error {
  display: block;
  font-size: 12px;
  color: var(--md-error);
  margin-top: 2px;
  word-break: break-all;
}

/* ---- Step Result ---- */
.step-result {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-chip {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 8px;
}

.chip-pending {
  background: var(--md-surface-variant);
  color: var(--md-outline);
}

.chip-running {
  background: #d3e3fd;
  color: var(--md-primary);
}

.chip-passed {
  background: var(--md-success-container);
  color: var(--md-success);
}

.chip-failed {
  background: var(--md-error-container);
  color: var(--md-error);
}

.chip-skipped {
  background: var(--md-surface-variant);
  color: var(--md-outline);
}

.step-duration {
  font-size: 12px;
  color: var(--md-outline);
  min-width: 48px;
  text-align: right;
}

/* ---- Summary Card ---- */
.summary-card {
  margin-top: 20px;
  padding: 20px;
  border-radius: 12px;
  box-shadow:
    0 1px 3px 1px rgba(0, 0, 0, 0.07),
    0 1px 2px rgba(0, 0, 0, 0.1);
}

.summary-passed {
  background: var(--md-success-container);
  color: var(--md-success);
}

.summary-failed {
  background: var(--md-error-container);
  color: var(--md-error);
}

.summary-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.summary-detail {
  font-size: 14px;
}

.summary-failures {
  margin-top: 12px;
  font-size: 13px;
}

.failure-item {
  margin-top: 4px;
}
</style>
