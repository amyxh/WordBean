import { openDatabase, executeSql } from '@/utils/dbUtil'
import { wordDao } from './wordDao'
import { wordSetDao } from './wordSetDao'
import { progressDao } from './progressDao'
import { settingDao } from './settingDao'
// 静态导入默认单词集数据
import defaultWordSetsData from '@/assets/defaultWordSets.json'

// 数据库名称和版本
const DB_NAME = 'word_bean.db'
const DB_VERSION = 1

// 初始化数据库
const initDatabase = async () => {
  try {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    
    // 创建单词集表
    await executeSql(db, `
      CREATE TABLE IF NOT EXISTS word_set (
        setId TEXT PRIMARY KEY,
        setName TEXT NOT NULL,
        category TEXT,
        wordCount INTEGER NOT NULL,
        createTime TEXT NOT NULL,
        isBuiltIn INTEGER NOT NULL,
        masteryRate REAL NOT NULL DEFAULT 0
      )
    `)
    
    // 创建单词表
    await executeSql(db, `
      CREATE TABLE IF NOT EXISTS word (
        wordId TEXT PRIMARY KEY,
        wordText TEXT NOT NULL,
        phonetic TEXT,
        paraphrase TEXT NOT NULL,
        pronunciation TEXT,
        imageUrl TEXT,
        setId TEXT NOT NULL,
        createTime TEXT NOT NULL,
        masteryCount INTEGER NOT NULL DEFAULT 0,
        masteryStatus TEXT DEFAULT 'pending',
        FOREIGN KEY (setId) REFERENCES word_set(setId) ON DELETE CASCADE
      )
    `)
    
    // 创建学习记录表
    await executeSql(db, `
      CREATE TABLE IF NOT EXISTS learning_record (
        recordId TEXT PRIMARY KEY,
        setId TEXT NOT NULL,
        setName TEXT NOT NULL,
        duration INTEGER NOT NULL,
        correctRate REAL NOT NULL,
        wrongWordIds TEXT,
        createTime TEXT NOT NULL,
        medalCount INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        matchMode TEXT NOT NULL,
        isPass INTEGER NOT NULL
      )
    `)
    
    // 创建设置表
    await executeSql(db, `
      CREATE TABLE IF NOT EXISTS setting (
        settingId TEXT PRIMARY KEY,
        soundEnabled INTEGER NOT NULL DEFAULT 1,
        musicEnabled INTEGER NOT NULL DEFAULT 1,
        defaultDifficulty TEXT NOT NULL DEFAULT 'easy',
        dailyTimeLimit INTEGER NOT NULL DEFAULT 30,
        lastBackupTime TEXT,
        updateTime TEXT NOT NULL
      )
    `)
    
    // 初始化内置单词集和单词
    await initBuiltInData(db)
    
    // 初始化默认设置
    await initDefaultSetting(db)
    
    console.log('数据库初始化成功')
    return db
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

// 初始化内置数据
const initBuiltInData = async (db) => {
  // 检查是否已有内置单词集
  const setResult = await executeSql(db, `SELECT COUNT(*) as count FROM word_set WHERE isBuiltIn = 1`)
  // 处理不同数据库实现的返回格式差异
  const rows = setResult.rows || (setResult[0] && setResult[0].rows)
  const hasBuiltInSets = rows.item(0).count > 0
  
  if (hasBuiltInSets) {
    return // 已存在内置单词集，跳过初始化
  }
  
  // 内置单词集数据（适合小学一年级学生）
  // 使用静态导入的默认单词集数据
  const defaultWordSets = defaultWordSetsData || []
  
  const builtInSets = []
  const builtInWords = []
  const now = new Date().toISOString()
  
  // 生成内置单词集和单词数据
  defaultWordSets.forEach((wordSet, setIndex) => {
    // 创建单词集
    const setId = `set_builtin_${setIndex + 1}`
    const builtInSet = {
      setId,
      setName: wordSet.setName,
      category: wordSet.category || '基础',
      wordCount: wordSet.words.length,
      createTime: now,
      isBuiltIn: 1,
      masteryRate: 0
    }
    builtInSets.push(builtInSet)
    
    // 创建单词
    wordSet.words.forEach((word, wordIndex) => {
      const wordId = `word_builtin_${setIndex + 1}_${wordIndex + 1}`
      const builtInWord = {
        wordId,
        wordText: word.wordText,
        phonetic: word.phonetic,
        paraphrase: word.paraphrase,
        pronunciation: `system:${word.wordText}`,
        imageUrl: '',
        setId,
        createTime: now,
        masteryCount: 0,
        masteryStatus: 'pending'
      }
      builtInWords.push(builtInWord)
    })
  })
  
  // 插入内置单词集
  for (const set of builtInSets) {
    await executeSql(db,
      'INSERT INTO word_set (setId, setName, category, wordCount, createTime, isBuiltIn, masteryRate) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [set.setId, set.setName, set.category, set.wordCount, set.createTime, set.isBuiltIn, set.masteryRate]
    )
  }
  
  // 插入内置单词
  for (const word of builtInWords) {
    await executeSql(db,
      'INSERT INTO word (wordId, wordText, phonetic, paraphrase, pronunciation, imageUrl, setId, createTime, masteryCount, masteryStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [word.wordId, word.wordText, word.phonetic, word.paraphrase, word.pronunciation, word.imageUrl, word.setId, word.createTime, word.masteryCount, word.masteryStatus]
    )
  }
  
  console.log('内置数据初始化成功')
}

// 初始化默认设置
const initDefaultSetting = async (db) => {
  // 检查是否已有设置数据
  const settingResult = await executeSql(db, `SELECT COUNT(*) as count FROM setting WHERE settingId = 'default_setting'`)
  // 处理不同数据库实现的返回格式差异
  const rows = settingResult.rows || (settingResult[0] && settingResult[0].rows)
  const hasSetting = rows.item(0).count > 0
  
  if (hasSetting) {
    return // 已存在设置数据，跳过初始化
  }
  
  // 插入默认设置
  await executeSql(db,
    'INSERT INTO setting (settingId, soundEnabled, musicEnabled, defaultDifficulty, dailyTimeLimit, updateTime) VALUES (?, ?, ?, ?, ?, ?)',
    ['default_setting', 1, 1, 'easy', 30, new Date().toISOString()]
  )
  
  console.log('默认设置初始化成功')
}

// 导出数据库相关功能
export {
  initDatabase,
  wordDao,
  wordSetDao,
  progressDao,
  settingDao
}