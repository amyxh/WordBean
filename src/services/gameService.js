import { shuffleCards } from '@/utils/gameUtil'
import dayjs from 'dayjs'
import defaultWordSets from '@/assets/defaultWordSets.json'

// 合并所有单词集为一个单词库
const getAllWords = () => {
  const allWords = []
  let index = 0
  
  // 遍历所有单词集，合并单词
      for (let i = 0; i < defaultWordSets.length; i++) {
        const set = defaultWordSets[i]
        for (let j = 0; j < set.words.length; j++) {
          const word = set.words[j]
          allWords.push({
            ...word,
            wordId: `word_merged_${index++}`,
            setId: `set_${i}`,
            setName: set.setName
          })
        }
      }
  
  return allWords
}

// 游戏服务层
const gameService = {
  // 生成关卡
  generateLevel: async (difficulty, matchMode) => {
    try {
      // 1. 获取所有单词数据
      let words = getAllWords()
      if (words.length < 10) {
        throw new Error('单词数量不足10个，无法生成关卡')
      }
      
      // 2. 按难度确定每关单词对数
      let pairCount = 0
      let layout = ''
      let timeLimit = 0 // 秒，0为无限制
      
      switch (difficulty) {
        case 'easy':
          pairCount = Math.min(6, Math.floor(words.length / 2)) // 最多6对
          layout = '3x4'
          timeLimit = 0
          break
        case 'medium':
          pairCount = Math.min(10, Math.floor(words.length / 2)) // 最多10对
          layout = '4x5'
          timeLimit = 600 // 10分钟
          break
        case 'hard':
          pairCount = Math.min(15, Math.floor(words.length / 2)) // 最多15对
          layout = '5x6'
          timeLimit = 300 // 5分钟
          break
        default:
          pairCount = 6
          layout = '3x4'
          timeLimit = 0
      }
      
      // 3. 随机选择单词
      const selectedWords = shuffleCards(words).slice(0, pairCount)
      
      // 4. 组装卡片数据
      const cards = []
      selectedWords.forEach(word => {
        const cardId1 = `card_${Date.now()}_${Math.floor(Math.random() * 10000)}`
        const cardId2 = `card_${Date.now()}_${Math.floor(Math.random() * 10000)}`
        
        if (matchMode === 'word-paraphrase') {
          // 模式1：单词卡 + 释义卡
          cards.push({
            cardId: cardId1,
            content: word.wordText,
            type: 'word',
            matched: false,
            selected: false,
            wordId: word.wordId
          })
          cards.push({
            cardId: cardId2,
            content: word.paraphrase,
            type: 'paraphrase',
            matched: false,
            selected: false,
            wordId: word.wordId
          })
        } else if (matchMode === 'word-image') {
          // 模式2：单词卡 + 图片卡（无图片则降级为释义卡）
          const imageContent = word.imageUrl ? word.imageUrl : word.paraphrase
          const imageType = word.imageUrl ? 'image' : 'paraphrase'
          
          cards.push({
            cardId: cardId1,
            content: word.wordText,
            type: 'word',
            matched: false,
            selected: false,
            wordId: word.wordId
          })
          cards.push({
            cardId: cardId2,
            content: imageContent,
            type: imageType,
            matched: false,
            selected: false,
            wordId: word.wordId
          })
        }
      })
      
      // 5. 打乱卡片顺序
      const shuffledCards = shuffleCards(cards)
      
      // 6. 生成关卡数据
      const levelData = {
        levelId: `level_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        setId: 'merged_set',
        setName: '合并单词集',
        difficulty: difficulty,
        matchMode: matchMode,
        layout: layout,
        timeLimit: timeLimit,
        cards: shuffledCards,
        totalPairs: pairCount,
        matchedPairs: 0,
        startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        wrongCount: 0,
        hintCount: 0,
        wrongWordIds: []
      }
      
      return {
        success: true,
        data: levelData,
        message: `关卡生成成功，共${pairCount}对匹配项，布局：${layout}`
      }
    } catch (error) {
      console.error('关卡生成失败:', error)
      return {
        success: false,
        message: `关卡生成失败：${error.message}`
      }
    }
  },
  
  // 检查卡片匹配
  checkMatch: async (card1, card2, levelData) => {
    try {
      // 1. 匹配校验
      const isMatched = (card1.wordId === card2.wordId) && 
                      ((card1.type === 'word' && card2.type !== 'word') || 
                       (card1.type !== 'word' && card2.type === 'word'))
      
      // 2. 匹配结果处理
      if (isMatched) {
        // 匹配成功
        card1.matched = true
        card2.matched = true
        levelData.matchedPairs += 1
        
        return {
          success: true,
          data: {
            isMatched: true,
            matchedPairs: levelData.matchedPairs,
            totalPairs: levelData.totalPairs
          },
          message: '匹配成功！'
        }
      } else {
        // 匹配失败
        levelData.wrongCount += 1
        
        // 记录错误单词
        if (!levelData.wrongWordIds.includes(card1.wordId)) {
          levelData.wrongWordIds.push(card1.wordId)
        }
        if (!levelData.wrongWordIds.includes(card2.wordId)) {
          levelData.wrongWordIds.push(card2.wordId)
        }
        
        return {
          success: true,
          data: {
            isMatched: false,
            matchedPairs: levelData.matchedPairs,
            totalPairs: levelData.totalPairs
          },
          message: '匹配失败，再试试~'
        }
      }
    } catch (error) {
      console.error('匹配检查失败:', error)
      return {
        success: false,
        message: `匹配检查失败：${error.message}`
      }
    }
  },
  
  // 获取提示
  getHint: (cards) => {
    // 查找一对可匹配的卡片
    const unmatchedCards = cards.filter(card => !card.matched)
    if (unmatchedCards.length < 2) {
      return {
        success: false,
        message: '无可用提示'
      }
    }
    
    for (let i = 0; i < unmatchedCards.length; i++) {
      const card1 = unmatchedCards[i]
      for (let j = i + 1; j < unmatchedCards.length; j++) {
        const card2 = unmatchedCards[j]
        
        if ((card1.wordId === card2.wordId) && 
            ((card1.type === 'word' && card2.type !== 'word') || 
             (card1.type !== 'word' && card2.type === 'word'))) {
          return {
            success: true,
            data: {
              hintCard1Id: card1.cardId,
              hintCard2Id: card2.cardId
            },
            message: '提示获取成功'
          }
        }
      }
    }
    
    return {
      success: false,
      message: '无可用提示'
    }
  },
  
  // 结束关卡
  endLevel: async (levelData) => {
    try {
      // 1. 计算关卡结果数据
      const endTime = dayjs()
      const startTime = dayjs(levelData.startTime)
      const duration = endTime.diff(startTime, 'second')
      const totalClicks = levelData.matchedPairs * 2 + levelData.wrongCount
      const correctRate = totalClicks > 0 ? parseFloat((levelData.matchedPairs * 2 / totalClicks).toFixed(2)) : 0
      const isPass = levelData.matchedPairs === levelData.totalPairs
      const medalCount = isPass ? 1 : 0
      
      // 2. 组装关卡结果
      const levelResult = {
        isPass: isPass,
        medalCount: medalCount,
        duration: duration,
        correctRate: correctRate,
        matchedPairs: levelData.matchedPairs,
        totalPairs: levelData.totalPairs,
        wrongCount: levelData.wrongCount,
        hintCount: levelData.hintCount,
        wrongWords: [] // 简化处理，不返回错误单词详情
      }
      
      return {
        success: true,
        data: levelResult,
        message: isPass ? '关卡通关！' : '关卡未通关~'
      }
    } catch (error) {
      console.error('关卡结束处理失败:', error)
      return {
        success: false,
        message: `关卡结束处理失败：${error.message}`
      }
    }
  }
}

export { gameService }