import express from 'express';
const router = express.Router();
import { getPool } from '../db.js';

/**
 * 获取用户的订单列表
 * @route GET /orders/:userId
 * @description 获取指定用户的所有订单记录
 * @param {number} userId - 用户ID
 * @returns {Array} 订单列表
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 获取数据库连接池
    const pool = await getPool();
    
    // 查询用户的所有订单
    const [orders] = await pool.query(
      `SELECT id, pet_name, pet_type, start_date, end_date, status, created_at 
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // 格式化订单数据，使其与前端组件期望的格式匹配
    const formattedOrders = orders.map(order => ({
      id: `ORD${order.id.toString().padStart(6, '0')}`, // 生成格式如ORD000001的订单编号
      petName: order.pet_name,
      petType: order.pet_type,
      reserveStartDate: order.start_date,
      reserveEndDate: order.end_date,
      createTime: order.created_at,
      status: order.status
    }));
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('获取订单列表失败：', error);
    res.status(500).json({ message: '获取订单列表失败，请稍后再试' });
  }
});

/**
 * 取消订单
 * @route PUT /orders/:orderId/cancel
 * @description 将指定订单状态更新为已取消
 * @param {number} orderId - 订单ID
 * @returns {Object} 操作结果
 */
router.put('/:orderId/cancel', async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const pool = await getPool();
    
    // 检查订单是否存在并获取用户ID
    const [orders] = await pool.query(
      'SELECT id, status FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态是否可取消
    if (order.status !== 'pending') {
      return res.status(400).json({ message: '只有待确认的订单可以取消' });
    }
    
    // 更新订单状态为已取消
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', orderId]
    );
    
    res.json({ message: '订单已取消' });
  } catch (error) {
    console.error('取消订单失败：', error);
    res.status(500).json({ message: '取消订单失败，请稍后再试' });
  }
});

/**
 * 添加新订单
 * @route POST /orders
 * @description 创建新的宠物寄养订单
 * @returns {Object} 操作结果
 */
router.post('/', async (req, res) => {
  const { userId, petName, petType, startDate, endDate } = req.body;
  
  try {
    console.log('收到预约请求:', req.body);
    
    // 输入验证
    if (!userId || !petName || !petType || !startDate || !endDate) {
      console.error('缺少必要的预约信息');
      return res.status(400).json({ message: '请提供完整的预约信息' });
    }
    
    // 验证日期格式
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('日期格式无效:', startDate, endDate);
      return res.status(400).json({ message: '请提供有效的日期格式' });
    }
    
    // 验证结束日期不早于开始日期
    if (end < start) {
      console.error('结束日期早于开始日期:', startDate, endDate);
      return res.status(400).json({ message: '结束日期不能早于开始日期' });
    }
    
    // 验证用户ID是否为数字
    if (isNaN(userId)) {
      console.error('用户ID无效:', userId);
      return res.status(400).json({ message: '用户ID无效' });
    }
    
    const pool = await getPool();
    
    // 检查用户是否存在
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      console.error('用户不存在:', userId);
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 计算寄养天数和总价（这里简化处理，实际应该根据宠物类型和天数计算）
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * 100; // 假设每天100元
    
    console.log('计算的寄养天数:', diffDays, '总价:', totalPrice);
    
    // 创建新订单
    const [result] = await pool.query(
      'INSERT INTO orders (user_id, pet_name, pet_type, start_date, end_date, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, petName, petType, startDate, endDate, totalPrice, 'pending']
    );
    
    console.log('订单创建成功，订单ID:', result.insertId);
    
    res.status(201).json({ 
      message: '订单创建成功', 
      orderId: result.insertId 
    });
  } catch (error) {
    console.error('创建订单失败：', error);
    // 提供更详细的错误信息
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(400).json({ message: '无效的用户ID，用户不存在' });
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      res.status(400).json({ message: '提交的信息过长，请检查输入' });
    } else {
      res.status(500).json({ message: '创建订单失败，请稍后再试', error: error.message });
    }
  }
});

export default router;