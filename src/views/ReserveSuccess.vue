<template>
  <div class="success-container">
    <Navbar />
    <div class="success-content">
      <div class="success-message">
        <div class="success-icon">✓</div>
        <h2>预约成功！</h2>
        <p>您的宠物寄养预约已提交成功，我们会尽快与您联系确认详情。</p>
        
        <div class="booking-details" v-if="bookingDetails">
          <h3>预约详情</h3>
          <div class="detail-item">
            <span class="detail-label">宠物名称：</span>
            <span class="detail-value">{{ bookingDetails.petName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">宠物类型：</span>
            <span class="detail-value">{{ getPetTypeName(bookingDetails.petType) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">开始日期：</span>
            <span class="detail-value">{{ formatDate(bookingDetails.reserveStartDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">结束日期：</span>
            <span class="detail-value">{{ formatDate(bookingDetails.reserveEndDate) }}</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button @click="goToHome" class="btn-primary">返回首页</button>
          <button @click="goToMyOrders" class="btn-secondary">查看我的订单</button>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';

export default {
  name: 'ReserveSuccess',
  components: {
    Navbar,
    Footer
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const bookingDetails = ref(null);
    
    // 格式化日期显示
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    };
    
    // 获取宠物类型的中文名称
    const getPetTypeName = (type) => {
      const typeMap = {
        'dog': '狗',
        'cat': '猫',
        'other': '其他'
      };
      return typeMap[type] || type;
    };
    
    // 返回首页
    const goToHome = () => {
      router.push('/');
    };
    
    // 查看我的订单
    const goToMyOrders = () => {
      router.push('/order');
    };
    
    // 页面加载时获取预约详情
    onMounted(() => {
      if (route.query) {
        bookingDetails.value = route.query;
      }
    });
    
    return {
      bookingDetails,
      formatDate,
      getPetTypeName,
      goToHome,
      goToMyOrders
    };
  }
};
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.success-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #f8f9fa;
}

.success-message {
  background-color: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.success-icon {
  font-size: 3.5rem;
  color: #4CAF50;
  margin-bottom: 1.5rem;
}

.success-message h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.success-message p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.booking-details {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: left;
}

.booking-details h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.detail-value {
  color: #333;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-primary {
  background-color: rgb(255, 126, 147);
  color: white;
}

.btn-primary:hover {
  background-color: pink;
}

.btn-secondary {
  background-color: white;
  color: rgb(255, 126, 147);
  border: 1px solid rgb(255, 126, 147);
}

.btn-secondary:hover {
  background-color: #f9f9f9;
}

@media (max-width: 768px) {
  .success-message {
    padding: 1.5rem;
  }
  
  .success-icon {
    font-size: 2.5rem;
  }
  
  .success-message h2 {
    font-size: 1.6rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
  }
}
</style>