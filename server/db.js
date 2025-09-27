import mysql from 'mysql2/promise';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root', // 请替换为您的MySQL用户名
  password: 'yujiatong2279', // 请替换为您的MySQL密码
  database: 'pet_reserve',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 先创建不带database参数的连接来创建数据库
let pool;

/**
 * 初始化数据库 - 自动创建数据库和表
 * @returns {Promise<void>} 初始化结果
 */
async function initializeDatabase() {
  try {
    // 首先创建不带database参数的连接
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // 创建数据库（如果不存在）
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`数据库 ${dbConfig.database} 已创建或已存在`);
    
    // 关闭临时连接
    await tempConnection.end();
    
    // 创建带database参数的连接池
    pool = mysql.createPool(dbConfig);
    
    // 创建必要的表
    await createTables();
    
    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败：', error);
    throw error;
  }
}

/**
 * 创建数据库表
 * @returns {Promise<void>} 创建结果
 */
async function createTables() {
  try {
    const connection = await pool.getConnection();
    
    // 创建users表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        pet_name VARCHAR(50),
        pet_type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        total_price DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('orders表已创建或已存在');
    
    connection.release();
  } catch (error) {
    console.error('创建表失败：', error);
    throw error;
  }
}

/**
 * 获取数据库连接池
 * @returns {Promise<mysql.Pool>} 连接池
 */
async function getPool() {
  if (!pool) {
    await initializeDatabase();
  }
  return pool;
}

// 导出初始化函数和连接池获取函数
export { initializeDatabase, getPool, pool };