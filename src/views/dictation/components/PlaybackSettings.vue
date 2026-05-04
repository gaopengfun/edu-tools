<!-- src/views/dictation/components/PlaybackSettings.vue -->
<script setup lang="ts">
const repeatCount = defineModel<number>('repeatCount', { required: true });
const speechRate = defineModel<number>('speechRate', { required: true });
const props = defineProps<{ disabled?: boolean }>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface rounded-xl">
    <div>
      <label for="repeat-count"
        class="block text-xs font-medium text-on-surface-variant mb-2"
      >重复次数</label>
      <div class="flex items-center gap-3">
        <input
          id="repeat-count"
          v-model.number="repeatCount"
          type="range" min="1" max="5" step="1"
          class="flex-1 accent-primary"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-on-surface min-w-6 text-center">
          {{ repeatCount }}
        </span>
      </div>
    </div>
    <div>
      <label for="speech-rate"
        class="block text-xs font-medium text-on-surface-variant mb-2"
      >语速</label>
      <div class="flex items-center gap-3">
        <input
          id="speech-rate"
          v-model.number="speechRate"
          type="range" min="0.5" max="2" step="0.1"
          class="flex-1 accent-primary"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-on-surface min-w-8 text-center">
          {{ speechRate }}
        </span>
      </div>
    </div>
  </div>
</template>
