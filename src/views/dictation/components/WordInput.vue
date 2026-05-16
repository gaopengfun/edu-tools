<!-- src/views/dictation/components/WordInput.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const model = defineModel<string>({ required: true });
const props = defineProps<{ disabled?: boolean }>();

const wordCount = computed(() => {
  const text = model.value.trim();
  if (!text) return 0;
  return text.split(/[\n,，、\s]+/).filter((w) => w.length > 0).length;
});
</script>

<template>
  <div>
    <label for="word-input" class="block text-xs font-medium text-slate-500 mb-2">单词列表</label>
    <textarea
      id="word-input"
      v-model="model"
      class="w-full p-4 border-[1.5px] border-sky-200 rounded-xl text-[15px] leading-relaxed text-slate-700 bg-white/60 resize-y min-h-[160px] md:min-h-[200px] transition-colors duration-200 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200/50 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
      placeholder="输入单词,支持空格、逗号、换行分隔&#10;例如:apple banana orange"
      rows="6"
      :disabled="props.disabled"
    />
    <div class="mt-2 flex justify-end">
      <span
        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 7h7.1l-5.7 4.4 2.2 7.1L12 16l-6.5 4.5 2.2-7.1L2 9h7.1z" />
        </svg>
        <span>已输入 {{ wordCount }} 个</span>
      </span>
    </div>
  </div>
</template>
