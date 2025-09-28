/**
 * 格式化工具函数
 * 提供日期、订单状态、金额等格式化功能
 */

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化时间
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 格式化后的时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 获取订单状态文本
 * @param {string} status - 订单状态
 * @returns {string} 状态对应的中文文本
 */
export const getOrderStatusText = (status) => {
  const statusMap = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    canceled: '已取消',
    failed: '失败'
  };
  
  return statusMap[status] || status;
};

/**
 * 获取订单状态样式类名
 * @param {string} status - 订单状态
 * @returns {string} 对应的CSS类名
 */
export const getOrderStatusClass = (status) => {
  const statusClassMap = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    completed: 'status-completed',
    canceled: 'status-canceled',
    failed: 'status-failed'
  };
  
  return statusClassMap[status] || '';
};

/**
 * 计算寄养天数
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {number} 寄养天数
 */
export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * 格式化金额
 * @param {number|string} amount - 金额
 * @returns {string} 格式化后的金额字符串 (保留两位小数)
 */
export const formatPrice = (amount) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '0.00';
  
  return numAmount.toFixed(2);
};

/**
 * 格式化宠物类型
 * @param {string} petType - 宠物类型
 * @returns {string} 格式化后的宠物类型文本
 */
export const formatPetType = (petType) => {
  const petTypeMap = {
    dog: '狗狗',
    cat: '猫咪',
    bird: '鸟类',
    fish: '水族',
    other: '其他'
  };
  
  return petTypeMap[petType.toLowerCase()] || petType;
};