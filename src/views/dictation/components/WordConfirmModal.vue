<!-- src/views/dictation/components/WordConfirmModal.vue -->
<script setup lang="ts">
import type { WordItem } from '@/stores/dictation';

const props = defineProps<{ words: WordItem[]; show: boolean }>();
const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'remove', index: number): void;
  (e: 'updateTranslation', index: number, translation: string): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="props.show" class="fixed inset-0 z-50 flex items-center justify-center md:p-4"
           @click="emit('cancel')">
        <!-- Overlay -->
        <div class="modal-overlay absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

        <!-- Card / Bottom sheet -->
        <div class="modal-card relative w-full max-h-[85vh] md:max-w-[560px] md:rounded-3xl
                    max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0
                    max-md:rounded-t-3xl
                    bg-white/90 backdrop-blur-md shadow-2xl shadow-sky-300/30
                    flex flex-col"
             @click.stop>

          <!-- Mobile drag handle -->
          <div class="flex justify-center pt-3 pb-0 md:hidden">
            <div class="w-10 h-1 rounded-full bg-gradient-to-r from-sky-300 to-emerald-300" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 md:pt-5">
            <h2 class="text-lg md:text-xl font-medium text-on-surface">确认单词列表</h2>
            <span class="text-xs md:text-sm text-on-surface-variant">共 {{ props.words.length }} 个</span>
          </div>

          <!-- Word list -->
          <div class="flex-1 overflow-y-auto px-6 pb-4">
            <div class="flex flex-col gap-2">
              <div v-for="(word, i) in props.words" :key="word.index"
                class="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl">
                <span class="text-xs text-on-surface-variant min-w-5">{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm md:text-[15px] font-medium text-on-surface">{{ word.text }}</div>
                  <input
                    :value="word.translation"
                    @change="emit('updateTranslation', word.index, ($event.target as HTMLInputElement).value)"
                    class="text-xs md:text-sm text-on-surface-variant bg-transparent border-b border-dashed
                           border-transparent focus:border-primary outline-none w-full py-0.5"
                    placeholder="点击编辑翻译"
                  />
                </div>
                <button @click="emit('remove', word.index)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-red-700
                         opacity-50 hover:opacity-100 hover:bg-red-700/8 transition-all shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-surface-container-high
                      flex gap-3 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button @click="emit('cancel')"
              class="max-md:flex-1 px-6 py-2.5 rounded-xl text-sm font-medium
                     md:bg-transparent md:text-primary md:hover:bg-primary/8
                     max-md:border-[1.5px] max-md:border-outline-variant max-md:text-on-surface
                     transition-colors">
              返回修改
            </button>
            <button @click="emit('confirm')"
              class="max-md:flex-1 px-6 py-2.5 rounded-xl text-sm font-medium
                     bg-primary text-on-primary shadow-sm shadow-primary/30
                     hover:shadow-md transition-all">
              确认开始
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 150ms ease-out;
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>
