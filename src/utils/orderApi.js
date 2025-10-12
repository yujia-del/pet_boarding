/**
 * 订单API工具函数
 * 提供订单相关的API调用功能
 */
import { apiRequest } from './api.js';
import { formatDate } from './formatters.js';

/**
 * 获取用户订单列表
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 订单列表
 */
export const getOrdersByUserId = async (userId, options = {}) => {
  const { page = 1, pageSize = 10, status } = options;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('pageSize', pageSize);
  
  if (status) {
    queryParams.append('status', status);
  }
  
  const endpoint = `/orders/${userId}?${queryParams.toString()}`;
  return apiRequest(endpoint);
};

/**
 * 取消订单
 * @param {number} orderId - 订单ID
 * @returns {Promise<Object>} 操作结果
 */
export const cancelOrder = async (orderId) => {
  const endpoint = `/orders/${orderId}/cancel`;
  return apiRequest(endpoint, {
    method: 'PUT'
  });
};

/**
 * 创建新订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} 新创建的订单信息
 */
export const createOrder = async (orderData) => {
  const endpoint = '/orders';
  
  // 确保日期时间格式正确，保留小时信息
  const formattedData = {
    ...orderData,
    startDate: orderData.startDate,
    endDate: orderData.endDate
  };
  
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(formattedData)
  });
};

/**
 * 获取订单详情
 * @param {number} orderId - 订单ID
 * @returns {Promise<Object>} 订单详情
 */
export const getOrderDetail = async (orderId) => {
  const endpoint = `/orders/detail/${orderId}`;
  return apiRequest(endpoint);
};

/**
 * 获取订单统计信息
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 订单统计数据
 */
export const getOrderStats = async (userId) => {
  const endpoint = `/orders/${userId}/stats`;
  try {
    return await apiRequest(endpoint);
  } catch (error) {
    // 如果接口不存在，返回默认统计数据
    console.warn('获取订单统计信息失败，使用默认数据');
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      canceledOrders: 0
    };
  }
};

/**
 * 生成订单查询参数
 * @param {Object} filters - 过滤条件
 * @returns {URLSearchParams} 查询参数对象
 */
export const generateOrderQueryParams = (filters) => {
  const { dateRange, status, sortBy, sortOrder } = filters;
  const params = new URLSearchParams();
  
  if (dateRange && dateRange.start && dateRange.end) {
    params.append('startDate', formatDate(dateRange.start));
    params.append('endDate', formatDate(dateRange.end));
  }
  
  if (status) {
    params.append('status', status);
  }
  
  if (sortBy) {
    params.append('sortBy', sortBy);
  }
  
  if (sortOrder) {
    params.append('sortOrder', sortOrder);
  }
  
  return params;
};