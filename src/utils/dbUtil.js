// 数据库工具类，用于封装数据库操作
import logUtil from './logUtil'

// 内存数据库实现（用于浏览器环境）
class MemoryDatabase {
  constructor() {
    this.tables = {};
  }

  executeSql(sql, params, successCallback, errorCallback) {
    try {
      let result;
      if (sql.startsWith('CREATE TABLE')) {
        // 创建表
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
        this.tables[tableName] = this.tables[tableName] || [];
        result = { rowsAffected: 0 };
      } else if (sql.startsWith('INSERT INTO')) {
        // 插入数据
        const tableName = sql.match(/INSERT INTO (\w+)/)[1];
        // 解析字段名
        const fieldsMatch = sql.match(/\(([^)]+)\)/);
        const fields = fieldsMatch ? fieldsMatch[1].split(',').map(field => field.trim()) : [];
        // 解析值占位符
        const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/);
        
        const table = this.tables[tableName] || [];
        
        // 创建新记录对象
        const newRecord = {};
        fields.forEach((field, index) => {
          newRecord[field] = params[index];
        });
        
        table.push(newRecord);
        this.tables[tableName] = table;
        result = { rowsAffected: 1 };
      } else if (sql.startsWith('SELECT COUNT(*)')) {
        // 统计查询 - 优先处理
        const tableName = sql.match(/FROM (\w+)/)[1];
        const count = this.tables[tableName] ? this.tables[tableName].length : 0;
        // 确保 item 方法总是返回包含 count 属性的对象
        result = { rows: { item: (index) => ({ count }), length: 1 } };
      } else if (sql.startsWith('SELECT')) {
        // 查询数据
        let tableName = sql.match(/FROM (\w+)/)[1];
        // 处理 WHERE 子句（简单实现）
        const whereClause = sql.match(/WHERE (.+)/);
        let data = this.tables[tableName] || [];
        
        // 简单的WHERE条件过滤（仅支持单个条件：column = value）
        if (whereClause) {
          const clause = whereClause[1];
          const [column, operator, value] = clause.split(/\s+/);
          if (column && operator === '=' && value) {
            // 移除引号
            const cleanValue = value.replace(/['"]/g, '');
            data = data.filter(row => row[column] == cleanValue);
          }
        }
        
        result = { rows: { length: data.length, item: (index) => data[index] } };
      } else if (sql.startsWith('UPDATE')) {
        // 更新数据
        const tableName = sql.match(/UPDATE (\w+)/)[1];
        const table = this.tables[tableName] || [];
        result = { rowsAffected: 0 };
      } else if (sql.startsWith('DELETE')) {
        // 删除数据
        const tableName = sql.match(/DELETE FROM (\w+)/)[1];
        result = { rowsAffected: 0 };
      } else {
        result = { rowsAffected: 0 };
      }
      successCallback && successCallback(null, result);
    } catch (error) {
      errorCallback && errorCallback(null, error);
    }
  }
}

// 打开或创建数据库
export const openDatabase = (name, version, displayName, estimatedSize) => {
  return new Promise((resolve, reject) => {
    // 首先尝试使用 sqlitePlugin（Cordova/PhoneGap 环境）
    if (window.sqlitePlugin) {
      window.sqlitePlugin.openDatabase({
        name: name,
        version: version,
        displayName: displayName || name,
        estimatedSize: estimatedSize || 10 * 1024 * 1024
      }, resolve, reject);
      return;
    }
    
    // 如果是浏览器环境，使用 Web SQL（虽然已废弃，但用于开发调试）
    if (window.openDatabase) {
      try {
        const webDb = window.openDatabase(name, version, displayName || name, estimatedSize || 10 * 1024 * 1024);
        resolve(webDb);
        return;
      } catch (error) {
        // Web SQL 失败，使用内存数据库
        logUtil.warn('Web SQL 不可用，使用内存数据库', { module: 'DbUtil' }, error);
      }
    }
    
    // 如果都不可用，使用内存数据库作为最后的备选方案
    logUtil.warn('SQLite 不可用，使用内存数据库作为备选方案', { module: 'DbUtil' });
    resolve(new MemoryDatabase());
  });
};

// 执行 SQL 查询
export const executeSql = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.executeSql(sql, params, (_, result) => {
      resolve(result);
    }, (_, error) => {
      logUtil.error('SQL Error', { module: 'DbUtil', sql, params }, error);
      reject(error);
    });
  });
};

// 查询数据
export const query = async (db, sql, params = []) => {
  const result = await executeSql(db, sql, params);
  const rows = result.rows;
  const data = [];
  
  for (let i = 0; i < rows.length; i++) {
    data.push(rows.item(i));
  }
  
  return data;
};

// 插入数据
export const insert = async (db, table, data) => {
  const keys = Object.keys(data);
  const values = keys.map(key => data[key]);
  const placeholders = keys.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  await executeSql(db, sql, values);
  return data;
};

// 更新数据
export const update = async (db, table, data, whereClause, whereParams = []) => {
  const keys = Object.keys(data);
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => data[key]).concat(whereParams);
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  await executeSql(db, sql, values);
  return data;
};

// 删除数据
export const remove = async (db, table, whereClause, whereParams = []) => {
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  await executeSql(db, sql, whereParams);
};

// 获取单个数据
export const get = async (db, table, whereClause, whereParams = []) => {
  const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
  const result = await query(db, sql, whereParams);
  return result.length > 0 ? result[0] : null;
};

// 获取所有数据
export const getAll = async (db, table, orderBy = '') => {
  let sql = `SELECT * FROM ${table}`;
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }
  return await query(db, sql);
};