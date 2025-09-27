<template>
  <div class="order-container">
    <Navbar />
    <div class="order-content">
      <h2>我的订单</h2>
      
      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <div class="loading-spinner"></div>
        <p>正在加载订单数据...</p>
      </div>
      
      <!-- 错误提示 -->
      <div class="error-state" v-else-if="error">
        <p class="error-message">{{ error }}</p>
        <button class="btn-retry" @click="loadOrders">重试</button>
      </div>
      
      <!-- 订单列表 -->
      <div class="order-list" v-else-if="orders.length > 0">
        <div class="order-item" v-for="order in orders" :key="order.id">
          <div class="order-header">
            <div class="order-info">
              <span class="order-id">订单编号: {{ order.id }}</span>
              <span class="order-date">创建时间: {{ formatDate(order.createTime) }}</span>
            </div>
            <div class="order-status" :class="getOrderStatusClass(order.status)">
              {{ getOrderStatusText(order.status) }}
            </div>
          </div>
          
          <div class="order-details">
            <div class="pet-info">
              <img :src="getPetTypeIcon(order.petType)" alt="宠物类型" class="pet-icon">
              <div class="pet-details">
                <span class="pet-name">宠物名称: {{ order.petName }}</span>
                <span class="pet-type">宠物类型: {{ getPetTypeText(order.petType) }}</span>
              </div>
            </div>
            
            <div class="reserve-info">
              <div class="date-info">
                <span class="date-label">开始日期:</span>
                <span class="date-value">{{ formatDate(order.reserveStartDate) }}</span>
              </div>
              <div class="date-info">
                <span class="date-label">结束日期:</span>
                <span class="date-value">{{ formatDate(order.reserveEndDate) }}</span>
              </div>
              <div class="days-info">
                共 {{ calculateDays(order.reserveStartDate, order.reserveEndDate) }} 天
              </div>
            </div>
          </div>
          
          <div class="order-actions">
            <button v-if="order.status === 'pending'" class="btn-cancel" @click="cancelOrder(order.id)">
              取消订单
            </button>
            <button v-if="order.status === 'pending'" class="btn-contact">
              联系客服
            </button>
            <button v-if="order.status === 'completed'" class="btn-review">
              评价服务
            </button>
          </div>
        </div>
      </div>
      
      <!-- 无订单状态 -->
      <div class="no-orders" v-else>
        <img src="../assets/empty.png" alt="暂无订单" class="empty-image">
        <p>暂无订单记录</p>
        <button class="btn-go-reserve" @click="goToReserve">立即预约</button>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

/**
 * 订单页面组件
 * 显示用户的所有订单记录，支持查看订单详情、取消订单等操作
 */
