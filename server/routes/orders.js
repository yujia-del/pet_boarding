import express from 'express';
  const router = express.Router();
  import { getPool } from '../db.js';

/**
 * 格式化订单数据，统一前后端数据结构
 * @param {Object} order - 原始订单数据
 * @returns {Object} 格式化后的订单数据
 */
function formatOrderData(order) {
  return {
    id: `ORD${order.id.toString().padStart(6, '0')}`, // 生成格式如ORD000001的订单编号
    petName: order.pet_name,
    petType: order.pet_type,
    reserveStartDate: order.start_date,
    reserveEndDate: order.end_date,
    createTime: order.created_at,
    totalPrice: order.total_price,
    status: order.status
  };
}

/**
 * 验证订单输入数据
 * @param {Object} data - 订单数据
 * @returns {Object} 验证结果 {isValid: boolean, message: string}
 */
function validateOrderInput(data) {
  const { userId, petName, petType, startDate, endDate } = data;
  
  // 必填字段验证
  if (!userId || !petName || !petType || !startDate || !endDate) {
    return { isValid: false, message: '请提供完整的预约信息' };
  }
  
  // 用户ID验证
  if (isNaN(userId) || parseInt(userId) <= 0) {
    return { isValid: false, message: '用户ID无效' };
  }
  
  // 宠物信息验证
  if (typeof petName !== 'string' || petName.trim().length === 0) {
    return { isValid: false, message: '宠物名称不能为空' };
  }
  
  if (typeof petType !== 'string' || petType.trim().length === 0) {
    return { isValid: false, message: '宠物类型不能为空' };
  }
  
  // 日期格式验证
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, message: '请提供有效的日期格式' };
  }
  
  // 日期逻辑验证
  if (end < start) {
    return { isValid: false, message: '结束日期不能早于开始日期' };
  }
  
  // 检查是否是未来日期
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (start < now) {
    return { isValid: false, message: '开始日期不能是过去的日期' };
  }
  
  return { isValid: true, message: '验证通过' };
}

/**
 * 计算寄养价格
 * @param {string} petType - 宠物类型
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Object} {days: number, price: number}
 */
function calculatePrice(petType, startDate, endDate) {
  // 计算天数（向上取整）
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 基础价格：默认每天100元
  let basePrice = 100;
  
  // 根据宠物类型调整价格
  if (petType.toLowerCase() === 'cat') {
    basePrice = 120; // 猫咪每天120元
  } else if (petType.toLowerCase() === 'dog') {
    basePrice = 150; // 狗狗每天150元
  }
  
  // 计算总价
  const totalPrice = diffDays * basePrice;
  
  return { days: diffDays, price: totalPrice };
}

/**
 * 获取用户的订单列表
 * @route GET /orders/:userId
 * @description 获取指定用户的所有订单记录，支持分页和状态筛选
 * @param {number} userId - 用户ID
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=10] - 每页记录数
 * @param {string} [status] - 订单状态筛选
 * @returns {Object} 包含订单列表和分页信息的数据
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 10, status } = req.query;
    
    // 验证用户ID
    if (isNaN(userId)) {
      return res.status(400).json({ message: '用户ID无效' });
    }
    
    // 验证分页参数
    const pageNum = parseInt(page) || 1;
    const sizeNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * sizeNum;
    
    console.log(`查询用户 ${userId} 的订单列表，页码：${pageNum}，每页数量：${sizeNum}`);
    
    const pool = await getPool();
    
    // 构建查询语句和参数
    let query = `
      SELECT id, pet_name, pet_type, start_date, end_date, total_price, status, created_at 
      FROM orders 
      WHERE user_id = ?
    `;
    
    const params = [userId];
    
    // 添加状态筛选
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    // 添加排序和分页
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(sizeNum, offset);
    
    // 执行查询
    const [orders] = await pool.query(query, params);
    
    // 查询总记录数
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE user_id = ?${status ? ' AND status = ?' : ''}`,
      params.slice(0, status ? 2 : 1)
    );
    
    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / sizeNum);
    
    // 格式化订单数据
    const formattedOrders = orders.map(formatOrderData);
    
    // 返回结果
    res.json({
      orders: formattedOrders,
      page: pageNum,
      pageSize: sizeNum,
      total,
      totalPages
    });
    
    console.log(`成功获取用户 ${userId} 的订单列表，共 ${total} 条记录`);
  } catch (error) {
    console.error('获取订单列表失败：', error);
    res.status(500).json({
      message: '获取订单列表失败，请稍后再试',
      error: error.message
    });
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
  try {
    const { orderId } = req.params;
    
    // 验证订单ID
    if (isNaN(orderId)) {
      return res.status(400).json({ message: '订单ID无效' });
    }
    
    const pool = await getPool();
    
    // 检查订单是否存在并获取状态
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
      return res.status(400).json({
        message: '只有待确认的订单可以取消',
        currentStatus: order.status
      });
    }
    
    // 更新订单状态为已取消
    await pool.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', orderId]
    );
    
    res.json({
      message: '订单已成功取消',
      orderId
    });
    
    console.log(`订单 ${orderId} 已成功取消`);
  } catch (error) {
    console.error('取消订单失败：', error);
    res.status(500).json({
      message: '取消订单失败，请稍后再试',
      error: error.message
    });
  }
});

/**
 * 添加新订单
 * @route POST /orders
 * @description 创建新的宠物寄养订单
 * @returns {Object} 操作结果和订单详情
 */
