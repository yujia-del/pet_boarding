import express from 'express';
const router = express.Router();
import { getPool } from '../db.js';

/**
 * 初始化全局日期可用名额
 * @param {Object} pool - 数据库连接池
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @param {number} maxPets - 最大宠物数量，固定为5
 */
async function initializeHostAvailability(pool, startDate, endDate, maxPets = 5) {
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // 使用INSERT ... ON DUPLICATE KEY UPDATE确保只在记录不存在时插入
    await pool.query(
      'INSERT INTO host_availability (date, max_pets, booked_pets) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE date = date',
      [dateStr, maxPets]
    );
  }
}

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
    petBreed: order.pet_breed, 
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
  const { userId, petName, petType, startDate, endDate, specialRequests, petBreed } = data;
  
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
  
  // 日期时间逻辑验证
  if (end < start) {
    return { isValid: false, message: '结束时间不能早于开始时间' };
  }
  
  // 额外验证：结束时间不能等于开始时间
  if (end.getTime() === start.getTime()) {
    return { isValid: false, message: '结束时间不能等于开始时间' };
  }
  
  // 检查订单起始时间必须大于24小时（使用完整日期时间计算）
  const diffTime = Math.abs(end - start);
  const diffHours = diffTime / (1000 * 60 * 60);
  
  if (diffHours <= 24) {
    return { isValid: false, message: '订单起始时间必须大于24小时' };
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
             p.pet_name as pet_name, p.type as pet_type, p.breed as pet_breed
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
    
    // 添加时间过滤：
    // 1. 对于已完成的订单，只显示结束日期离当前日期不超过3天的订单
    // 2. 对于已取消的订单，只显示创建时间离当前日期不超过3天的订单
    query += ' AND (o.status != ? OR (o.status = ? AND DATEDIFF(NOW(), o.end_date) <= 3))';
    params.push('已完成', '已完成');
    
    query += ' AND (o.status != ? OR (o.status = ? AND DATEDIFF(NOW(), o.create_time) <= 3))';
    params.push('已取消', '已取消');
    
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
 * ========== 订单状态管理 API ==========
 * 以下API用于管理订单状态的转换：
 * - 确认订单：待确认 → 待进行
 * - 取消订单：待确认/待进行 → 已取消
 * - 完成订单：待进行 → 已完成
 */

/**
 * 取消订单
 * @route PUT /orders/:orderId/cancel
 * @description 将订单状态从待确认或待进行更新为已取消，并释放相应日期的可用名额
 * @param {number} orderId - 订单ID
 * @returns {Object} 操作结果
 */
router.put('/:orderId/cancel', async (req, res) => {
  let pool;
  try {
    const { orderId } = req.params;
    
    // 验证订单ID
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId) || numericOrderId <= 0 || numericOrderId !== Number(orderId)) {
      return res.status(400).json({ message: '订单ID无效' });
    }
    const validOrderId = numericOrderId;
    
    pool = await getPool();
    
    // 检查订单是否存在并获取状态和日期信息
    const [orders] = await pool.query(
      'SELECT order_id as id, status, start_date, end_date FROM `order` WHERE order_id = ?',
      [validOrderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态是否可以取消（只有待确认或待进行状态的订单可以取消）
    if (order.status !== '待确认' && order.status !== '待进行') {
      return res.status(400).json({
        message: `订单当前状态为"${order.status}"，只有待确认或待进行的订单可以取消`,
        currentStatus: order.status
      });
    }
    
    // 开始事务：更新订单状态并释放名额
    await pool.query('START TRANSACTION');
    
    // 更新订单状态为已取消
    const [updateResult] = await pool.query(
      'UPDATE `order` SET status = ? WHERE order_id = ?',
      ['已取消', validOrderId]
    );
    
    if (updateResult.affectedRows === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ message: '订单状态更新失败，订单可能已被修改' });
    }
    
    // 释放名额：遍历订单日期范围，减少每天的已预约宠物数量
    const start = new Date(order.start_date);
    const end = new Date(order.end_date);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const updateDate = new Date(start);
      updateDate.setDate(start.getDate() + i);
      const updateDateStr = updateDate.toISOString().split('T')[0];
      
      // 减少名额，确保不小于0
      await pool.query(
        'UPDATE host_availability SET booked_pets = GREATEST(0, booked_pets - 1) WHERE date = ?',
        [updateDateStr]
      );
      
      console.log(`订单取消：已更新日期 ${updateDateStr} 的预约人数，减少1人（增加名额）`);
    }
    
    // 提交事务
    await pool.query('COMMIT');
    
    console.log(`订单 ${validOrderId} 已取消，状态更新为已取消，已释放对应日期的可用名额`);
    
    res.json({
      message: '订单已成功取消',
      orderId: validOrderId,
      newStatus: '已取消'
    });
    
  } catch (error) {
    console.error('取消订单失败：', error);
    // 确保错误时回滚事务
    if (pool) {
      await pool.query('ROLLBACK').catch(() => {});
    }
    res.status(500).json({
      message: '取消订单失败，请稍后再试',
      error: error.message
    });
  }
});

