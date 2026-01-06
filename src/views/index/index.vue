<template>
  <div class="home-container">
    <!-- 右上角设置 -->
    <div class="top-right-settings">
      <div class="setting-item">
        <span class="setting-label">音效</span>
        <button @click="toggleSound" class="toggle-btn" :class="{ 'active': soundEnabled }">
          <span class="toggle-slider"></span>
        </button>
      </div>
      <div class="setting-item">
        <span class="setting-label">音乐</span>
        <button @click="toggleMusic" class="toggle-btn" :class="{ 'active': musicEnabled }">
          <span class="toggle-slider"></span>
        </button>
      </div>
    </div>
    
    <!-- 标题 -->
    <div class="title-section">
      <h1>单词豆</h1>
      <p>儿童英语单词记忆游戏</p>
    </div>
    
    <!-- 难度选择 -->
    <div class="difficulty-section">
      <h3>选择难度</h3>
      <div class="difficulty-buttons">
        <button 
          class="difficulty-btn" 
          :class="{ 'selected': selectedDifficulty === 'easy' }"
          @click="selectDifficulty('easy')">简单</button>
        <button 
          class="difficulty-btn" 
          :class="{ 'selected': selectedDifficulty === 'medium' }"
          @click="selectDifficulty('medium')">中等</button>
        <button 
          class="difficulty-btn" 
          :class="{ 'selected': selectedDifficulty === 'hard' }"
          @click="selectDifficulty('hard')">困难</button>
      </div>
    </div>
    
    <!-- 功能按钮 -->
    <div class="menu-list">
      <button @click="startGame" class="primary-btn">开始游戏</button>
      <button @click="$router.push('/setting')" class="secondary-btn">设置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import defaultWordSets from '@/assets/defaultWordSets.json'
import { setSoundEnabled, setMusicEnabled } from '@/services/audioService'

const router = useRouter()

// 游戏设置
const soundEnabled = ref(true)
const musicEnabled = ref(true)
const selectedDifficulty = ref('easy')

// 加载设置
const loadSettings = () => {
  try {
    const settingStr = localStorage.getItem('wordBeanSetting')
    if (settingStr) {
      const setting = JSON.parse(settingStr)
      soundEnabled.value = setting.soundEnabled !== false
      musicEnabled.value = setting.musicEnabled !== false
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 保存设置
const saveSetting = (updateData) => {
  try {
    const settingStr = localStorage.getItem('wordBeanSetting')
    const currentSetting = settingStr ? JSON.parse(settingStr) : {}
    const newSetting = { ...currentSetting, ...updateData }
    localStorage.setItem('wordBeanSetting', JSON.stringify(newSetting))
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

// 切换音效
const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  saveSetting({ soundEnabled: soundEnabled.value })
  // 更新音频服务的音效设置
  setSoundEnabled(soundEnabled.value)
}

// 切换背景音乐
const toggleMusic = () => {
  musicEnabled.value = !musicEnabled.value
  saveSetting({ musicEnabled: musicEnabled.value })
  // 更新音频服务的音乐设置
  setMusicEnabled(musicEnabled.value)
}

// 选择难度
const selectDifficulty = (difficulty) => {
  selectedDifficulty.value = difficulty
  // 保存选择的难度到本地存储，用于重新挑战
  localStorage.setItem('lastDifficulty', difficulty)
}

// 开始游戏
const startGame = () => {
  // 跳转到游戏页面，传递难度信息
  router.push({
    path: '/gamePlay',
    query: {
      difficulty: selectedDifficulty.value
    }
  })
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f9ff;
  text-align: center;
  padding: 20px;
  position: relative;
}

/* 右上角设置 */
.top-right-settings {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* 开关样式 */
.toggle-btn {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background-color: #e5e7eb;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background-color: #3b82f6;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  transition: all 0.3s ease;
}

.toggle-btn.active .toggle-slider {
  transform: translateX(18px);
}

/* 标题部分 */
.title-section {
  margin-bottom: 40px;
}

h1 {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  color: #64748b;
  margin-bottom: 2rem;
}

/* 难度选择部分 */
.difficulty-section {
  margin-bottom: 40px;
  width: 100%;
  max-width: 300px;
}

.difficulty-section h3 {
  font-size: 1.2rem;
  color: #374151;
  margin-bottom: 15px;
}

.difficulty-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.difficulty-btn {
  padding: 8px 20px;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #374151;
}

.difficulty-btn:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.difficulty-btn.selected {
  border-color: #3b82f6;
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* 功能按钮 */
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 300px;
}

.primary-btn, .secondary-btn {
  padding: 15px 25px;
  font-size: 1.1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.primary-btn {
  background-color: #3b82f6;
  color: white;
}

.primary-btn:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.secondary-btn {
  background-color: white;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.secondary-btn:hover {
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>