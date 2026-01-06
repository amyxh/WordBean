<template>
  <div class="game-select">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn">返回首页</button>
      <h2>开始游戏</h2>
    </div>
    <div class="select-section">
      <h3>选择单词集</h3>
      <div class="word-set-options">
        <div class="word-set-option" v-for="set in wordSets" :key="set.setId" @click="selectWordSet(set)">
          <h4>{{ set.setName }}</h4>
          <p>{{ set.words.length }}个单词</p>
        </div>
      </div>
    </div>
    <div class="select-section">
      <h3>选择难度</h3>
      <div class="difficulty-options">
        <button class="difficulty-btn" @click="selectDifficulty('easy')">简单</button>
        <button class="difficulty-btn" @click="selectDifficulty('medium')">中等</button>
        <button class="difficulty-btn" @click="selectDifficulty('hard')">困难</button>
      </div>
    </div>
    <div class="select-section">
      <h3>选择匹配模式</h3>
      <div class="mode-options">
        <button class="mode-btn" @click="selectMode('word-paraphrase')">单词-释义</button>
        <button class="mode-btn" @click="selectMode('word-image')">单词-图片</button>
      </div>
    </div>
    <button class="start-btn" @click="startGame" :disabled="!selectedWordSet">开始游戏</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import defaultWordSets from '@/assets/defaultWordSets.json'

const router = useRouter()
const route = useRoute()

// 单词集列表
const wordSets = ref([])

// 选择的单词集
const selectedWordSet = ref(null)

// 选择的难度
const selectedDifficulty = ref('easy')

// 选择的匹配模式
const selectedMode = ref('word-paraphrase')

// 初始化单词集数据
const initWordSets = () => {
  // 直接使用默认单词集数据，并添加setId
  wordSets.value = defaultWordSets.map((set, index) => ({
    ...set,
    setId: `default_set_${index}`
  }))
  
  // 检查URL参数中是否有setId，如果有则自动选择对应的单词集
  const setId = route.query.setId
  if (setId) {
    const setFromUrl = wordSets.value.find(set => set.setId === setId)
    if (setFromUrl) {
      selectedWordSet.value = setFromUrl
    }
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  initWordSets()
})

// 选择单词集
const selectWordSet = (wordSet) => {
  selectedWordSet.value = wordSet
}

// 选择难度
const selectDifficulty = (difficulty) => {
  selectedDifficulty.value = difficulty
}

// 选择匹配模式
const selectMode = (mode) => {
  selectedMode.value = mode
}

// 开始游戏
const startGame = () => {
  if (!selectedWordSet.value) {
    alert('请选择一个单词集')
    return
  }
  
  // 跳转到游戏页面，传递完整的单词集数据
  router.push({
    path: '/gamePlay',
    query: {
      wordSetData: JSON.stringify(selectedWordSet.value),
      difficulty: selectedDifficulty.value,
      mode: selectedMode.value
    }
  })
}
</script>

<style scoped>
.game-select {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.back-btn {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #4b5563;
}

h2 {
  text-align: center;
  color: #3b82f6;
  margin: 0;
  margin-bottom: 2rem;
}

.select-section {
  margin-bottom: 2rem;
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.select-section h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.word-set-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.word-set-option {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.word-set-option:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.word-set-option h4 {
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.word-set-option p {
  color: #6b7280;
  font-size: 0.9rem;
}

.difficulty-options,
.mode-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.difficulty-btn,
.mode-btn {
  padding: 0.8rem 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.difficulty-btn:hover,
.mode-btn:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.start-btn {
  display: block;
  margin: 0 auto;
  padding: 1rem 2rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.start-btn:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>