/**
 * 确认订单
 * @route PUT /orders/:orderId/confirm
 * @description 将订单状态从待确认更新为待进行，并减少相应日期的可用名额
 * @param {number} orderId - 订单ID
 * @returns {Object} 操作结果
 */
router.put('/:orderId/confirm', async (req, res) => {
  let pool;
  try {
    const { orderId } = req.params;
    
    // 验证订单ID
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId) || numericOrderId <= 0 || numericOrderId !== Number(orderId)) {
      return res.status(400).json({ message: '订单ID无效' });
    }
    const validOrderId = numericOrderId;
    
    pool = await getPool();
    
    // 检查订单是否存在并获取状态和日期信息
    const [orders] = await pool.query(
      'SELECT order_id as id, status, start_date, end_date FROM `order` WHERE order_id = ?',
      [validOrderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态是否可以确认
    if (order.status !== '待确认') {
      return res.status(400).json({
        message: `订单当前状态为"${order.status}"，只有待确认的订单可以确认`,
        currentStatus: order.status
      });
    }
    
    // 再次检查日期范围内的可用名额，防止名额被其他订单占用
    const start = new Date(order.start_date);
    const end = new Date(order.end_date);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // 验证每个日期的名额是否仍然可用
    for (let i = 0; i <= daysDiff; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const [availability] = await pool.query(
        'SELECT max_pets, booked_pets FROM host_availability WHERE date = ?',
        [checkDateStr]
      );
      
      let maxPets = 5;
      let bookedPets = 0;
      
      if (availability.length > 0) {
        maxPets = availability[0].max_pets;
        bookedPets = availability[0].booked_pets || 0;
      }
      
      const available = Math.max(0, maxPets - bookedPets);
      
      if (available <= 0) {
        return res.status(400).json({ message: `日期 ${checkDateStr} 暂无可用名额，请选择其他日期` });
      }
    }
    
    // 事务开始：更新订单状态并减少名额
    await pool.query('START TRANSACTION');
    
    // 更新订单状态为待进行
    const [updateResult] = await pool.query(
      'UPDATE `order` SET status = ? WHERE order_id = ?',
      ['待进行', validOrderId]
    );
    
    if (updateResult.affectedRows === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ message: '订单状态更新失败，订单可能已被修改' });
    }
    
    // 更新日期范围内的已预约宠物数量
    for (let i = 0; i <= daysDiff; i++) {
      const updateDate = new Date(start);
      updateDate.setDate(start.getDate() + i);
      const updateDateStr = updateDate.toISOString().split('T')[0];
      
      // 增加已预约宠物数量
      await pool.query(
        'UPDATE host_availability SET booked_pets = booked_pets + 1 WHERE date = ?',
        [updateDateStr]
      );
      
      console.log(`订单确认：已更新日期 ${updateDateStr} 的预约人数，增加1人（减少名额）`);
    }
    
    // 提交事务
    await pool.query('COMMIT');
    
    console.log(`订单 ${validOrderId} 已确认`);
    
    res.json({
      message: '订单已成功确认',
      orderId: validOrderId,
      newStatus: '待进行'
    });
    
  } catch (error) {
    console.error('确认订单失败：', error);
    // 确保错误时回滚事务
    if (pool) {
      await pool.query('ROLLBACK').catch(() => {});
    }
    res.status(500).json({
      message: '确认订单失败，请稍后再试',
      error: error.message
    });
  }
});
/**
 * 完成订单
 * @route PUT /orders/:orderId/complete
 * @description 将订单状态从待进行转为已完成，并增加对应日期的可用名额
 * @param {number} orderId - 订单ID
 * @returns {Object} 操作结果
 */
