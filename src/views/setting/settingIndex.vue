<template>
  <div class="setting-index">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn" 
              @mouseenter="isHovered = true" @mouseleave="isHovered = false">
        <span class="back-icon">←</span>
        <span class="back-text">返回首页</span>
      </button>
    </div>
    <div class="setting-card">
      <div class="setting-section">
        <h3>安全管控</h3>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">每日学习时长限制</div>
            <div class="setting-description">设置每日最大学习时长（分钟）</div>
          </div>
          <div class="setting-control">
            <input type="number" v-model="dailyTimeLimit" @change="changeDailyTimeLimit" class="number-input" min="0" max="120">
            <span class="unit">分钟</span>
          </div>
        </div>
      </div>
      <div class="setting-section">
        <h3>关于</h3>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">版本</div>
            <div class="setting-value">1.0.0</div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">开发者</div>
            <div class="setting-value">单词豆团队</div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">隐私政策</div>
          </div>
          <div class="setting-control">
            <button @click="openPrivacy" class="text-btn">查看</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 游戏设置
const dailyTimeLimit = ref(30)
const loading = ref(false)
const isHovered = ref(false)

// 加载设置数据
const loadSettings = async () => {
  loading.value = true
  try {
    // 从本地存储中加载设置
    const settingStr = localStorage.getItem('wordBeanSetting')
    if (settingStr) {
      const setting = JSON.parse(settingStr)
      dailyTimeLimit.value = setting.dailyTimeLimit || 30
    }
  } catch (error) {
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('加载设置失败', { module: 'SettingIndex' }, error)
    })
  } finally {
    loading.value = false
  }
}

// 保存设置
const saveSetting = async (updateData) => {
  try {
    // 保存到本地存储
    const settingStr = localStorage.getItem('wordBeanSetting')
    const currentSetting = settingStr ? JSON.parse(settingStr) : {}
    const newSetting = { ...currentSetting, ...updateData }
    localStorage.setItem('wordBeanSetting', JSON.stringify(newSetting))
  } catch (error) {
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('保存设置失败', { module: 'SettingIndex', updateData }, error)
    })
  }
}

// 切换每日学习时长限制
const changeDailyTimeLimit = async () => {
  await saveSetting({ dailyTimeLimit: parseInt(dailyTimeLimit.value) || 0 })
}

// 打开隐私政策
const openPrivacy = () => {
  import('@/utils/logUtil').then(({ debug }) => {
    debug('打开隐私政策', { module: 'SettingIndex' })
  })
  alert('隐私政策查看功能开发中！')
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.setting-index {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
  background-color: #f0f9ff;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.back-btn {
  background-color: transparent;
  color: #3b82f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  text-decoration: none;
  outline: none;
  user-select: none;
}

.back-btn:hover {
  transform: translateX(-2px);
  transition: all 0.2s ease;
}

.back-btn:active {
  transform: translateX(-1px);
  transition: all 0.1s ease;
}

.back-btn:active .back-text,
.back-btn:active .back-icon {
  font-size: 1.05rem;
  transition: font-size 0.15s ease;
}

.back-icon {
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.2s ease;
  display: inline-block;
}

.back-btn:hover .back-icon {
  transform: translateX(-2px);
}

.back-text {
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .back-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
  
  .back-icon {
    font-size: 1rem;
  }
  
  .back-text {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .back-btn {
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
  }
  
  .back-icon {
    font-size: 0.95rem;
  }
  
  .back-text {
    font-size: 0.85rem;
  }
}

h2 {
  text-align: center;
  color: #3b82f6;
  margin: 0;
  margin-bottom: 1.5rem;
}

.setting-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.setting-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.setting-section:last-child {
  border-bottom: none;
}

.setting-section h3 {
  margin-bottom: 1rem;
  color: #1f2937;
  font-size: 1.1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: 1rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.setting-description {
  font-size: 0.85rem;
  color: #6b7280;
}

.setting-value {
  font-size: 0.9rem;
  color: #3b82f6;
  font-weight: bold;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-input, .number-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  width: 120px;
}

.number-input {
  width: 80px;
  text-align: center;
}

.unit {
  font-size: 0.9rem;
  color: #6b7280;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background-color: #3b82f6;
  color: white;
}

.action-btn:hover {
  background-color: #2563eb;
}

.action-btn.danger {
  background-color: #ef4444;
}

.action-btn.danger:hover {
  background-color: #dc2626;
}

.text-btn {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
}

.text-btn:hover {
  color: #2563eb;
}
</style>