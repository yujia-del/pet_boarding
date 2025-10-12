import mysql from 'mysql2/promise';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root', // 请替换为您的MySQL用户名
  password: 'yujiatong2279', // 请替换为您的MySQL密码
  database: 'pet_boarding',
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
    
    // 创建user表（用户表）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100) NOT NULL UNIQUE,
        address VARCHAR(255),
        avatar VARCHAR(255) DEFAULT 'user.svg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('user表已创建或已存在');
    
    // 创建pet表（宠物表）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pet (
        pet_id INT AUTO_INCREMENT PRIMARY KEY,
        pet_name VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        breed VARCHAR(50),
        age INT,
        weight DECIMAL(5,2),
        health_info TEXT,
        owner_id INT NOT NULL,
        gender VARCHAR(10),
        FOREIGN KEY (owner_id) REFERENCES user(user_id)
      )
    `);
    console.log('pet表已创建或已存在');
    
    // 创建host_availability表（寄养方可用时间表）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS host_availability (
        availability_id INT AUTO_INCREMENT PRIMARY KEY,
        host_user_id INT NOT NULL,
        date DATE NOT NULL,
        max_pets INT NOT NULL DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_user_id) REFERENCES user(user_id)
      )
    `);
    console.log('host_availability表已创建或已存在');
    
    // 创建order表（订单表）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`order\` (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id INT NOT NULL,
        host_user_id INT NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status VARCHAR(20) DEFAULT '待确认',
        special_requests TEXT,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pet(pet_id),
        FOREIGN KEY (host_user_id) REFERENCES user(user_id)
      )
    `);
    console.log('order表已创建或已存在');
    
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