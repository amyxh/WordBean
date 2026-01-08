<template>
  <div class="game-play">
    <!-- 右上角独立音效和音乐开关 -->
    <div class="top-right-settings">
      <div class="audio-icon-btn-container">
        <button @click="toggleSound" class="audio-icon-btn" :class="{ 'muted': !soundEnabled }" title="音效">
          <span class="audio-icon-text">🔊</span>
        </button>
      </div>
      <div class="audio-icon-btn-container">
        <button @click="toggleMusic" class="audio-icon-btn" :class="{ 'muted': !musicEnabled }" title="音乐">
          <span class="audio-icon-text">🎵</span>
        </button>
      </div>
    </div>
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

// 设备检测
const isMobile = ref(false)

// 监听窗口大小变化，检测设备类型
const checkDeviceType = () => {
  isMobile.value = window.innerWidth < 768
}

// 动态计算网格布局，根据卡片数量和设备类型自动调整行列数
const layoutConfig = computed(() => {
  const cardCount = cards.value.length
  let columns, rows
  
  if (isMobile.value) {
    // 移动设备：优先考虑纵向排列，减少列数，增大卡片尺寸
    if (cardCount <= 8) {
      columns = 2
    } else if (cardCount <= 12) {
      columns = 3
    } else if (cardCount <= 16) {
      columns = 4
    } else {
      columns = Math.min(5, Math.ceil(Math.sqrt(cardCount)))
    }
  } else {
    // 桌面设备：优先考虑正方形排列，最大化利用空间
    columns = Math.ceil(Math.sqrt(cardCount))
  }
  
  rows = Math.ceil(cardCount / columns)
  return { columns, rows }
})

// 布局类名
const layoutClass = computed(() => {
  const { columns, rows } = layoutConfig.value
  return `layout-${columns}x${rows}`
})

// 计算卡片大小，根据屏幕尺寸、设备类型和卡片数量动态调整
const cardSize = computed(() => {
  const { columns } = layoutConfig.value
  const cardCount = cards.value.length
  
  // 获取可用的视口高度和宽度
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // 扣除头部和底部的高度
  const headerHeight = 60 // 估计值，可根据实际调整
  const footerHeight = 50 // 估计值，可根据实际调整
  const availableHeight = viewportHeight - headerHeight - footerHeight - 40 // 40px为padding
  
  // 计算最大可用宽度和高度
  const maxAvailableWidth = viewportWidth - 40 // 40px为padding
  const maxCardWidth = Math.floor(maxAvailableWidth / columns) - 10 // 10px为间距
  const maxCardHeight = Math.floor(availableHeight / Math.ceil(cardCount / columns)) - 10 // 10px为间距
  
  // 取宽高中的较小值，确保卡片为正方形
  const baseSize = Math.min(maxCardWidth, maxCardHeight, isMobile.value ? 80 : 100)
  
  // 确保最小尺寸
  return `${Math.max(baseSize, isMobile.value ? 50 : 60)}px`
})

// 计算间距
const gapSize = computed(() => {
  return isMobile.value ? '0.3rem' : '0.4rem'
})

// 游戏板样式，动态调整网格布局
const boardStyle = computed(() => {
  const { columns } = layoutConfig.value
  return {
    gridTemplateColumns: `repeat(${columns}, ${cardSize.value})`,
    gridTemplateRows: `repeat(auto-fill, ${cardSize.value})`,
    gap: gapSize.value,
    overflow: 'hidden'
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
      console.warn('关卡生成失败，尝试使用默认配置重新生成：', result.message)
      // 使用默认配置重新生成关卡，避免跳回首页
      const defaultResult = await gameService.generateLevel('easy', 'word-paraphrase')
      if (defaultResult.success) {
        levelData.value = defaultResult.data
        cards.value = defaultResult.data.cards
        totalPairs.value = defaultResult.data.totalPairs
        matchedPairs.value = 0
        score.value = 0
        hintCount.value = 0
        time.value = 0
        loading.value = false
        startTimer()
      } else {
        alert('生成关卡失败：' + defaultResult.message)
        router.push('/')
      }
    }
  } catch (error) {
    console.error('生成关卡失败：', error)
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('生成关卡失败', { module: 'GamePlay' }, error)
    })
    // 使用默认配置重新生成关卡，避免跳回首页
    try {
      const defaultResult = await gameService.generateLevel('easy', 'word-paraphrase')
      if (defaultResult.success) {
        levelData.value = defaultResult.data
        cards.value = defaultResult.data.cards
        totalPairs.value = defaultResult.data.totalPairs
        matchedPairs.value = 0
        score.value = 0
        hintCount.value = 0
        time.value = 0
        loading.value = false
        startTimer()
      } else {
        alert('生成关卡失败：' + defaultResult.message)
        router.push('/')
      }
    } catch (defaultError) {
      alert('生成关卡失败：' + defaultError.message)
      router.push('/')
    }
  }
}

