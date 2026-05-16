<!-- 索引/导航页通用渐变 + 柔光装饰背景，无具象图形 -->
<script setup lang="ts"></script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
    <!-- 页面整体浅色渐变底 -->
    <div class="absolute inset-0 bg-gradient-to-b from-bg-from via-bg-via to-bg-to" />

    <!-- 柔光 blob 1 - 左上 -->
    <div
      class="absolute -top-24 -left-16 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-30 bg-gradient-to-br from-brand-from to-brand-to"
    />

    <!-- 柔光 blob 2 - 右下 -->
    <div
      class="absolute -bottom-32 -right-20 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-brand-to to-brand-from"
    />
  </div>
</template>
