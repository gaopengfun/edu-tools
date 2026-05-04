import { createRouter, createWebHashHistory } from 'vue-router';

const routes = {
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'tool-list',
      component: () => import('@/views/tool-list/ToolList.vue')
    },
    {
      path: '/dictation',
      name: 'dictation',
      component: () => import('@/views/dictation/Dictation.vue'),
    },
    // @tool-scaffold:routes
  ]
}

const router = createRouter(routes);

export default router;
