<template>
  <div class="home-container">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import defaultWordSets from '@/assets/defaultWordSets.json'

const router = useRouter()

// 游戏设置
const selectedDifficulty = ref('easy')

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