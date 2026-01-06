import { wordDao } from '@/db/wordDao'
import { wordSetDao } from '@/db/wordSetDao'
import { validateWordForm, autoGenerateWordInfo } from '@/utils/wordUtil'

// 单词服务层
const wordService = {
  // 单条单词录入
  singleAdd: async (wordData) => {
    // 表单校验
    const validateResult = validateWordForm(wordData)
    if (!validateResult.valid) {
      return {
        success: false,
        message: validateResult.errors
      }
    }
    
    // 自动生成中文含义和音标（如果未提供）
    const { phonetic: autoPhonetic, paraphrase: autoParaphrase } = autoGenerateWordInfo(wordData.wordText)
    
    // 生成唯一ID
    const wordId = `word_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
    
    // 组装单词数据
    const wordItem = {
      wordId,
      ...wordData,
      phonetic: wordData.phonetic || autoPhonetic,
      paraphrase: wordData.paraphrase || autoParaphrase,
      createTime: new Date().toISOString(),
      masteryCount: 0,
      masteryStatus: 'pending',
      pronunciation: wordData.pronunciation || `system:${wordData.wordText}`,
      imageUrl: wordData.imageUrl || ''
    }
    
    try {
      // 插入单词
      await wordDao.insert(wordItem)
      
      // 更新单词集的单词数量
      await wordSetDao.updateWordCount(wordData.setId, await wordService.getWordCountInSet(wordData.setId))
      
      return {
        success: true,
        data: { wordId },
        message: '单词录入成功'
      }
    } catch (error) {
      console.error('单词录入失败:', error)
      return {
        success: false,
        message: '单词录入失败：' + error.message
      }
    }
  },
  
  // 文本批量导入单词
  batchImportWords: async (fileContent, setId) => {
    const lines = fileContent.split('\n')
    const successList = []
    const failList = []
    
    // 遍历解析每行
    lines.forEach((line, index) => {
      const trimLine = line.trim()
      if (!trimLine) return // 跳过空行
      
      const [wordText, phonetic = '', paraphrase = ''] = trimLine.split(',')
      const trimmedWordText = wordText.trim()
      const trimmedPhonetic = phonetic.trim()
      const trimmedParaphrase = paraphrase.trim()
      
      // 自动生成中文含义和音标（如果未提供）
      const { phonetic: autoPhonetic, paraphrase: autoParaphrase } = autoGenerateWordInfo(trimmedWordText)
      
      // 构造单词数据
      const wordData = {
        wordText: trimmedWordText,
        phonetic: trimmedPhonetic || autoPhonetic,
        paraphrase: trimmedParaphrase || autoParaphrase
      }
      
      // 校验字段
      const validateResult = validateWordForm(wordData)
      if (!validateResult.valid) {
        failList.push({ line: index + 1, content: trimLine, reason: validateResult.errors })
        return
      }
      
      // 构造完整的单词数据
      const fullWordData = {
        wordId: `word_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        ...wordData,
        setId,
        createTime: new Date().toISOString(),
        masteryCount: 0,
        masteryStatus: 'pending',
        pronunciation: `system:${trimmedWordText}`
      }
      
      successList.push(fullWordData)
    })
    
    // 限制导入数量
    if (successList.length > 50) {
      return {
        success: false,
        message: '单次导入最多50个单词'
      }
    }
    
    try {
      // 批量插入数据库
      if (successList.length > 0) {
        await wordDao.batchInsert(successList)
        // 更新单词集数量
        await wordSetDao.updateWordCount(setId, await wordService.getWordCountInSet(setId))
      }
      
      return {
        success: true,
        data: { 
          successCount: successList.length, 
          failCount: failList.length, 
          failWords: failList 
        },
        message: `导入完成，成功${successList.length}个，失败${failList.length}个`
      }
    } catch (error) {
      console.error('批量导入失败:', error)
      return {
        success: false,
        message: '批量导入失败：' + error.message
      }
    }
  },
  
  // 创建单词集
  createWordSet: async (setData) => {
    // 校验名称非空
    if (!setData.setName || !setData.setName.trim()) {
      return {
        success: false,
        message: '单词集名称不能为空'
      }
    }
    
    // 生成setId
    const setId = `set_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
    
    // 组装单词集数据
    const setItem = {
      setId,
      ...setData,
      wordCount: 0,
      createTime: new Date().toISOString(),
      isBuiltIn: setData.isBuiltIn || 0,
      masteryRate: 0
    }
    
    try {
      // 插入单词集
      await wordSetDao.insert(setItem)
      
      return {
        success: true,
        data: { setId },
        message: '单词集创建成功'
      }
    } catch (error) {
      console.error('单词集创建失败:', error)
      return {
        success: false,
        message: '单词集创建失败：' + error.message
      }
    }
  },
  
  // 获取单词集中的单词数量
  getWordCountInSet: async (setId) => {
    const words = await wordDao.getBySetId(setId)
    return words.length
  },
  
  // 删除单词
  deleteWord: async (wordId, setId) => {
    try {
      await wordDao.delete(wordId)
      
      // 更新单词集的单词数量
      await wordSetDao.updateWordCount(setId, await wordService.getWordCountInSet(setId))
      
      return {
        success: true,
        message: '单词删除成功'
      }
    } catch (error) {
      console.error('单词删除失败:', error)
      return {
        success: false,
        message: '单词删除失败：' + error.message
      }
    }
  },
  
  // 删除单词集
  deleteWordSet: async (setId) => {
    try {
      // 删除单词集（级联删除单词）
      await wordSetDao.delete(setId)
      
      return {
        success: true,
        message: '单词集删除成功'
      }
    } catch (error) {
      console.error('单词集删除失败:', error)
      return {
        success: false,
        message: '单词集删除失败：' + error.message
      }
    }
  },
  
  // 编辑单词集
  editWordSet: async (setId, updateData) => {
    try {
      await wordSetDao.update(setId, updateData)
      
      return {
        success: true,
        message: '单词集编辑成功'
      }
    } catch (error) {
      console.error('单词集编辑失败:', error)
      return {
        success: false,
        message: '单词集编辑失败：' + error.message
      }
    }
  },
  
  // 获取所有单词集
  getAllWordSets: async () => {
    try {
      const sets = await wordSetDao.getAll()
      
      // 为每个单词集添加单词列表
      const setsWithWords = await Promise.all(sets.map(async (set) => {
        const words = await wordDao.getBySetId(set.setId)
        return {
          ...set,
          words
        }
      }))
      
      return {
        success: true,
        data: setsWithWords,
        message: '获取单词集成功'
      }
    } catch (error) {
      console.error('获取单词集失败:', error)
      return {
        success: false,
        message: '获取单词集失败：' + error.message
      }
    }
  },
  
  // 生成单词集分享链接
  shareWordSet: async (setId) => {
    try {
      // 生成分享链接（格式：word-bean://share?setId=xxx）
      const shareUrl = `word-bean://share?setId=${setId}`
      
      return {
        success: true,
        data: { shareUrl, qrCodeUrl: '' },
        message: '分享链接生成成功'
      }
    } catch (error) {
      console.error('生成分享链接失败:', error)
      return {
        success: false,
        message: '生成分享链接失败：' + error.message
      }
    }
  }
}

export { wordService }