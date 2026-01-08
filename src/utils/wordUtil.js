// 单词工具类

// 模拟的单词库，用于自动生成中文含义和音标
const wordDatabase = {
  "one": { phonetic: "/wʌn/", paraphrase: "一" },
  "two": { phonetic: "/tuː/", paraphrase: "二" },
  "three": { phonetic: "/θriː/", paraphrase: "三" },
  "four": { phonetic: "/fɔːr/", paraphrase: "四" },
  "five": { phonetic: "/faɪv/", paraphrase: "五" },
  "six": { phonetic: "/sɪks/", paraphrase: "六" },
  "seven": { phonetic: "/ˈsevən/", paraphrase: "七" },
  "eight": { phonetic: "/eɪt/", paraphrase: "八" },
  "nine": { phonetic: "/naɪn/", paraphrase: "九" },
  "ten": { phonetic: "/ten/", paraphrase: "十" },
  "red": { phonetic: "/red/", paraphrase: "红色" },
  "blue": { phonetic: "/bluː/", paraphrase: "蓝色" },
  "green": { phonetic: "/ɡriːn/", paraphrase: "绿色" },
  "yellow": { phonetic: "/ˈjeləʊ/", paraphrase: "黄色" },
  "orange": { phonetic: "/ˈɒrɪndʒ/", paraphrase: "橙色" },
  "purple": { phonetic: "/ˈpɜːpl/", paraphrase: "紫色" },
  "pink": { phonetic: "/pɪŋk/", paraphrase: "粉色" },
  "black": { phonetic: "/blæk/", paraphrase: "黑色" },
  "white": { phonetic: "/waɪt/", paraphrase: "白色" },
  "brown": { phonetic: "/braʊn/", paraphrase: "棕色" },
  "cat": { phonetic: "/kæt/", paraphrase: "猫" },
  "dog": { phonetic: "/dɒɡ/", paraphrase: "狗" },
  "duck": { phonetic: "/dʌk/", paraphrase: "鸭子" },
  "chicken": { phonetic: "/ˈtʃɪkɪn/", paraphrase: "鸡" },
  "cow": { phonetic: "/kaʊ/", paraphrase: "奶牛" },
  "pig": { phonetic: "/pɪɡ/", paraphrase: "猪" },
  "sheep": { phonetic: "/ʃiːp/", paraphrase: "羊" },
  "horse": { phonetic: "/hɔːs/", paraphrase: "马" },
  "fish": { phonetic: "/fɪʃ/", paraphrase: "鱼" },
  "bird": { phonetic: "/bɜːd/", paraphrase: "鸟" },
  "apple": { phonetic: "/ˈæpl/", paraphrase: "苹果" },
  "banana": { phonetic: "/bəˈnɑːnə/", paraphrase: "香蕉" },
  "grape": { phonetic: "/ɡreɪp/", paraphrase: "葡萄" },
  "watermelon": { phonetic: "/ˈwɔːtəmelən/", paraphrase: "西瓜" },
  "strawberry": { phonetic: "/ˈstrɔːbəri/", paraphrase: "草莓" },
  "peach": { phonetic: "/piːtʃ/", paraphrase: "桃子" },
  "pear": { phonetic: "/peə/", paraphrase: "梨" },
  "lemon": { phonetic: "/ˈlemən/", paraphrase: "柠檬" },
  "mango": { phonetic: "/ˈmæŋɡəʊ/", paraphrase: "芒果" },
  "head": { phonetic: "/hed/", paraphrase: "头" },
  "eye": { phonetic: "/aɪ/", paraphrase: "眼睛" },
  "ear": { phonetic: "/ɪə/", paraphrase: "耳朵" },
  "nose": { phonetic: "/nəʊz/", paraphrase: "鼻子" },
  "mouth": { phonetic: "/maʊθ/", paraphrase: "嘴巴" },
  "face": { phonetic: "/feɪs/", paraphrase: "脸" },
  "hand": { phonetic: "/hænd/", paraphrase: "手" },
  "arm": { phonetic: "/ɑːm/", paraphrase: "胳膊" },
  "leg": { phonetic: "/leɡ/", paraphrase: "腿" },
  "foot": { phonetic: "/fʊt/", paraphrase: "脚" },
  "school": { phonetic: "/skuːl/", paraphrase: "学校" },
  "teacher": { phonetic: "/ˈtiːtʃə/", paraphrase: "老师" },
  "student": { phonetic: "/ˈstjuːdənt/", paraphrase: "学生" },
  "book": { phonetic: "/bʊk/", paraphrase: "书" },
  "pen": { phonetic: "/pen/", paraphrase: "钢笔" },
  "pencil": { phonetic: "/ˈpensl/", paraphrase: "铅笔" },
  "ruler": { phonetic: "/ˈruːlə/", paraphrase: "尺子" },
  "bag": { phonetic: "/bæɡ/", paraphrase: "书包" },
  "desk": { phonetic: "/desk/", paraphrase: "书桌" },
  "chair": { phonetic: "/tʃeə/", paraphrase: "椅子" }
}

