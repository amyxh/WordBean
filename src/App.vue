<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { initDatabase } from './db/index'
import logUtil from './utils/logUtil'

// App根组件，负责路由视图渲染

// 应用启动时初始化数据库
onMounted(async () => {
  try {
    await initDatabase()
    logUtil.info('数据库初始化完成', { module: 'App' })
  } catch (error) {
    logUtil.error('数据库初始化失败', { module: 'App' }, error)
  }
})
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

#app {
  max-width: 100vw;
  max-height: 100vh;
  overflow: hidden;
}
</style>