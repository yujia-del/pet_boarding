// 用户相关API路由
import express from 'express';
const router = express.Router();
import { getPool } from '../db.js';

// 尝试加载bcrypt模块，如果未安装给出友好提示
let bcrypt;

// 创建一个模拟的bcrypt对象，用于开发阶段的错误提示
const mockBcrypt = {
  hash: async (password) => {
    throw new Error('bcrypt模块未安装，请运行：npm install bcrypt');
  },
  compare: async () => {
    throw new Error('bcrypt模块未安装，请运行：npm install bcrypt');
  }
};

bcrypt = mockBcrypt;

try {
  // 尝试动态导入bcrypt模块
  import('bcrypt').then(module => {
    bcrypt = module.default;
  }).catch(err => {
    console.error('bcrypt模块加载失败，请运行：npm install bcrypt');
  });
} catch (error) {
  console.error('bcrypt模块未安装，请运行：npm install bcrypt');
}

// 注册用户
router.post('/register', async (req, res) => {
  const { username, email, address, phone, password } = req.body;
  
  try {
    // 获取数据库连接池
    const pool = await getPool();
    
    // 检查用户是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已被使用' });
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户，包含地址和电话字段
    const [result] = await pool.query(
      'INSERT INTO user (username, email, address, phone, password) VALUES (?, ?, ?, ?, ?)',
      [username, email, address, phone, hashedPassword]
    );
    
    res.status(201).json({ message: '注册成功', userId: result.insertId });
  } catch (error) {
    console.error('注册失败：', error);
    res.status(500).json({ message: '注册失败，请稍后再试' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // 获取数据库连接池
    const pool = await getPool();
    
    // 查找用户（支持用户名或邮箱登录）
    const [users] = await pool.query(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 登录成功，返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;
    res.json({ message: '登录成功', user: userInfo });
  } catch (error) {
    console.error('登录失败：', error);
    res.status(500).json({ message: '登录失败，请稍后再试' });
  }
});

// 获取用户详情
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 获取数据库连接池
    const pool = await getPool();
    
    // 根据ID查找用户
    const [users] = await pool.query(
      'SELECT * FROM user WHERE user_id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = users[0];
    res.json(userInfo);
  } catch (error) {
    console.error('获取用户详情失败：', error);
    res.status(500).json({ message: '获取用户详情失败，请稍后再试' });
  }
});

// 更新用户信息（包含头像字段）
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { address, phone, avatar } = req.body;
  
  try {
    // 获取数据库连接池
    const pool = await getPool();
    
    // 检查用户是否存在
    const [users] = await pool.query(
      'SELECT * FROM user WHERE user_id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新用户信息，包含头像字段
    await pool.query(
      'UPDATE user SET address = ?, phone = ?, avatar = ? WHERE user_id = ?',
      [address, phone, avatar, id]
    );
    
    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息失败：', error);
    res.status(500).json({ message: '更新用户信息失败，请稍后再试' });
  }
});

// 头像上传处理
router.post('/:id/upload-avatar', async (req, res) => {
  try {
    // 注意：在实际生产环境中，应该使用multer等中间件处理文件上传
    // 这里为了简化示例，假设客户端直接发送了图片的Base64编码或URL
    const { id } = req.params;
    const { avatarData } = req.body;
    
    // 获取数据库连接池
    const pool = await getPool();
    
    // 检查用户是否存在
    const [users] = await pool.query(
      'SELECT * FROM user WHERE user_id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 保存头像信息到数据库
    // 实际应用中，这里应该处理文件存储逻辑
    await pool.query(
      'UPDATE user SET avatar = ? WHERE user_id = ?',
      [avatarData, id]
    );
    
    res.json({ message: '头像上传成功' });
  } catch (error) {
    console.error('头像上传失败：', error);
    res.status(500).json({ message: '头像上传失败，请稍后再试' });
  }
});

export default router;