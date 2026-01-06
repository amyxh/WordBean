import { createRouter, createWebHashHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/index/index.vue')
  },
  {
    path: '/gamePlay',
    name: 'GamePlay',
    component: () => import('../views/game/gamePlay.vue')
  },
  {
    path: '/gameResult',
    name: 'GameResult',
    component: () => import('../views/game/gameResult.vue')
  },
  {
    path: '/setting',
    name: 'Setting',
    component: () => import('../views/setting/settingIndex.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router