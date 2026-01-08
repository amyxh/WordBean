// 日志工具类

// 日志级别
export const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
}

// 日志配置
const LOG_CONFIG = {
  maxLogCount: 100, // 最大日志数量
  maxLogAge: 30 * 24 * 60 * 60 * 1000, // 日志最大保留时间（30天，毫秒）
  storageKey: 'wordBeanLogs' // 本地存储键名
}

// 获取设备信息
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language
  }
}

// 保存日志到本地存储
const saveLogs = (logs) => {
  try {
    localStorage.setItem(LOG_CONFIG.storageKey, JSON.stringify(logs))
  } catch (error) {
    console.error('保存日志失败:', error)
  }
}

// 读取日志
const readLogs = () => {
  try {
    const logs = localStorage.getItem(LOG_CONFIG.storageKey)
    return logs ? JSON.parse(logs) : []
  } catch (error) {
    console.error('读取日志失败:', error)
    return []
  }
}

// 清理过期日志
const cleanupLogs = () => {
  const logs = readLogs()
  const currentTime = Date.now()
  
  // 过滤出未过期的日志
  const validLogs = logs.filter(log => {
    return (currentTime - log.timestamp) <= LOG_CONFIG.maxLogAge
  })
  
  // 如果日志数量超过最大值，只保留最新的日志
  if (validLogs.length > LOG_CONFIG.maxLogCount) {
    const trimmedLogs = validLogs.slice(validLogs.length - LOG_CONFIG.maxLogCount)
    saveLogs(trimmedLogs)
    return trimmedLogs
  }
  
  saveLogs(validLogs)
  return validLogs
}

// 记录日志
export const log = (level, message, data = null, error = null) => {
  const timestamp = Date.now()
  const deviceInfo = getDeviceInfo()
  
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : null,
    deviceInfo
  }
  
  // 添加到日志列表
  const logs = readLogs()
  logs.push(logEntry)
  
  // 清理日志
  cleanupLogs()
  
  // 输出到控制台
  const logMessage = `${new Date(timestamp).toISOString()} [${level.toUpperCase()}] ${message}`
  
  switch (level) {
    case LOG_LEVEL.DEBUG:
      console.debug(logMessage, data, error)
      break
    case LOG_LEVEL.INFO:
      console.info(logMessage, data)
      break
    case LOG_LEVEL.WARN:
      console.warn(logMessage, data, error)
      break
    case LOG_LEVEL.ERROR:
      console.error(logMessage, data, error)
      break
    default:
      console.log(logMessage, data, error)
  }
}

// 记录调试日志
export const debug = (message, data = null) => {
  log(LOG_LEVEL.DEBUG, message, data)
}

// 记录信息日志
export const info = (message, data = null) => {
  log(LOG_LEVEL.INFO, message, data)
}

// 记录警告日志
export const warn = (message, data = null, error = null) => {
  log(LOG_LEVEL.WARN, message, data, error)
}

// 记录错误日志
export const error = (message, data = null, error = null) => {
  log(LOG_LEVEL.ERROR, message, data, error)
}

// 导出日志
export const exportLogs = () => {
  const logs = readLogs()
  const logText = logs.map(log => {
    return JSON.stringify(log, null, 2)
  }).join('\n\n')
  
  return logText
}

// 清除所有日志
export const clearLogs = () => {
  try {
    localStorage.removeItem(LOG_CONFIG.storageKey)
    return true
  } catch (error) {
    console.error('清除日志失败:', error)
    return false
  }
}

// 获取日志列表
export const getLogs = () => {
  return readLogs()
}

export default {
  log,
  debug,
  info,
  warn,
  error,
  exportLogs,
  clearLogs,
  getLogs,
  LOG_LEVEL
}