<!-- src/views/dictation/components/PlaybackSettings.vue -->
<script setup lang="ts">
const repeatCount = defineModel<number>('repeatCount', { required: true });
const speechRate = defineModel<number>('speechRate', { required: true });
const props = defineProps<{ disabled?: boolean }>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-sky-50/60 rounded-2xl">
    <div>
      <label for="repeat-count" class="block text-xs font-medium text-slate-500 mb-2"
        >重复次数</label
      >
      <div class="flex items-center gap-3">
        <input
          id="repeat-count"
          v-model.number="repeatCount"
          type="range"
          min="1"
          max="5"
          step="1"
          class="sky-range flex-1"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-slate-700 min-w-6 text-center">
          {{ repeatCount }}
        </span>
      </div>
    </div>
    <div>
      <label for="speech-rate" class="block text-xs font-medium text-slate-500 mb-2">语速</label>
      <div class="flex items-center gap-3">
        <input
          id="speech-rate"
          v-model.number="speechRate"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          class="sky-range flex-1"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-slate-700 min-w-8 text-center">
          {{ speechRate }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sky-range {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: rgb(186 230 253);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.sky-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: rgb(14 165 233);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgb(14 165 233 / 0.35);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.sky-range::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgb(14 165 233 / 0.5);
}

.sky-range::-moz-range-track {
  height: 6px;
  background: rgb(186 230 253);
  border-radius: 9999px;
}

.sky-range::-moz-range-progress {
  height: 6px;
  background: rgb(56 189 248);
  border-radius: 9999px;
}

.sky-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: rgb(14 165 233);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgb(14 165 233 / 0.35);
  cursor: pointer;
}

.sky-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px rgb(14 165 233 / 0.25);
}

.sky-range:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 4px rgb(14 165 233 / 0.25);
}

.sky-range:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
