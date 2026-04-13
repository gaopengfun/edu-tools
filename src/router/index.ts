import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'tool-list',
      component: () => import('@/views/tool-list/ToolList.vue')
    },
    {
      path: '/oss-check',
      name: 'oss-check',
      component: () => import('@/views/oss-check/OssCheck.vue'),
    },
    // @tool-scaffold:routes
  ]
});

export default router;
