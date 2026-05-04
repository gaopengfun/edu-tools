<script setup lang="ts">
import type { WordItem } from '@/stores/dictation';

interface Props {
  words: WordItem[];
  show: boolean;
}

interface Emits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click="handleCancel">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">确认单词列表</h2>
      </div>

      <div class="modal-body">
        <div class="word-list">
          <div
            v-for="word in words"
            :key="word.index"
            class="word-item"
          >
            <span class="word-text">{{ word.text }}</span>
            <span v-if="word.translation" class="word-translation">
              {{ word.translation }}
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleCancel" class="btn btn-secondary">
          返回修改
        </button>
        <button @click="handleConfirm" class="btn btn-primary">
          确认开始
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--md-surface-container, #ffffff);
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--md-outline-variant, #c4c6d0);
}

.modal-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  color: var(--md-on-surface, #1a1c20);
}

.modal-body {
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--md-surface-container-high, #e8eaf6);
  border-radius: 8px;
}

.word-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-on-surface, #1a1c20);
}

.word-translation {
  font-size: 14px;
  color: var(--md-on-surface-variant, #44474e);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--md-outline-variant, #c4c6d0);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  color: var(--md-primary, #1a73e8);
}

.btn-secondary:hover {
  background: rgba(26, 115, 232, 0.08);
}

.btn-primary {
  background: var(--md-primary, #1a73e8);
  color: var(--md-on-primary, #ffffff);
}

.btn-primary:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>

