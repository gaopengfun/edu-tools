import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/oss-check',
    },
    {
      path: '/oss-check',
      name: 'oss-check',
      component: () => import('@/views/oss-check/OssCheck.vue'),
    },
  ],
})

export default router
