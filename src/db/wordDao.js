import { executeSql, query, insert, update, remove, get } from '@/utils/dbUtil'
import { openDatabase } from '@/utils/dbUtil'

// 数据库名称
const DB_NAME = 'word_bean.db'
const DB_VERSION = 1

// 单词数据访问对象
const wordDao = {
  // 获取单词集下的所有单词
  getBySetId: async (setId) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM word WHERE setId = ? ORDER BY createTime DESC', [setId])
  },
  
  // 根据 ID 获取单个单词
  getById: async (wordId) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await get(db, 'word', 'wordId = ?', [wordId])
  },
  
  // 插入单词
  insert: async (wordData) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await insert(db, 'word', wordData)
    return wordData
  },
  
  // 批量插入单词
  batchInsert: async (wordList) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    // 使用事务提高批量插入性能
    await db.transaction(async (tx) => {
      for (const word of wordList) {
        await executeSql(tx, 
          'INSERT INTO word (wordId, wordText, phonetic, paraphrase, pronunciation, imageUrl, setId, createTime, masteryCount, masteryStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [word.wordId, word.wordText, word.phonetic, word.paraphrase, word.pronunciation, word.imageUrl, word.setId, word.createTime, word.masteryCount, word.masteryStatus]
        )
      }
    })
  },
  
  // 更新单词
  update: async (wordId, updateData) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await update(db, 'word', updateData, 'wordId = ?', [wordId])
  },
  
  // 删除单词
  delete: async (wordId) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await remove(db, 'word', 'wordId = ?', [wordId])
  },
  
  // 根据单词集删除所有单词
  deleteBySetId: async (setId) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await remove(db, 'word', 'setId = ?', [setId])
  },
  
  // 增加单词掌握次数
  incrementMasteryCount: async (wordId) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await executeSql(db, 'UPDATE word SET masteryCount = masteryCount + 1 WHERE wordId = ?', [wordId])
  },
  
  // 更新单词掌握状态
  updateMasteryInfo: async (wordId, { masteryRate, masteryStatus }) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await executeSql(db, 
      'UPDATE word SET masteryRate = ?, masteryStatus = ? WHERE wordId = ?',
      [masteryRate, masteryStatus, wordId]
    )
  },
  
  // 根据掌握状态统计单词数量
  countByMasteryStatus: async (status, wordIds = []) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    if (wordIds.length > 0) {
      const placeholders = wordIds.map(() => '?').join(', ')
      const result = await executeSql(db, 
        `SELECT COUNT(*) as count FROM word WHERE masteryStatus = ? AND wordId IN (${placeholders})`,
        [status, ...wordIds]
      )
      return result.rows.item(0).count
    } else {
      const result = await executeSql(db, 
        'SELECT COUNT(*) as count FROM word WHERE masteryStatus = ?',
        [status]
      )
      return result.rows.item(0).count
    }
  },
  
  // 获取所有单词
  getAll: async () => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM word ORDER BY createTime DESC')
  }
}

export { wordDao }