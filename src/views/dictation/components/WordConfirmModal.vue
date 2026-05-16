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
      <div
        v-if="props.show"
        class="fixed inset-0 z-50 flex items-center justify-center md:p-4"
        @click="emit('cancel')"
      >
        <!-- Overlay -->
        <div class="modal-overlay absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

        <!-- Card / Bottom sheet -->
        <div
          class="modal-card relative w-full max-h-[85vh] md:max-w-[560px] md:rounded-3xl max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-t-3xl bg-white/90 backdrop-blur-md shadow-2xl shadow-sky-300/30 flex flex-col"
          @click.stop
        >
          <!-- Mobile drag handle -->
          <div class="flex justify-center pt-3 pb-0 md:hidden">
            <div class="w-10 h-1 rounded-full bg-gradient-to-r from-sky-300 to-emerald-300" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 md:pt-5">
            <h2 class="flex items-center gap-2 text-lg md:text-xl font-semibold text-slate-700">
              <svg
                class="w-4 h-4 text-amber-500"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l2.9 7h7.1l-5.7 4.4 2.2 7.1L12 16l-6.5 4.5 2.2-7.1L2 9h7.1z" />
              </svg>
              <span>确认单词列表</span>
            </h2>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
                />
              </svg>
              <span>共 {{ props.words.length }} 个</span>
            </span>
          </div>

          <!-- Word list -->
          <div class="flex-1 overflow-y-auto px-6 pb-4">
            <div class="flex flex-col gap-2.5">
              <div
                v-for="(word, i) in props.words"
                :key="word.index"
                class="word-row group flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/70 hover:border-sky-300/70 hover:shadow-md hover:shadow-sky-200/40 hover:-translate-y-0.5 focus-within:border-sky-300/80 focus-within:shadow-sm focus-within:shadow-sky-200/40 transition-all duration-200 ease-out"
              >
                <span
                  class="flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 ring-1 ring-sky-200/70 text-sky-600 text-xs font-semibold tabular-nums shrink-0 group-hover:bg-sky-100 group-hover:ring-sky-300/80 transition-colors"
                >
                  {{ i + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm md:text-[15px] font-semibold text-slate-700 leading-tight">
                    {{ word.text }}
                  </div>
                  <input
                    :value="word.translation"
                    @change="
                      emit(
                        'updateTranslation',
                        word.index,
                        ($event.target as HTMLInputElement).value
                      )
                    "
                    class="text-xs md:text-sm text-slate-500 bg-transparent border-b border-dashed border-transparent focus:border-sky-400 outline-none w-full py-0.5 mt-0.5 placeholder:text-slate-400"
                    placeholder="点击编辑翻译"
                  />
                </div>
                <button
                  @click="emit('remove', word.index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-rose-400/70 hover:text-rose-500 hover:bg-rose-50 active:scale-90 focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all shrink-0"
                  aria-label="移除该单词"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 flex gap-3 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              @click="emit('cancel')"
              class="max-md:flex-1 px-7 h-12 rounded-full text-sm font-medium bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40 text-slate-600 hover:bg-white active:scale-95 transition-all"
            >
              返回修改
            </button>
            <button
              @click="emit('confirm')"
              :disabled="props.words.length === 0"
              class="max-md:flex-1 px-7 h-12 rounded-full text-sm font-medium bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-400/40 text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
            >
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
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
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
