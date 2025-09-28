/**
 * API工具函数
 * 提供API请求、认证等功能封装
 */
import { ref } from 'vue';

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 从localStorage获取用户信息
 * @returns {Object|null} 用户信息对象或null
 */
export const getUserInfo = () => {
  try {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('解析用户信息失败:', error);
  }
  return null;
};

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isUserLoggedIn = () => {
  return !!getUserInfo();
};

/**
 * 获取当前用户ID
 * @returns {number|null} 用户ID或null
 */
export const getCurrentUserId = () => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.id : null;
};

/**
 * 封装fetch API请求
 * @param {string} endpoint - API端点路径
 * @param {Object} options - fetch选项
 * @returns {Promise<any>} 请求结果
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options
  };
  
  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败: ${response.status}`);
    }
    
    // 处理空响应
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error(`API请求错误 [${url}]:`, error);
    throw error;
  }
};

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @param {Function} setError - 设置错误状态的函数
 * @returns {void}
 */
export const handleApiError = (error, setError) => {
  if (typeof setError === 'function') {
    if (error.message.includes('Failed to fetch')) {
      setError('网络连接失败，请检查您的网络设置或稍后再试');
    } else {
      setError(error.message || '操作失败，请稍后再试');
    }
  }
};

/**
 * 创建带加载状态的API请求函数
 * @param {Function} apiFunc - API函数
 * @param {Object} stateRefs - 状态引用对象
 * @returns {Function} 带加载状态的API函数
 */
export const createStatefulApiFunction = (apiFunc, stateRefs = {}) => {
  const { loading = ref(false), error = ref('') } = stateRefs;
  
  const wrappedFunction = async (...args) => {
    loading.value = true;
    error.value = '';
    
    try {
      const result = await apiFunc(...args);
      return result;
    } catch (err) {
      handleApiError(err, (message) => { error.value = message; });
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  return { function: wrappedFunction, loading, error };
};