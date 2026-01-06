<template>
  <div class="game-play">
    <div class="game-header">
      <div class="timer">时间: {{ formattedTime }}</div>
      <div class="score">得分: {{ score }}</div>
      <button @click="useHint" class="hint-btn" :disabled="hintCount >= 3">提示 ({{ 3 - hintCount }})</button>
      <button @click="exitGame" class="exit-btn">退出</button>
    </div>
    <div class="game-board" :class="layoutClass">
      <div class="card" 
           v-for="card in cards" 
           :key="card.cardId" 
           :class="getCardClass(card)" 
           @click="selectCard(card)">
        <div class="card-content">
          <template v-if="card.type === 'word'">
            <div class="word-text">{{ card.content }}</div>
          </template>
          <template v-else-if="card.type === 'paraphrase'">
            <div class="paraphrase-text">{{ card.content }}</div>
          </template>
          <template v-else-if="card.type === 'image'">
            <img :src="card.content" alt="Card image" class="card-image">
          </template>
        </div>
      </div>
    </div>
    <div class="game-footer">
      <div class="matched-pairs">{{ matchedPairs }} / {{ totalPairs }} 对</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { gameService } from '@/services/gameService'
import { findMatchingPair } from '@/utils/gameUtil'
import { playSound } from '@/services/audioService'

const router = useRouter()
const route = useRoute()

// 游戏配置
const difficulty = ref(route.query.difficulty || 'easy')
const matchMode = ref(route.query.mode || 'word-paraphrase')

// 游戏状态
const cards = ref([])
const selectedCards = ref([])
const matchedPairs = ref(0)
const totalPairs = ref(0)
const score = ref(0)
const hintCount = ref(0)
const time = ref(0)
const timerInterval = ref(null)
const isProcessing = ref(false)
const loading = ref(true)
const levelData = ref(null)

// 布局类名（简单：3x4，中等：4x5，困难：5x6）
const layoutClass = computed(() => {
  const layoutMap = {
    '3x4': 'layout-3x4',
    '4x5': 'layout-4x5',
    '5x6': 'layout-5x6'
  }
  return layoutMap[levelData.value?.layout || '3x4'] || 'layout-3x4'
})

// 格式化时间
const formattedTime = computed(() => {
  const minutes = Math.floor(time.value / 60)
  const seconds = time.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 获取卡片类名
const getCardClass = (card) => {
  return {
    'selected': card.selected && !card.matched,
    'matched': card.matched,
    'hint': card.hint
  }
}

// 生成关卡
const generateLevel = async () => {
  loading.value = true
  try {
    // 保存当前难度到本地存储，用于重新挑战
    localStorage.setItem('lastDifficulty', difficulty.value)
    // 直接使用合并后的单词库生成关卡
    const result = await gameService.generateLevel(difficulty.value, matchMode.value)
    if (result.success) {
      levelData.value = result.data
      cards.value = result.data.cards
      totalPairs.value = result.data.totalPairs
      matchedPairs.value = 0
      score.value = 0
      hintCount.value = 0
      time.value = 0
      loading.value = false
      startTimer()
    } else {
      alert('生成关卡失败：' + result.message)
      router.push('/')
    }
  } catch (error) {
    console.error('生成关卡失败:', error)
    alert('生成关卡失败：' + error.message)
    router.push('/')
  }
}

// 选择卡片
const selectCard = (card) => {
  if (loading.value || isProcessing.value || card.matched || card.selected) return
  
  // 播放选择音效
  playSound('select')
  
  if (selectedCards.value.length === 0) {
    // 选择第一张卡片
    card.selected = true
    selectedCards.value.push(card)
  } else if (selectedCards.value.length === 1) {
    // 选择第二张卡片
    card.selected = true
    selectedCards.value.push(card)
    checkMatch()
  }
}

// 检查匹配
const checkMatch = async () => {
  isProcessing.value = true
  
  const [card1, card2] = selectedCards.value
  
  try {
    const result = await gameService.checkMatch(card1, card2, levelData.value)
    if (result.success) {
      const { isMatched } = result.data
      
      if (isMatched) {
        // 匹配成功
        playSound('success')
        setTimeout(() => {
          card1.matched = true
          card2.matched = true
          matchedPairs.value++
          score.value += 10
          resetSelection()
          
          // 检查游戏是否结束
          if (matchedPairs.value === totalPairs.value) {
            endGame()
          }
        }, 500)
      } else {
        // 匹配失败
        playSound('fail')
        setTimeout(() => {
          resetSelection()
          score.value = Math.max(0, score.value - 2)
        }, 1000)
      }
    }
  } catch (error) {
    console.error('检查匹配失败:', error)
    resetSelection()
  }
}

// 重置选择
const resetSelection = () => {
  selectedCards.value.forEach(card => {
    card.selected = false
    card.hint = false
  })
  selectedCards.value = []
  isProcessing.value = false
}

// 使用提示
const useHint = () => {
  if (loading.value || isProcessing.value || hintCount.value >= 3) return
  
  // 播放提示音效
  playSound('hint')
  
  hintCount.value++
  
  // 获取提示卡片对
  const hintPair = findMatchingPair(cards.value)
  if (hintPair) {
    const [card1, card2] = hintPair
    card1.hint = true
    card2.hint = true
    
    setTimeout(() => {
      card1.hint = false
      card2.hint = false
    }, 2000)
    
    // 更新关卡数据中的提示次数
    if (levelData.value) {
      levelData.value.hintCount = hintCount.value
    }
  }
}

// 格式化时间
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    time.value++
    
    // 检查时间限制
    if (levelData.value && levelData.value.timeLimit > 0 && time.value >= levelData.value.timeLimit) {
      endGame()
    }
  }, 1000)
}