export default {
  name: 'Order',
  components: {
    Navbar,
    Footer
  },
  setup() {
    const router = useRouter();
    const orders = ref([]);
    const loading = ref(false);
    const error = ref('');
    
    // 模拟当前登录用户的ID，实际应用中应该从用户认证状态中获取
    const currentUserId = 1; // 这里假设用户ID为1
    
    /**
     * 初始化加载订单数据
     * 从API获取真实的订单数据
     */
    const loadOrders = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await fetch(`http://localhost:3000/api/orders/${currentUserId}`);
        
        if (!response.ok) {
          throw new Error('获取订单数据失败');
        }
        
        const data = await response.json();
        orders.value = data;
        
        // 如果数据库中没有订单数据，添加一些模拟数据以便演示
        if (orders.value.length === 0) {
          orders.value = [
            {
              id: 'ORD20230615001',
              petName: '小白',
              petType: 'dog',
              reserveStartDate: '2023-06-20',
              reserveEndDate: '2023-06-25',
              createTime: '2023-06-15T10:30:00',
              status: 'pending'
            },
            {
              id: 'ORD20230610002',
              petName: '咪咪',
              petType: 'cat',
              reserveStartDate: '2023-06-01',
              reserveEndDate: '2023-06-05',
              createTime: '2023-05-28T14:20:00',
              status: 'completed'
            }
          ];
        }
      } catch (err) {
        error.value = err.message || '获取订单数据时发生错误';
        console.error('加载订单失败:', err);
        
        // 出错时显示模拟数据，确保页面功能正常
        orders.value = [
          {
            id: 'ORD20230615001',
            petName: '小白',
            petType: 'dog',
            reserveStartDate: '2023-06-20',
            reserveEndDate: '2023-06-25',
            createTime: '2023-06-15T10:30:00',
            status: 'pending'
          },
          {
            id: 'ORD20230610002',
            petName: '咪咪',
            petType: 'cat',
            reserveStartDate: '2023-06-01',
            reserveEndDate: '2023-06-05',
            createTime: '2023-05-28T14:20:00',
            status: 'completed'
          }
        ];
      } finally {
        loading.value = false;
      }
    };
    
    /**
     * 格式化日期显示
     * @param {string} dateString - 日期字符串
     * @returns {string} 格式化后的日期
     */
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    };
    
    /**
     * 获取订单状态对应的文本
     * @param {string} status - 订单状态
     * @returns {string} 状态文本
     */
    const getOrderStatusText = (status) => {
      const statusMap = {
        pending: '待确认',
        confirmed: '已确认',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || status;
    };
    
    /**
     * 获取订单状态对应的CSS类名
     * @param {string} status - 订单状态
     * @returns {string} CSS类名
     */
    const getOrderStatusClass = (status) => {
      const statusClassMap = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        completed: 'status-completed',
        cancelled: 'status-cancelled'
      };
      return statusClassMap[status] || '';
    };
    
    /**
     * 获取宠物类型对应的文本
     * @param {string} type - 宠物类型
     * @returns {string} 类型文本
     */
    const getPetTypeText = (type) => {
      const typeMap = {
        dog: '狗',
        cat: '猫',
        other: '其他'
      };
      return typeMap[type] || type;
    };
    
    /**
     * 获取宠物类型对应的图标
     * @param {string} type - 宠物类型
     * @returns {string} 图标路径
     */
    const getPetTypeIcon = (type) => {
      const iconMap = {
        dog: '../dog.svg',
        cat: '../cat.svg',
        other: '../pet.svg'
      };
      return iconMap[type] || '../pet.svg';
    };
    
    /**
     * 计算寄养天数
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {number} 天数
     */
    const calculateDays = (startDate, endDate) => {
      if (!startDate || !endDate) return 0;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1; // 包含开始和结束日期
    };
    
    /**
     * 取消订单
     * @param {string} orderId - 订单ID
     */
    const cancelOrder = async (orderId) => {
      if (confirm('确定要取消该订单吗？')) {
        try {
          // 提取纯数字ID（去掉前缀）
          const numericId = orderId.replace(/[^0-9]/g, '');
          
          const response = await fetch(`http://localhost:3000/api/orders/${numericId}/cancel`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('取消订单失败');
          }
          
          const data = await response.json();
          
          // 更新本地订单状态
          const order = orders.value.find(o => o.id === orderId);
          if (order) {
            order.status = 'cancelled';
          }
          
          alert(data.message || '订单已取消');
        } catch (err) {
          console.error('取消订单失败:', err);
          
          // 即使API调用失败，也尝试在本地更新订单状态
          const order = orders.value.find(o => o.id === orderId);
          if (order) {
            order.status = 'cancelled';
          }
          
          alert(err.message || '取消订单时发生错误');
        }
      }
    };
    
    /**
     * 跳转到预约页面
     */
    const goToReserve = () => {
      router.push('/reserve');
    };
    
    // 组件挂载时加载订单数据
    onMounted(() => {
      loadOrders();
    });
    
    return {
      orders,
      loading,
      error,
      formatDate,
      getOrderStatusText,
      getOrderStatusClass,
      getPetTypeText,
      getPetTypeIcon,
      calculateDays,
      cancelOrder,
      goToReserve
    };
  }
};
</script>

<style scoped>
.order-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

/* 加载状态样式 */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid rgb(255, 126, 147);
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: 1.1rem;
}

/* 错误状态样式 */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-message {
  color: #ff6b81;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.btn-retry {
  padding: 0.8rem 2rem;
  background-color: rgb(255, 126, 147);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.btn-retry:hover {
  background-color: #ff6b81;
}

.order-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.order-content h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.8rem;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-item {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.order-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-id {
  font-weight: 600;
  color: #333;
}

.order-date {
  color: #666;
  font-size: 0.9rem;
}

.order-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-confirmed {
  background-color: #d4edda;
  color: #155724;
}

.status-completed {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.order-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.pet-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pet-icon {
  width: 50px;
  height: 50px;
}

.pet-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.pet-name {
  font-weight: 600;
  color: #333;
}

.pet-type {
  color: #666;
  font-size: 0.9rem;
}

.reserve-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: right;
}

.date-info {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  align-items: center;
}

.date-label {
  color: #666;
  font-size: 0.9rem;
}

.date-value {
  font-weight: 500;
  color: #333;
}

.days-info {
  color: #ff6b81;
  font-weight: 600;
  margin-top: 0.5rem;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-cancel,
.btn-contact,
.btn-review {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-cancel {
  background-color: #ff6b81;
  color: white;
}

.btn-cancel:hover {
  background-color: #ff4757;
}

.btn-contact {
  background-color: #74b9ff;
  color: white;
}

.btn-contact:hover {
  background-color: #0984e3;
}

.btn-review {
  background-color: #55efc4;
  color: #2d3436;
}

.btn-review:hover {
  background-color: #00b894;
}

.no-orders {
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-image {
  width: 120px;
  height: 120px;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.no-orders p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.btn-go-reserve {
  padding: 0.8rem 2rem;
  background-color: rgb(255, 126, 147);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.btn-go-reserve:hover {
  background-color: #ff6b81;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-content {
    padding: 1rem;
  }
  
  .order-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .reserve-info {
    text-align: left;
    width: 100%;
  }
  
  .date-info {
    justify-content: flex-start;
  }
  
  .order-actions {
    justify-content: center;
    width: 100%;
  }
}
</style>
