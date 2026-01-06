import { executeSql, query, insert, get } from '@/utils/dbUtil'
import { openDatabase } from '@/utils/dbUtil'

// 数据库名称
const DB_NAME = 'word_bean.db'
const DB_VERSION = 1

// 进度数据访问对象
const progressDao = {
  // 插入学习记录
  insertLearningRecord: async (recordData) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    await insert(db, 'learning_record', recordData)
    return recordData
  },
  
  // 根据时间范围获取学习记录
  getLearningRecordsByTimeRange: async (startTime, endTime) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM learning_record WHERE createTime BETWEEN ? AND ? ORDER BY createTime DESC', [startTime, endTime])
  },
  
  // 获取当日学习记录
  getTodayLearningRecords: async () => {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    
    return await progressDao.getLearningRecordsByTimeRange(startOfDay, endOfDay)
  },
  
  // 获取单词相关的学习记录
  getLearningRecordsByWordId: async (wordId, days = 30) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    const endTime = new Date().toISOString()
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    
    // 查询时间范围内的所有学习记录
    const records = await query(db, 'SELECT * FROM learning_record WHERE createTime BETWEEN ? AND ?', [startTime, endTime])
    
    // 过滤包含指定单词的记录
    return records.filter(record => {
      const wrongWordIds = JSON.parse(record.wrongWordIds || '[]')
      return wrongWordIds.includes(wordId)
    })
  },
  
  // 获取所有学习记录
  getAllLearningRecords: async () => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM learning_record ORDER BY createTime DESC')
  },
  
  // 获取单词集的学习记录
  getLearningRecordsBySetId: async (setId, limit = 10) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await query(db, 'SELECT * FROM learning_record WHERE setId = ? ORDER BY createTime DESC LIMIT ?', [setId, limit])
  },
  
  // 统计指定时间范围内的学习数据
  getLearningStats: async (startTime, endTime) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    
    // 统计总学习时长
    const durationResult = await executeSql(db, 
      'SELECT SUM(duration) as totalDuration, COUNT(*) as totalRecords FROM learning_record WHERE createTime BETWEEN ? AND ?',
      [startTime, endTime]
    )
    
    // 统计总获得勋章数
    const medalResult = await executeSql(db, 
      'SELECT SUM(medalCount) as totalMedals FROM learning_record WHERE createTime BETWEEN ? AND ?',
      [startTime, endTime]
    )
    
    // 统计平均正确率
    const rateResult = await executeSql(db, 
      'SELECT AVG(correctRate) as avgCorrectRate FROM learning_record WHERE createTime BETWEEN ? AND ?',
      [startTime, endTime]
    )
    
    return {
      totalDuration: durationResult.rows.item(0).totalDuration || 0,
      totalRecords: durationResult.rows.item(0).totalRecords || 0,
      totalMedals: medalResult.rows.item(0).totalMedals || 0,
      avgCorrectRate: parseFloat((rateResult.rows.item(0).avgCorrectRate || 0).toFixed(2))
    }
  }
}

export { progressDao }