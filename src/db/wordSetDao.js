import { executeSql, query, insert, update, remove, get } from '@/utils/dbUtil'
import { openDatabase } from '@/utils/dbUtil'

// 数据库名称
const DB_NAME = 'word_bean.db'
const DB_VERSION = 1

// 单词集数据访问对象
const wordSetDao = {
  // 获取所有单词集
  getAll: async () => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM word_set ORDER BY createTime DESC')
  },
  
  // 获取单个单词集
  getById: async (setId) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await get(db, 'word_set', 'setId = ?', [setId])
  },
  
  // 插入单词集
  insert: async (setData) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await insert(db, 'word_set', setData)
    return setData
  },
  
  // 更新单词集
  update: async (setId, updateData) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await update(db, 'word_set', updateData, 'setId = ?', [setId])
  },
  
  // 更新单词集掌握率
  updateMasteryRate: async (setId, masteryRate) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await executeSql(db, 'UPDATE word_set SET masteryRate = ? WHERE setId = ?', [masteryRate, setId])
  },
  
  // 更新单词集单词数量
  updateWordCount: async (setId, wordCount) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await executeSql(db, 'UPDATE word_set SET wordCount = ? WHERE setId = ?', [wordCount, setId])
  },
  
  // 删除单词集
  delete: async (setId) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await remove(db, 'word_set', 'setId = ?', [setId])
  },
  
  // 获取内置单词集
  getBuiltInSets: async () => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM word_set WHERE isBuiltIn = 1 ORDER BY createTime DESC')
  },
  
  // 获取自定义单词集
  getCustomSets: async () => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM word_set WHERE isBuiltIn = 0 ORDER BY createTime DESC')
  }
}

export { wordSetDao }