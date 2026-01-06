import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAudioService } from './services/audioService'

// 创建Vue应用实例
const app = createApp(App)

// 使用路由
app.use(router)

// 初始化音效服务
initAudioService()

// 挂载应用
app.mount('#app')