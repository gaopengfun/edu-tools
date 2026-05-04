<!-- src/views/dictation/components/WordInput.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const model = defineModel<string>({ required: true });
const props = defineProps<{ disabled?: boolean }>();

const wordCount = computed(() => {
  const text = model.value.trim();
  if (!text) return 0;
  return text.split(/[\n,，、\s]+/).filter(w => w.length > 0).length;
});
</script>

<template>
  <div>
    <label for="word-input"
      class="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider"
    >单词列表</label>
    <textarea
      id="word-input"
      v-model="model"
      class="w-full p-4 border-[1.5px] border-outline-variant rounded-xl text-[15px] leading-relaxed
             text-on-surface bg-surface resize-y min-h-[160px] md:min-h-[200px]
             transition-colors duration-200 outline-none
             focus:border-primary
             disabled:opacity-60 disabled:cursor-not-allowed"
      placeholder="输入单词,支持空格、逗号、换行分隔&#10;例如:apple banana orange"
      rows="6"
      :disabled="props.disabled"
    />
    <p class="text-xs text-on-surface-variant mt-2 text-right">
      已输入 {{ wordCount }} 个单词
    </p>
  </div>
</template>