// 选择卡片
const selectCard = (card) => {
  if (loading.value || isProcessing.value || card.matched || card.selected) return
  
  // 播放选择音效
  import('@/services/audioService').then((audioService) => {
    audioService.playSound('select')
  })
  
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
        import('@/services/audioService').then((audioService) => {
          audioService.playSound('success')
        })
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
        import('@/services/audioService').then((audioService) => {
          audioService.playSound('fail')
        })
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
  import('@/services/audioService').then((audioService) => {
    audioService.playSound('hint')
  })
  
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
  import('@/services/audioService').then((audioService) => {
    audioService.playSound('complete')
  })
  
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
  // 初始化设备检测
  checkDeviceType()
  // 监听窗口大小变化
  window.addEventListener('resize', checkDeviceType)
})

// 音频设置
const soundEnabled = ref(true)
const musicEnabled = ref(true)
const soundVolume = ref(0.7)
const musicVolume = ref(0.5)

// 切换音效开关
const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  import('@/services/audioService').then((audioService) => {
    audioService.setSoundEnabled(soundEnabled.value)
  })
  localStorage.setItem('soundEnabled', soundEnabled.value)
}

// 切换音乐开关
const toggleMusic = () => {
  musicEnabled.value = !musicEnabled.value
  import('@/services/audioService').then((audioService) => {
    audioService.setMusicEnabled(musicEnabled.value)
  })
  localStorage.setItem('musicEnabled', musicEnabled.value)
}

// 更新音效音量
const updateSoundVolume = () => {
  import('@/services/audioService').then((audioService) => {
    audioService.setSoundVolume(soundVolume.value)
  })
  localStorage.setItem('soundVolume', soundVolume.value)
}

// 更新音乐音量
const updateMusicVolume = () => {
  import('@/services/audioService').then((audioService) => {
    audioService.setMusicVolume(musicVolume.value)
  })
  localStorage.setItem('musicVolume', musicVolume.value)
}

// 初始化音频设置
const initAudioSettings = () => {
  // 从本地存储加载设置
  soundEnabled.value = localStorage.getItem('soundEnabled') !== 'false'
  musicEnabled.value = localStorage.getItem('musicEnabled') !== 'false'
  soundVolume.value = parseFloat(localStorage.getItem('soundVolume')) || 0.7
  musicVolume.value = parseFloat(localStorage.getItem('musicVolume')) || 0.5
  
  // 应用设置
  import('@/services/audioService').then((audioService) => {
    audioService.setSoundEnabled(soundEnabled.value)
    audioService.setMusicEnabled(musicEnabled.value)
    audioService.setSoundVolume(soundVolume.value)
    audioService.setMusicVolume(musicVolume.value)
  })
}

// 组件挂载时生成关卡
onMounted(() => {
  generateLevel()
  // 初始化设备检测
  checkDeviceType()
  // 监听窗口大小变化
  window.addEventListener('resize', checkDeviceType)
  // 初始化音频设置
  initAudioSettings()
  // 初始化音频服务，开始播放音乐
  import('@/services/audioService').then((audioService) => {
    audioService.initAudioService()
  })
})

// 组件卸载时停止计时器和移除事件监听
onUnmounted(() => {
  stopTimer()
  window.removeEventListener('resize', checkDeviceType)
  // 停止音乐播放
  import('@/services/audioService').then((audioService) => {
    audioService.stopBgm()
  })
})
</script>

<style scoped>
.game-play {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f9ff;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 2rem;
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  max-height: 80px;
}

.timer, .score {
  font-size: 1rem;
  font-weight: bold;
  white-space: nowrap;
}

.hint-btn, .exit-btn {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
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
  padding: 1.5rem;
  overflow: hidden;
  place-items: center;
  justify-content: center;
  align-content: center;
  transition: all 0.3s ease;
  max-width: 90%;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  background: radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, rgba(240, 249, 255, 0) 70%);
  border-radius: 12px;
  margin: 1rem 0;
  min-height: 0;
}

/* 动态布局类，根据行列数自动调整 */
[class^="layout-"] {
  gap: 0.6rem;
  justify-items: center;
  align-items: center;
  grid-template-columns: repeat(auto-fit, minmax(80px, auto));
}

