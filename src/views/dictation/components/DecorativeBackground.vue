<!-- src/views/dictation/components/DecorativeBackground.vue -->
<script setup lang="ts"></script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
    <!-- Cloud 1 - top left -->
    <svg class="absolute top-[8%] left-[6%] w-32 h-20 text-white/30 animate-float-slow"
         viewBox="0 0 100 60" fill="currentColor">
      <ellipse cx="30" cy="40" rx="22" ry="16" />
      <ellipse cx="55" cy="30" rx="26" ry="20" />
      <ellipse cx="78" cy="42" rx="18" ry="14" />
    </svg>

    <!-- Cloud 2 - mid right -->
    <svg class="absolute top-[28%] right-[8%] w-40 h-24 text-white/25 animate-float-slow"
         style="animation-delay: -6s" viewBox="0 0 100 60" fill="currentColor">
      <ellipse cx="28" cy="42" rx="20" ry="14" />
      <ellipse cx="52" cy="32" rx="28" ry="22" />
      <ellipse cx="80" cy="40" rx="20" ry="16" />
    </svg>

    <!-- Cloud 3 - bottom left -->
    <svg class="absolute bottom-[18%] left-[12%] w-28 h-16 text-white/20 animate-float-slow"
         style="animation-delay: -12s" viewBox="0 0 100 60" fill="currentColor">
      <ellipse cx="32" cy="38" rx="22" ry="16" />
      <ellipse cx="60" cy="30" rx="24" ry="18" />
    </svg>

    <!-- Sparkle 1 -->
    <svg class="absolute top-[20%] right-[28%] w-4 h-4 text-white/60"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
    </svg>

    <!-- Sparkle 2 -->
    <svg class="absolute top-[60%] right-[18%] w-3 h-3 text-white/40"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
    </svg>

    <!-- Sparkle 3 -->
    <svg class="absolute top-[42%] left-[18%] w-3 h-3 text-white/50"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
    </svg>
  </div>
</template>
