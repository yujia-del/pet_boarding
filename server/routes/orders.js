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
    status: order.status,
    specialRequests: order.special_requests || '' 
  };
}

/**
 * 验证订单输入数据
 * @param {Object} data - 订单数据
 * @returns {Object} 验证结果 {isValid: boolean, message: string}
 */
function validateOrderInput(data) {
  const { userId, petName, petType, startDate, endDate, specialRequests } = data;
  
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
    
    // 构建查询语句和参数（连接pet表获取宠物信息）
    let query = `
      SELECT o.order_id as id, o.pet_id, o.host_user_id as user_id, o.start_date, o.end_date, o.status, o.total_amount as total_price, o.create_time as created_at, o.special_requests,
             p.name as pet_name, p.type as pet_type
      FROM \`order\` o
      LEFT JOIN pet p ON o.pet_id = p.pet_id
      WHERE o.host_user_id = ?
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
      `SELECT COUNT(*) AS total FROM \`order\` WHERE host_user_id = ?${status ? ' AND status = ?' : ''}`,
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
      'SELECT order_id as id, status FROM \`order\` WHERE order_id = ?',
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态是否可取消
    if (order.status !== '待确认') {
      return res.status(400).json({
        message: '只有待确认的订单可以取消',
        currentStatus: order.status
      });
    }
    
    // 更新订单状态为已取消
    await pool.query(
      'UPDATE \`order\` SET status = ? WHERE order_id = ?',
      ['已取消', orderId]
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
 * 检查指定日期和时间段的可用名额
 * @route GET /orders/check-availability/:date
 * @description 检查指定日期和时间段的寄养可用名额，支持按开始时间统计
 * @param {string} date - 日期，格式为YYYY-MM-DD
 * @param {string} [timeSlot] - 可选，时间段，格式为HH:MM
 * @returns {Object} 可用名额信息，如果提供了时间段则返回该时间段的信息，否则返回整个日期的信息
 */
router.get('/check-availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { timeSlot } = req.query; // 获取可选的时间段参数
    
    console.log(`检查日期 ${date}${timeSlot ? ` 时间段 ${timeSlot}` : ''} 的可用名额`);
    
    // 验证日期格式
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: '无效的日期格式' });
    }
    
    // 检查是否是过去的日期
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (targetDate < now) {
      return res.status(400).json({ message: '不能查询过去日期的可用名额' });
    }
    
    const pool = await getPool();
    
    // 查询当天的最大可接待宠物数量
    const [availability] = await pool.query(
      'SELECT max_pets FROM host_availability WHERE date = ?',
      [date]
    );
    
    let maxPets = 5; // 默认每天最多接待5只宠物
    if (availability.length > 0 && availability[0].max_pets > 0) {
      maxPets = availability[0].max_pets;
    }
    
    // 按时间段分组查询已预约的宠物数量
    let bookedPetsByTimeSlot = {};
    let totalBooked = 0;
    
    if (timeSlot) {
      // 如果指定了时间段，只查询该时间段的预约数量
      const [result] = await pool.query(
        'SELECT COUNT(*) as booked FROM \`order\` WHERE DATE(start_date) = ? AND TIME(start_date) = ? AND status != ?',
        [date, timeSlot, '已取消']
      );
      bookedPetsByTimeSlot[timeSlot] = result[0].booked;
      totalBooked = result[0].booked;
    } else {
      // 否则查询所有时间段的预约数量
      const [results] = await pool.query(
        'SELECT TIME(start_date) as time_slot, COUNT(*) as booked FROM \`order\` WHERE DATE(start_date) = ? AND status != ? GROUP BY time_slot',
        [date, '已取消']
      );
      
      // 构建按时间段分组的预约数量对象
      results.forEach(row => {
        bookedPetsByTimeSlot[row.time_slot] = row.booked;
        totalBooked += row.booked;
      });
    }
    
    // 计算可用名额
    const available = Math.max(0, maxPets - totalBooked);
    
    res.json({
      date,
      timeSlot: timeSlot || 'all',
      maxPets,
      booked: totalBooked,
      available,
      hasAvailability: available > 0,
      bookedByTimeSlot: bookedPetsByTimeSlot // 按时间段分组的已预约数量
    });
    
    console.log(`日期 ${date}${timeSlot ? ` 时间段 ${timeSlot}` : ''} 的可用名额: 总数${maxPets}，已预约${totalBooked}，剩余${available}`);
  } catch (error) {
    console.error('检查可用名额失败：', error);
    res.status(500).json({
      message: '检查可用名额失败，请稍后再试',
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
    
    const pool = await getPool();
    
    // 检查用户是否存在
    const [users] = await pool.query('SELECT user_id FROM user WHERE user_id = ?', [numericUserId]);
    
    if (users.length === 0) {
      console.error('用户不存在:', numericUserId);
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 检查预约日期范围内每天的可用名额
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= daysDiff; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      // 查询当天的最大可接待宠物数量
      const [availability] = await pool.query(
        'SELECT max_pets FROM host_availability WHERE date = ?',
        [checkDateStr]
      );
      
      let maxPets = 5; // 默认每天最多接待5只宠物
      if (availability.length > 0 && availability[0].max_pets > 0) {
        maxPets = availability[0].max_pets;
      }
      
      // 查询当天已预约的宠物数量
      // 使用DATE函数将DATETIME转换为DATE进行比较，确保兼容性
      const [bookedPets] = await pool.query(
        'SELECT COUNT(*) as booked FROM \`order\` WHERE DATE(start_date) <= ? AND DATE(end_date) >= ? AND status != ?',
        [checkDateStr, checkDateStr, '已取消']
      );
      
      const booked = bookedPets[0].booked;
      const available = maxPets - booked;
      
      if (available <= 0) {
        console.error(`日期 ${checkDateStr} 没有可用名额`);
        return res.status(400).json({ message: `日期 ${checkDateStr} 暂无可用名额，请选择其他日期` });
      }
    }
    
    // 计算价格
    const { days, price } = calculatePrice(petType, start, end);
    
    console.log(`计算的寄养天数: ${days}，总价: ${price}元，宠物类型: ${petType}`);
    
    // 从请求体中获取specialRequests和petId字段
    const { specialRequests = '', petId } = req.body;
    
    let petIdToUse;
    
    // 严格要求提供有效的宠物ID，不再自动创建宠物记录
    if (!petId) {
      console.error('未提供宠物ID');
      return res.status(400).json({ message: '请先选择宠物' });
    }
    
    // 验证petId是否属于该用户
    const [pets] = await pool.query(
      'SELECT pet_id FROM pet WHERE pet_id = ? AND owner_id = ?',
      [petId, numericUserId]
    );
    
    if (pets.length > 0) {
      petIdToUse = petId;
      console.log(`使用已有的宠物记录，宠物ID: ${petIdToUse}`);
    } else {
      console.error('无效的宠物ID或宠物不属于当前用户:', { petId, userId: numericUserId });
      return res.status(400).json({ message: '无效的宠物信息' });
    }
    
    // 使用确定的宠物ID创建订单
    const [result] = await pool.query(
      'INSERT INTO \`order\` (pet_id, host_user_id, start_date, end_date, status, total_amount, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [petIdToUse, numericUserId, startDate, endDate, '待确认', price, specialRequests]
    );
    
    const newOrderId = result.insertId;
    console.log(`订单创建成功，订单ID: ${newOrderId}`);
    
    // 查询刚创建的订单详情
    const [newOrders] = await pool.query(
      'SELECT order_id as id, pet_id, host_user_id as user_id, start_date, end_date, total_amount as total_price, status, create_time as created_at FROM \`order\` WHERE order_id = ?',
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
    
    // 查询订单详情（连接pet表获取宠物信息）
    const [orders] = await pool.query(
      `SELECT o.order_id as id, o.pet_id, o.host_user_id as user_id, o.start_date, o.end_date, o.total_amount as total_price, o.status, o.create_time as created_at, o.special_requests,
              u.username, u.phone, u.address,
              p.name as pet_name, p.type as pet_type
       FROM \`order\` o
       LEFT JOIN user u ON o.host_user_id = u.user_id
       LEFT JOIN pet p ON o.pet_id = p.pet_id
       WHERE o.order_id = ?`,
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
      specialRequests: order.special_requests || '', // 添加特殊要求字段
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