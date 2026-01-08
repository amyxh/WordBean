<template>
  <div class="game-play">
    <div class="game-header">
      <div class="timer">时间: {{ formattedTime }}</div>
      <div class="score">得分: {{ score }}</div>
      <button @click="useHint" class="hint-btn" :disabled="hintCount >= 3">提示 ({{ 3 - hintCount }})</button>
      <button @click="exitGame" class="exit-btn">退出</button>
    </div>
    <div class="game-board" :class="layoutClass" :style="boardStyle">
      <div class="card" 
           v-for="card in cards" 
           :key="card.cardId" 
           :class="getCardClass(card)" 
           :style="cardStyle"
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

// 动态计算网格布局，根据卡片数量自动调整行列数
const layoutClass = computed(() => {
  const cardCount = cards.value.length
  // 计算最合适的行列数，使卡片排列成接近正方形的网格
  const columns = Math.ceil(Math.sqrt(cardCount))
  const rows = Math.ceil(cardCount / columns)
  return `layout-${columns}x${rows}`
})

// 计算卡片大小，根据屏幕尺寸和卡片数量动态调整
const cardSize = computed(() => {
  const cardCount = cards.value.length
  const columns = Math.ceil(Math.sqrt(cardCount))
  // 根据屏幕宽度和列数计算卡片大小，确保有适当的间距
  const baseSize = Math.min(100, Math.floor(400 / columns))
  return `${baseSize}px`
})

// 游戏板样式，动态调整网格布局
const boardStyle = computed(() => {
  const cardCount = cards.value.length
  const columns = Math.ceil(Math.sqrt(cardCount))
  return {
    gridTemplateColumns: `repeat(${columns}, minmax(${cardSize.value}, 1fr))`,
    gridTemplateRows: `repeat(auto-fit, ${cardSize.value})`,
    gap: '0.8rem'
  }
})

// 卡片样式，动态调整大小
const cardStyle = computed(() => {
  return {
    width: cardSize.value,
    height: cardSize.value
  }
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
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('生成关卡失败', { module: 'GamePlay' }, error)
    })
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
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('检查匹配失败', { module: 'GamePlay' }, error)
    })
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

// 启动计时器
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
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('结束游戏失败', { module: 'GamePlay' }, error)
    })
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
  overflow: hidden;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 0.5rem;
}

.timer, .score {
  font-size: 1rem;
  font-weight: bold;
  white-space: nowrap;
}

.hint-btn, .exit-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  white-space: nowrap;
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
  padding: 0.6rem 0.8rem;
  overflow: auto;
  place-items: center;
  justify-content: center;
  align-content: center;
  transition: all 0.3s ease;
  max-width: 85%;
  margin: 0 auto;
  width: 100%;
}

/* 动态布局类，根据行列数自动调整 */
[class^="layout-"] {
  gap: 0.4rem;
}

/* 响应式设计 - 根据屏幕宽度调整间距 */
@media (max-width: 768px) {
  .game-board {
    gap: 0.35rem;
    padding: 0.5rem 0.6rem;
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .game-board {
    gap: 0.3rem;
    padding: 0.4rem;
    max-width: 95%;
  }
}

/* 卡片基础样式 */
.card {
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  min-width: 40px;
  min-height: 40px;
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
  padding: 0.3rem;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.word-text {
  font-size: clamp(0.75rem, 3vw, 0.95rem);
  font-weight: bold;
  color: #1f2937;
  line-height: 1.15;
  word-break: break-word;
  overflow-wrap: break-word;
  letter-spacing: -0.02em;
}

.paraphrase-text {
  font-size: clamp(0.6rem, 2.5vw, 0.75rem);
  color: #4b5563;
  line-height: 1.15;
  word-break: break-word;
  overflow-wrap: break-word;
  letter-spacing: -0.01em;
}

.card-image {
  max-width: 75%;
  max-height: 75%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.card:hover .card-image {
  transform: scale(1.05);
}

/* 响应式字体调整 */
@media (max-width: 768px) {
  .word-text {
    font-size: clamp(0.75rem, 3vw, 0.9rem);
  }
  
  .paraphrase-text {
    font-size: clamp(0.6rem, 2.5vw, 0.75rem);
  }
}

@media (max-width: 480px) {
  .card-content {
    padding: 0.3rem;
  }
  
  .word-text {
    font-size: clamp(0.7rem, 3.5vw, 0.85rem);
  }
  
  .paraphrase-text {
    font-size: clamp(0.55rem, 3vw, 0.7rem);
  }
}

.game-footer {
  padding: 0.5rem 1rem;
  background-color: white;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
}

.matched-pairs {
  font-size: 1rem;
  font-weight: bold;
  color: #3b82f6;
}
</style>