// 停止计时器
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// 结束游戏
const endGame = async () => {
  stopTimer()
  
  // 播放完成音效
  playSound('complete')
  
  try {
    // 调用游戏服务结束关卡
    const result = await gameService.endLevel(levelData.value)
    if (result.success) {
      // 跳转到结果页面
      router.push({
        path: '/gameResult',
        query: {
          score: score.value,
          time: time.value,
          matchedPairs: matchedPairs.value,
          totalPairs: totalPairs.value,
          isPass: result.data.isPass ? 'true' : 'false',
          medalCount: result.data.medalCount || 0,
          correctRate: result.data.correctRate || 0
        }
      })
    }
  } catch (error) {
    console.error('结束游戏失败:', error)
    // 即使失败也跳转到结果页面，显示基本信息
    router.push({
      path: '/gameResult',
      query: {
        score: score.value,
        time: time.value,
        matchedPairs: matchedPairs.value,
        totalPairs: totalPairs.value,
        isPass: (matchedPairs.value === totalPairs.value).toString()
      }
    })
  }
}

// 退出游戏
const exitGame = () => {
  if (confirm('确定要退出游戏吗？')) {
    stopTimer()
    router.push('/')
  }
}

// 组件挂载时生成关卡
onMounted(() => {
  generateLevel()
})

// 组件卸载时停止计时器
onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.game-play {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f9ff;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timer, .score {
  font-size: 1.1rem;
  font-weight: bold;
}

.hint-btn, .exit-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.hint-btn {
  background-color: #f59e0b;
  color: white;
}

.hint-btn:hover:not(:disabled) {
  background-color: #d97706;
}

.hint-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.exit-btn {
  background-color: #ef4444;
  color: white;
}

.exit-btn:hover {
  background-color: #dc2626;
}

.game-board {
  flex: 1;
  display: grid;
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
  place-items: center;
}

.layout-3x4 {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.layout-4x5 {
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(4, 1fr);
}

.layout-5x6 {
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(5, 1fr);
}

.card {
  width: 100%;
  height: 100%;
  min-height: 80px;
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

.card.selected {
  border-color: #3b82f6;
  background-color: #dbeafe;
  transform: scale(1.05);
}

.card.matched {
  opacity: 0;
  visibility: hidden;
  transform: scale(0);
  transition: all 0.5s ease;
  cursor: default;
}

.card.hint {
  border-color: #f59e0b;
  background-color: #fef3c7;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.card-content {
  text-align: center;
  padding: 1rem;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.word-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1f2937;
}

.paraphrase-text {
  font-size: 1rem;
  color: #4b5563;
}

.card-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.game-footer {
  padding: 1rem;
  background-color: white;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.matched-pairs {
  font-size: 1.1rem;
  font-weight: bold;
  color: #3b82f6;
}
</style>