router.put('/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 验证订单ID - 使用更严格的整数验证
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId) || numericOrderId <= 0 || numericOrderId !== Number(orderId)) {
      return res.status(400).json({ message: '订单ID无效' });
    }
    const validOrderId = numericOrderId;
    
    const pool = await getPool();
    
    // 检查订单是否存在并获取状态
    const [orders] = await pool.query(
      'SELECT order_id as id, status FROM \`order\` WHERE order_id = ?',
      [validOrderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态是否可完成（只有待进行状态的订单可以完成）
    if (order.status !== '待进行') {
      return res.status(400).json({
        message: `订单当前状态为"${order.status}"，只有待进行的订单可以完成`,
        currentStatus: order.status
      });
    }
    
    // 获取订单的开始和结束日期信息
    const [orderDetails] = await pool.query(
      'SELECT start_date, end_date FROM \`order\` WHERE order_id = ?',
      [validOrderId]
    );
    
    if (orderDetails.length === 0) {
      return res.status(404).json({ message: '订单信息获取失败' });
    }
    
    const { start_date, end_date } = orderDetails[0];
    const start = new Date(start_date);
    const end = new Date(end_date);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // 更新订单状态为已完成
    await pool.query(
      'UPDATE \`order\` SET status = ? WHERE order_id = ?',
      ['进行中', validOrderId]
    )
    await pool.query(
      'UPDATE \`order\` SET status = ? WHERE order_id = ?',
      ['已完成', validOrderId]
    );
    
    // 订单完成后增加名额
    for (let i = 0; i <= daysDiff; i++) {
      const updateDate = new Date(start);
      updateDate.setDate(start.getDate() + i);
      const updateDateStr = updateDate.toISOString().split('T')[0];
      
      // 使用原子操作更新预约人数，确保不小于0
      const [updateResult] = await pool.query(
        'UPDATE host_availability SET booked_pets = GREATEST(0, booked_pets - 1) WHERE date = ?',
        [updateDateStr]
      );
      
      if (updateResult.affectedRows === 1) {
        console.log(`订单完成：已更新日期 ${updateDateStr} 的预约人数，减少1人（增加名额）`);
      } else {
        console.error(`订单完成：更新日期 ${updateDateStr} 的预约人数失败，可能记录不存在`);
      }
    }
    
    res.json({
      message: '订单已成功完成',
      orderId: validOrderId
    });
    
    console.log(`订单 ${validOrderId} 已成功完成，并已增加对应日期的可用名额`);
  } catch (error) {
    console.error('完成订单失败：', error);
    res.status(500).json({
      message: '完成订单失败，请稍后再试',
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
    
    console.log('收到订单创建请求:', { userId, petName, petType, startDate, endDate, specialRequests: req.body.specialRequests });
    
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
    
    // 确保host_availability表中存在这些日期的记录（提前初始化）
    await initializeHostAvailability(pool, start, end);
    
    // 检查预约日期范围内每天的可用名额
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= daysDiff; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      // 使用host_availability表查询当天的名额信息
      const [availability] = await pool.query(
        'SELECT max_pets, booked_pets FROM host_availability WHERE date = ?',
        [checkDateStr]
      );
      
      let maxPets = 5; // 每天固定最多接待5只宠物
      let bookedPets = 0; // 已预约的宠物数量
      
      if (availability.length > 0) {
        maxPets = availability[0].max_pets;
        bookedPets = availability[0].booked_pets || 0;
      } else {
        // 记录日志：未找到该日期的配置记录
        console.log(`日期 ${checkDateStr} 的host_availability表中未配置，使用默认值: ${maxPets}`);
      }
      
      // 计算当日可用名额（确保非负值）
      const available = Math.max(0, maxPets - bookedPets);
      
      console.log(`日期 ${checkDateStr} 的当日剩余名额情况: 最大${maxPets}, 已占用${bookedPets}, 可用${available}`);
      
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
    
    // 订单创建成功后立即减少名额
    // 根据业务规则：订单创建时只减少开始当天的名额
    const startDateStr = start.toISOString().split('T')[0];
    
    await pool.query(
      'UPDATE host_availability SET booked_pets = booked_pets + 1 WHERE date = ?',
      [startDateStr]
    );
    console.log(`已更新开始日期 ${startDateStr} 的名额使用情况，增加1个预约`);
    
    // 查询刚创建的订单详情，包含宠物信息
    const [newOrders] = await pool.query(
      'SELECT o.order_id as id, o.pet_id, o.host_user_id as user_id, o.start_date, o.end_date, o.total_amount as total_price, o.status, o.create_time as created_at, o.special_requests, \
             p.pet_name as pet_name, p.type as pet_type, p.breed as pet_breed \
       FROM \`order\` o \
       LEFT JOIN pet p ON o.pet_id = p.pet_id \
       WHERE o.order_id = ?',
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
    
    // 验证订单ID - 使用更严格的整数验证
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId) || numericOrderId <= 0 || numericOrderId !== Number(orderId)) {
      return res.status(400).json({ message: '订单ID无效' });
    }
    const validOrderId = numericOrderId;
    
    const pool = await getPool();
    
    // 查询订单详情（连接pet表获取宠物信息）
    const [orders] = await pool.query(
      'SELECT o.order_id as id, o.pet_id, o.host_user_id as user_id, o.start_date, o.end_date, o.total_amount as total_price, o.status, o.create_time as created_at, o.special_requests, u.username, u.phone, u.address, p.pet_name as pet_name, p.type as pet_type FROM \`order\` o LEFT JOIN user u ON o.host_user_id = u.user_id LEFT JOIN pet p ON o.pet_id = p.pet_id WHERE o.order_id = ?',
      [validOrderId]
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



/**
 * 完成订单，将订单状态从待进行转为已完成
 * @route PUT /orders/:orderId/complete
 * @description 将指定订单标记为已完成，并增加对应日期的可用名额
 * @param {number} orderId - 订单ID
 * @returns {Object} 操作结果
 */
router.put('/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 验证订单ID - 使用更严格的整数验证
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId) || numericOrderId <= 0 || numericOrderId !== Number(orderId)) {
      return res.status(400).json({ message: '订单ID无效' });
    }
    const validOrderId = numericOrderId;
    
    const pool = await getPool();
    
    // 检查订单是否存在并获取状态
    const [orders] = await pool.query(
      'SELECT order_id as id, status FROM \`order\` WHERE order_id = ?',
      [validOrderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态是否可完成（只有待进行状态的订单可以完成）
    if (order.status !== '待进行') {
      return res.status(400).json({
        message: `订单当前状态为"${order.status}"，只有待进行的订单可以完成`,
        currentStatus: order.status
      });
    }
    
    // 获取订单的开始和结束日期信息
    const [orderDetails] = await pool.query(
      'SELECT start_date, end_date FROM \`order\` WHERE order_id = ?',
      [validOrderId]
    );
    
    if (orderDetails.length === 0) {
      return res.status(404).json({ message: '订单信息获取失败' });
    }
    
    const { start_date, end_date } = orderDetails[0];
    const start = new Date(start_date);
    const end = new Date(end_date);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // 更新订单状态为已完成
    await pool.query(
      'UPDATE \`order\` SET status = ? WHERE order_id = ?',
      ['已完成', validOrderId]
    );
    
    // 根据新需求：订单完成后增加名额
    for (let i = 0; i <= daysDiff; i++) {
      const updateDate = new Date(start);
      updateDate.setDate(start.getDate() + i);
      const updateDateStr = updateDate.toISOString().split('T')[0];
      
      // 使用原子操作更新预约人数，确保不小于0
      const [updateResult] = await pool.query(
        'UPDATE host_availability SET booked_pets = GREATEST(0, booked_pets - 1) WHERE date = ?',
        [updateDateStr]
      );
      
      if (updateResult.affectedRows === 1) {
        console.log(`订单完成：已更新日期 ${updateDateStr} 的预约人数，减少1人（增加名额）`);
      } else {
        console.error(`订单完成：更新日期 ${updateDateStr} 的预约人数失败，可能记录不存在`);
      }
    }
    
    res.json({
      message: '订单已成功完成',
      orderId: validOrderId
    });
    
    console.log(`订单 ${validOrderId} 已成功完成，并已增加对应日期的可用名额`);
  } catch (error) {
    console.error('完成订单失败：', error);
    res.status(500).json({
      message: '完成订单失败，请稍后再试',
      error: error.message
    });
  }
});

/**
 * 检查日期或日期范围的可用名额
 * @route GET /orders/check-availability/:date
 * @description 检查单个日期或日期范围内的可用名额，返回最小剩余名额
 * @param {string} date - 开始日期，格式为YYYY-MM-DD
 * @param {string} [endDate] - 可选，结束日期，格式为YYYY-MM-DD
 * @returns {Object} 包含可用名额信息的对象
 */
router.get('/check-availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { endDate } = req.query;
    
    // 验证日期格式
    const start = new Date(date);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: '无效的开始日期格式' });
    }
    
    // 如果提供了结束日期，验证格式
    let end;
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: '无效的结束日期格式' });
      }
      
      // 验证结束日期不早于开始日期
      if (end < start) {
        return res.status(400).json({ message: '结束日期不能早于开始日期' });
      }
    } else {
      // 如果没有提供结束日期，默认为同一天
      end = new Date(start);
    }
    
    const pool = await getPool();
    
    // 计算日期范围内的天数差异
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // 确保host_availability表中存在这些日期的记录
    await initializeHostAvailability(pool, start, end);
    
    // 存储每日可用名额信息
    const dailyAvailability = {};
    let minAvailable = Infinity; // 初始化为无穷大，用于找出最小可用名额
    let maxPets = 5; // 默认最大名额
    
    // 遍历日期范围内的每一天
    for (let i = 0; i <= daysDiff; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      // 查询当天的名额信息
      const [availability] = await pool.query(
        'SELECT max_pets, booked_pets FROM host_availability WHERE date = ?',
        [checkDateStr]
      );
      
      let currentMaxPets = 5; // 默认最大名额
      let currentBookedPets = 0;
      
      if (availability.length > 0) {
        currentMaxPets = availability[0].max_pets;
        currentBookedPets = availability[0].booked_pets || 0;
      }
      
      // 使用第一个日期的max_pets作为返回的total值
      if (i === 0) {
        maxPets = currentMaxPets;
      }
      
      // 计算当日可用名额
      const available = Math.max(0, currentMaxPets - currentBookedPets);
      
      // 更新每日可用名额信息
      dailyAvailability[checkDateStr] = {
        max_pets: currentMaxPets,
        booked_pets: currentBookedPets,
        available
      };
      
      // 更新最小可用名额
      if (available < minAvailable) {
        minAvailable = available;
      }
    }
    
    // 如果没有找到任何可用名额（理论上不应该发生，因为已初始化），设置为默认值
    if (minAvailable === Infinity) {
      minAvailable = 5; // 默认最大名额
    }
    
    // 构建返回数据
    const responseData = {
      minAvailable,
      maxPets,
      dailyAvailability,
      hasAvailability: minAvailable > 0,
      description: daysDiff > 0 ? `所选日期范围内最低剩余名额为${minAvailable}个` : `当日剩余名额为${minAvailable}个`
    }
    res.json(responseData);
  } catch (error) {
    console.error('检查可用名额失败：', error);
    res.status(500).json({
      message: '检查可用名额失败，请稍后再试',
      error: error.message
    });
  }
});

export default router;