router.post('/', async (req, res) => {
  try {
    const { userId, petName, petType, startDate, endDate } = req.body;
    
    console.log('收到订单创建请求:', { userId, petName, petType, startDate, endDate });
    
    // 输入验证
    const validationResult = validateOrderInput(req.body);
    if (!validationResult.isValid) {
      console.error('订单输入验证失败:', validationResult.message);
      return res.status(400).json({ message: validationResult.message });
    }
    
    // 转换并格式化数据
    const numericUserId = parseInt(userId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 检查用户是否存在
    const pool = await getPool();
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [numericUserId]);
    
    if (users.length === 0) {
      console.error('用户不存在:', numericUserId);
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 计算价格
    const { days, price } = calculatePrice(petType, start, end);
    
    console.log(`计算的寄养天数: ${days}，总价: ${price}元，宠物类型: ${petType}`);
    
    // 创建新订单
    const [result] = await pool.query(
      'INSERT INTO orders (user_id, pet_name, pet_type, start_date, end_date, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [numericUserId, petName, petType, startDate, endDate, price, 'pending']
    );
    
    const newOrderId = result.insertId;
    console.log(`订单创建成功，订单ID: ${newOrderId}`);
    
    // 查询刚创建的订单详情
    const [newOrders] = await pool.query(
      'SELECT id, pet_name, pet_type, start_date, end_date, total_price, status, created_at FROM orders WHERE id = ?',
      [newOrderId]
    );
    
    if (newOrders.length === 0) {
      // 如果查询不到新创建的订单，仍返回成功但不包含订单详情
      return res.status(201).json({
        message: '订单创建成功',
        orderId: newOrderId,
        orderDetails: null
      });
    }
    
    // 格式化订单详情
    const formattedOrder = formatOrderData(newOrders[0]);
    
    // 返回结果
    res.status(201).json({
      message: '订单创建成功',
      orderId: newOrderId,
      orderDetails: formattedOrder,
      calculation: {
        days,
        price,
        petType
      }
    });
  } catch (error) {
    console.error('创建订单失败：', error);
    
    // 根据错误类型提供更详细的错误信息
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(400).json({ message: '无效的用户ID，用户不存在' });
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      res.status(400).json({ message: '提交的信息过长，请检查输入' });
    } else if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: '该订单已存在，请检查输入' });
    } else {
      res.status(500).json({
        message: '创建订单失败，请稍后再试',
        error: error.message
      });
    }
  }
});

/**
 * 获取订单详情
 * @route GET /orders/detail/:orderId
 * @description 获取指定订单的详细信息
 * @param {number} orderId - 订单ID
 * @returns {Object} 订单详细信息
 */
router.get('/detail/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 验证订单ID
    if (isNaN(orderId)) {
      return res.status(400).json({ message: '订单ID无效' });
    }
    
    const pool = await getPool();
    
    // 查询订单详情
    const [orders] = await pool.query(
      `SELECT o.id, o.pet_name, o.pet_type, o.start_date, o.end_date, o.total_price, o.status, o.created_at, o.updated_at,
              u.username, u.phone, u.address
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 格式化订单详情，包含用户信息
    const formattedOrder = {
      id: `ORD${order.id.toString().padStart(6, '0')}`,
      petName: order.pet_name,
      petType: order.pet_type,
      reserveStartDate: order.start_date,
      reserveEndDate: order.end_date,
      totalPrice: order.total_price,
      status: order.status,
      createTime: order.created_at,
      updateTime: order.updated_at,
      userInfo: {
        username: order.username,
        phone: order.phone,
        address: order.address
      }
    };
    
    res.json(formattedOrder);
    console.log(`成功获取订单 ${orderId} 的详细信息`);
  } catch (error) {
    console.error('获取订单详情失败：', error);
    res.status(500).json({
      message: '获取订单详情失败，请稍后再试',
      error: error.message
    });
  }
});

export default router;