/* 响应式设计 - 根据屏幕宽度调整间距 */
@media (max-width: 768px) {
  .game-board {
    padding: 0.4rem;
    max-width: 95%;
  }
  
  [class^="layout-"] {
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .game-board {
    padding: 0.3rem;
    max-width: 100%;
  }
  
  [class^="layout-"] {
    gap: 0.4rem;
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
  padding: 0.5rem;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-direction: column;
  gap: 0.2rem;
}

.word-text {
  font-size: clamp(0.8rem, 3.5vw, 1rem);
  font-weight: bold;
  color: #1f2937;
  line-height: 1.2;
  word-break: break-word;
  overflow-wrap: break-word;
  letter-spacing: -0.01em;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.paraphrase-text {
  font-size: clamp(0.65rem, 3vw, 0.8rem);
  color: #4b5563;
  line-height: 1.2;
  word-break: break-word;
  overflow-wrap: break-word;
  letter-spacing: -0.01em;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.card-image {
  max-width: 85%;
  max-height: 85%;
  object-fit: contain;
  transition: transform 0.3s ease;
  margin: 0 auto;
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
  padding: 0.6rem 2rem;
  background-color: white;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  max-height: 60px;
}

.matched-pairs {
  font-size: 1rem;
  font-weight: bold;
  color: #3b82f6;
}

/* 音频设置样式 */
.audio-settings {
  position: relative;
  display: flex;
  align-items: center;
}

.audio-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: white;
  font-size: 1.2rem;
}

.audio-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.audio-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  min-width: 280px;
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6b7280;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.setting-item label {
  font-size: 0.9rem;
  color: #4b5563;
  font-weight: 500;
  min-width: 80px;
}

/* 开关按钮样式 */
.toggle-btn {
  position: relative;
  width: 50px;
  height: 24px;
  background-color: #d1d5db;
  border-radius: 12px;
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
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-btn.active .toggle-slider {
  transform: translateX(26px);
}

/* 音量滑块样式 */
.slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  transition: all 0.2s ease;
}

.slider:hover {
  background: #d1d5db;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-webkit-slider-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
}

.slider::-moz-range-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.volume-value {
  min-width: 45px;
  font-size: 0.8rem;
  color: #6b7280;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .audio-panel {
    min-width: 260px;
    padding: 0.8rem;
  }
  
  .setting-item {
    gap: 0.8rem;
  }
  
  .setting-item label {
    min-width: 70px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .audio-panel {
    min-width: 240px;
    right: -1rem;
  }
  
  .audio-btn {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }
}

/* 确保音频面板在小屏幕上不会溢出 */
@media (max-width: 320px) {
  .audio-panel {
    min-width: 220px;
    padding: 0.6rem;
  }
  
  .setting-item {
    gap: 0.6rem;
  }
  
  .setting-item label {
    min-width: 65px;
    font-size: 0.8rem;
  }
}

/* 右上角独立音效和音乐开关样式 */
.top-right-settings {
  position: absolute;
  top: 60px; /* 工具栏下方，保持10px间距 */
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 999;
  transition: top 0.3s ease;
}

.audio-icon-btn-container {
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.audio-icon-btn-container:hover {
  /* 移除hover效果 */
}

/* 音频图标按钮 */
.audio-icon-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: opacity 0.2s ease;
  position: relative;
}

.audio-icon-btn:hover {
  opacity: 0.8;
}

.audio-icon-btn:active {
  opacity: 0.6;
}

/* 音频图标文本 - 扁平设计样式 */
.audio-icon-text {
  font-size: 14px;
  color: #6b7280;
  transition: opacity 0.2s ease;
}

/* 静音状态样式 - 斜划线 */
.audio-icon-btn.muted .audio-icon-text {
  opacity: 0.5;
  position: relative;
  display: inline-block;
}

.audio-icon-btn.muted .audio-icon-text::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -5px;
  right: -5px;
  height: 2px;
  background-color: #ef4444;
  transform: translateY(-50%) rotate(45deg);
  opacity: 1;
  z-index: 1;
  animation: slashAppear 0.3s ease;
  box-shadow: 0 0 1px rgba(239, 68, 68, 0.7);
}

/* 斜划线出现动画 */
@keyframes slashAppear {
  0% {
    width: 0;
    opacity: 0;
  }
  100% {
    width: calc(100% + 10px);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-right-settings {
    top: 60px;
    right: 15px;
    gap: 4px;
  }
  
  .audio-icon-btn {
    width: 32px;
    height: 32px;
  }
  
  .audio-icon-text {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .top-right-settings {
    top: 55px;
    right: 10px;
    gap: 3px;
  }
  
  .audio-icon-btn {
    width: 30px;
    height: 30px;
  }
  
  .audio-icon-text {
    font-size: 13px;
  }
}
</style>