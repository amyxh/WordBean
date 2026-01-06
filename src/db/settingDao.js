import { executeSql, get, update } from '@/utils/dbUtil'
import { openDatabase } from '@/utils/dbUtil'

// 数据库名称
const DB_NAME = 'word_bean.db'
const DB_VERSION = 1

// 设置数据访问对象
const settingDao = {
  // 获取设置数据（默认使用 default_setting ID）
  getSetting: async () => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await get(db, 'setting', 'settingId = ?', ['default_setting'])
  },
  
  // 更新设置数据
  updateSetting: async (updateData) => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    return await update(db, 'setting', updateData, 'settingId = ?', ['default_setting'])
  },
  
  // 更新最后备份时间
  updateLastBackupTime: async () => {
    const db = await openDatabase(DB_NAME, DB_VERSION)
    const updateData = {
      lastBackupTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    return await update(db, 'setting', updateData, 'settingId = ?', ['default_setting'])
  },
  
  // 获取音效开关状态
  getSoundEnabled: async () => {
    const setting = await settingDao.getSetting()
    return setting ? setting.soundEnabled === 1 : true
  },
  
  // 获取背景音乐开关状态
  getMusicEnabled: async () => {
    const setting = await settingDao.getSetting()
    return setting ? setting.musicEnabled === 1 : true
  },
  
  // 获取默认难度
  getDefaultDifficulty: async () => {
    const setting = await settingDao.getSetting()
    return setting ? setting.defaultDifficulty : 'easy'
  },
  
  // 获取每日学习时长限制
  getDailyTimeLimit: async () => {
    const setting = await settingDao.getSetting()
    return setting ? setting.dailyTimeLimit : 30
  }
}

export { settingDao }