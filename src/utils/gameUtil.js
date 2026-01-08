// 游戏工具类
import logUtil from './logUtil'

// Fisher-Yates 洗牌算法（用于随机排列卡片）
export const shuffleCards = (cards) => {
  // 深拷贝卡片数组，避免修改原数组
  const newCards = [...cards]
  for (let i = newCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    // 使用传统方式交换位置，避免解构赋值可能导致的暂时性死区问题
    const temp = newCards[i]
    newCards[i] = newCards[j]
    newCards[j] = temp
  }
  return newCards
}

// 检查两张卡片是否匹配
export const checkCardMatch = (card1, card2) => {
  return (card1.wordId === card2.wordId) && 
         ((card1.type === 'word' && card2.type !== 'word') || 
          (card1.type !== 'word' && card2.type === 'word'))
}

// 查找可匹配的卡片对（用于提示功能）
export const findMatchingPair = (cards) => {
  // 筛选未匹配的卡片
  const unmatchedCards = cards.filter(card => !card.matched)
  if (unmatchedCards.length < 2) {
    return null // 无可用提示
  }

  // 查找一对可匹配的卡片
  const matchedPairs = []
  for (let i = 0; i < unmatchedCards.length; i++) {
    const card1 = unmatchedCards[i]
    for (let j = i + 1; j < unmatchedCards.length; j++) {
      const card2 = unmatchedCards[j]
      if (checkCardMatch(card1, card2)) {
        matchedPairs.push([card1, card2])
      }
    }
  }

  // 随机返回一对提示（无匹配对则返回null）
  if (matchedPairs.length === 0) {
    return null
  }
  return matchedPairs[Math.floor(Math.random() * matchedPairs.length)]
}

// 获取关卡布局信息
export const getLayoutInfo = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return { rows: 3, cols: 4, timeLimit: 0 } // 简单：3×4，无时间限制
    case 'medium':
      return { rows: 4, cols: 5, timeLimit: 600 } // 中等：4×5，10分钟
    case 'hard':
      return { rows: 5, cols: 6, timeLimit: 300 } // 困难：5×6，5分钟
    default:
      return { rows: 3, cols: 4, timeLimit: 0 }
  }
}

// 格式化游戏时长
export const formatGameDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 计算游戏得分
export const calculateGameScore = (matchedPairs, wrongCount, duration, difficulty) => {
  // 基础得分 = 匹配对数 × 10
  let baseScore = matchedPairs * 10
  
  // 错误惩罚 = 错误次数 × 2
  const wrongPenalty = wrongCount * 2
  
  // 时间奖励（根据难度不同，时间奖励系数不同）
  const timeBonus = duration > 0 ? Math.max(0, 300 - duration) : 0
  
  // 难度系数
  const difficultyMultiplier = {
    'easy': 1,
    'medium': 1.5,
    'hard': 2
  }[difficulty] || 1
  
  // 最终得分
  const finalScore = Math.max(0, (baseScore - wrongPenalty + timeBonus) * difficultyMultiplier)
  
  return Math.round(finalScore)
}

// 生成游戏ID
export const generateGameId = () => {
  return `game_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

// 生成关卡ID
export const generateLevelId = () => {
  return `level_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

// 生成卡片ID
export const generateCardId = () => {
  return `card_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

// 计算匹配成功率
export const calculateMatchRate = (matchedPairs, totalClicks) => {
  if (totalClicks === 0) return 0
  return parseFloat(((matchedPairs * 2 / totalClicks) * 100).toFixed(2))
}

// 检测游戏结束条件
export const checkGameEnd = (cards) => {
  // 检查是否所有卡片都已匹配
  return cards.every(card => card.matched)
}

// 防抖函数（用于处理快速点击）
export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// 节流函数（用于限制函数调用频率）
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 播放音效
export const playSound = (soundType) => {
  // 这里可以集成音效播放功能
  logUtil.debug(`播放音效: ${soundType}`, { module: 'GameUtil' })
  
  // 简单实现：使用HTML5 Audio API
  if (typeof Audio !== 'undefined') {
    let audioUrl = ''
    switch (soundType) {
      case 'success':
        audioUrl = '/static/audio/success.mp3'
        break
      case 'fail':
        audioUrl = '/static/audio/fail.mp3'
        break
      case 'select':
        audioUrl = '/static/audio/select.mp3'
        break
      case 'hint':
        audioUrl = '/static/audio/hint.mp3'
        break
      case 'complete':
        audioUrl = '/static/audio/complete.mp3'
        break
      default:
        return
    }
    
    try {
      const audio = new Audio(audioUrl)
      audio.play()
    } catch (error) {
      logUtil.error('播放音效失败', { module: 'GameUtil', soundType }, error)
    }
  }
}

// 获取卡片尺寸（根据布局和屏幕尺寸）
export const getCardSize = (layout, screenWidth) => {
  const { rows, cols } = layout
  const margin = 10 // 卡片间距
  const containerPadding = 20 // 容器内边距
  
  // 计算可用宽度
  const availableWidth = screenWidth - (containerPadding * 2) - (margin * (cols - 1))
  
  // 计算卡片宽度
  const cardWidth = availableWidth / cols
  
  // 卡片高度：根据布局调整（一般为宽度的1.2-1.5倍）
  const cardHeight = cardWidth * 1.3
  
  return {
    width: cardWidth,
    height: cardHeight,
    margin: margin
  }
}