// 单词表单验证
export const validateWordForm = (form) => {
  const errors = []
  
  // 单词校验
  if (!form.wordText || !form.wordText.trim()) {
    errors.push("单词不能为空")
  } else if (form.wordText.length > 50) {
    errors.push("单词长度不能超过50位")
  } else if (!/^[a-zA-Z0-9-]+$/.test(form.wordText.trim())) {
    errors.push("单词仅允许字母、数字、连字符")
  }
  
  // 释义校验（可选）
  if (form.paraphrase && form.paraphrase.length > 200) {
    errors.push("释义长度不能超过200位")
  }
  
  // 音标校验（可选）
  if (form.phonetic && form.phonetic.length > 100) {
    errors.push("音标长度不能超过100位")
  }
  
  // 配图校验（可选）
  if (form.imageUrl && !/\.(png|jpg|jpeg|gif)$/i.test(form.imageUrl)) {
    errors.push("配图仅支持png/jpg/jpeg/gif格式")
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.join("；")
  }
}

// 自动生成中文含义和音标
export const autoGenerateWordInfo = (wordText) => {
  const word = wordText.toLowerCase().trim()
  const wordInfo = wordDatabase[word] || {}
  
  return {
    phonetic: wordInfo.phonetic || `/模拟音标-${word}/`,
    paraphrase: wordInfo.paraphrase || `${word}的中文含义`
  }
}

// 生成唯一ID
export const generateId = (prefix = "id") => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

// 解析批量导入文本
export const parseBatchImportText = (content) => {
  const lines = content.split("\n")
  const result = {
    success: [],
    fail: []
  }
  
  lines.forEach((line, index) => {
    const trimLine = line.trim()
    if (!trimLine) return // 跳过空行
    
    const [wordText, phonetic = "", paraphrase = ""] = trimLine.split(",")
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
    
    // 验证数据
    const validateResult = validateWordForm(wordData)
    if (!validateResult.valid) {
      result.fail.push({
        line: index + 1,
        content: trimLine,
        reason: validateResult.errors
      })
    } else {
      result.success.push(wordData)
    }
  })
  
  return result
}

// 格式化时间
export const formatTime = (timestamp, format = "YYYY-MM-DD HH:mm:ss") => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  
  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds)
}

// 计算单词掌握率
export const calculateMasteryRate = (correctCount, totalCount) => {
  if (totalCount === 0) return 0
  return parseFloat((correctCount / totalCount).toFixed(2))
}

// 确定单词掌握状态
export const determineMasteryStatus = (correctCount, masteryRate) => {
  if (correctCount >= 3 && masteryRate >= 0.8) {
    return "mastered" // 已掌握
  } else if (correctCount <= 1 && masteryRate <= 0.3) {
    return "unmastered" // 未掌握
  } else {
    return "pending" // 待巩固
  }
}

// 生成随机颜色
export const generateRandomColor = () => {
  const colors = [
    "#3b82f6", // 蓝色
    "#10b981", // 绿色
    "#f59e0b", // 黄色
    "#ef4444", // 红色
    "#8b5cf6", // 紫色
    "#ec4899", // 粉色
    "#6366f1", // 靛蓝
    "#14b8a6"  // 青色
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 播放单词发音
export const playWordPronunciation = (wordText) => {
  // 这里可以集成语音合成API或播放本地音频文件
  import('./logUtil').then(({ debug }) => {
    debug(`播放单词发音: ${wordText}`, { module: 'WordUtil' })
  })
  
  // 简单实现：使用Web Speech API
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(wordText)
    utterance.lang = "en-US"
    window.speechSynthesis.speak(utterance)
  }
}