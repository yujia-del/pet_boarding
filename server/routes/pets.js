import express from 'express';
import { getPool } from '../db.js';

const router = express.Router();

/**
 * 获取用户的所有宠物
 * @route GET /pets
 * @description 获取当前登录用户的所有宠物信息
 * @returns {Array} 宠物列表
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = req.query.userId; // 从查询参数中获取用户ID
    
    if (!userId) {
      return res.status(400).json({ message: '用户ID不能为空' });
    }
    
    // 查询用户的所有宠物
    const [pets] = await pool.query(
      'SELECT * FROM pet WHERE owner_id = ?',
      [userId]
    );
    
    res.json(pets);
  } catch (error) {
    console.error('获取宠物列表失败:', error);
    res.status(500).json({
      message: '获取宠物列表失败，请稍后再试',
      error: error.message
    });
  }
});

/**
 * 添加新宠物
 * @route POST /pets
 * @description 添加新的宠物信息
 * @returns {Object} 新添加的宠物信息
 */
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    console.log('POST /pets - 接收到的请求体:', req.body);
    const { petName, type, breed, age, gender, ownerId, weight, health_info } = req.body;
    
    // 添加体重字段的日志
    console.log('POST /pets - 体重字段值:', weight, '类型:', typeof weight);
    
    // 验证必要字段
    if (!petName || !type || !ownerId) {
      return res.status(400).json({ message: '宠物名称、类型和主人ID不能为空' });
    }
    
    // 插入新宠物
    const [result] = await pool.query(
      'INSERT INTO pet (pet_name, type, breed, age, gender, owner_id, weight, health_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [petName, type, breed, age, gender, ownerId, weight, health_info]
    );
    
    // 获取新添加的宠物信息
    const [newPet] = await pool.query(
      'SELECT * FROM pet WHERE pet_id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newPet[0]);
  } catch (error) {
    console.error('添加宠物失败:', error);
    res.status(500).json({
      message: '添加宠物失败，请稍后再试',
      error: error.message
    });
  }
});

/**
 * 更新宠物信息
 * @route PUT /pets/:id
 * @description 更新指定宠物的信息
 * @param {number} id - 宠物ID
 * @returns {Object} 更新后的宠物信息
 */
router.put('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    console.log('PUT /pets/:id - 接收到的请求体:', req.body);
    const { petName, type, breed, age, gender, weight, health_info } = req.body;
    
    // 验证必要字段
    if (!petName || !type) {
      return res.status(400).json({ message: '宠物名称和类型不能为空' });
    }
    
    // 记录SQL查询信息
    console.log('PUT /pets/:id - 准备执行SQL更新:', 
      'UPDATE pet SET pet_name = ?, type = ?, breed = ?, age = ?, gender = ?, weight = ?, health_info = ? WHERE pet_id = ?',
      [petName, type, breed, age, gender, weight, health_info, id]
    );
    
    // 更新宠物信息
    const [result] = await pool.query(
      'UPDATE pet SET pet_name = ?, type = ?, breed = ?, age = ?, gender = ?, weight = ?, health_info = ? WHERE pet_id = ?',
      [petName, type, breed, age, gender, weight, health_info, id]
    );
    
    // 记录更新结果
    console.log('PUT /pets/:id - SQL更新结果:', result);
    console.log('PUT /pets/:id - 影响的行数:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '未找到指定的宠物' });
    }
    
    // 获取更新后的宠物信息
    console.log('PUT /pets/:id - 准备查询更新后的宠物信息');
    const [updatedPet] = await pool.query(
      'SELECT * FROM pet WHERE pet_id = ?',
      [id]
    );
    
    res.json(updatedPet[0]);
  } catch (error) {
    console.error('更新宠物信息失败:', error);
    res.status(500).json({
      message: '更新宠物信息失败，请稍后再试',
      error: error.message
    });
  }
});

/**
 * 删除宠物
 * @route DELETE /pets/:id
 * @description 删除指定的宠物信息
 * @param {number} id - 宠物ID
 * @returns {Object} 操作结果
 */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    
    // 检查宠物是否有相关联的订单
    const [orders] = await pool.query(
      'SELECT COUNT(*) as count FROM `order` WHERE pet_id = ?',
      [id]
    );
    
    // 如果存在相关联的订单，不允许删除
    if (orders[0].count > 0) {
      return res.status(400).json({
        message: '该宠物已有相关寄养订单，无法删除',
        orderCount: orders[0].count
      });
    }
    
    // 删除宠物
    const [result] = await pool.query(
      'DELETE FROM pet WHERE pet_id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '未找到指定的宠物' });
    }
    
    res.json({ message: '宠物信息已成功删除' });
  } catch (error) {
    console.error('删除宠物失败:', error);
    res.status(500).json({
      message: '删除宠物失败，请稍后再试',
      error: error.message
    });
  }
});

export default router;