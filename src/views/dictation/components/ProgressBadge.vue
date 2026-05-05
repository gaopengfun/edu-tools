<!-- src/views/dictation/components/ProgressBadge.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ current: number; total: number }>();

const percent = computed(() =>
  props.total > 0 ? Math.round((props.current / props.total) * 100) : 0
);
const done = computed(() => props.total > 0 && props.current >= props.total);
</script>

<template>
  <div class="flex flex-col items-end gap-1">
    <div class="text-xl font-semibold text-slate-700 tabular-nums">
      {{ current }} / {{ total }}
    </div>
    <span
      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      :class="done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
      <!-- Star (in progress) -->
      <svg v-if="!done" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.9 7h7.1l-5.7 4.4 2.2 7.1L12 16l-6.5 4.5 2.2-7.1L2 9h7.1z" />
      </svg>
      <!-- Trophy (done) -->
      <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 4h10v3a5 5 0 01-10 0V4zM4 5h2v2a3 3 0 003 3v2H8a4 4 0 01-4-4V5zm16 0v3a4 4 0 01-4 4h-1v-2a3 3 0 003-3V5h2zM10 13h4l-.5 3H14v2h-4v-2h.5L10 13zm-2 7h8v2H8v-2z" />
      </svg>
      <span>{{ done ? '全部完成' : `已完成 ${percent}%` }}</span>
    </span>
  </div>
</template>
