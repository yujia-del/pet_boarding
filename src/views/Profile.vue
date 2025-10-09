<template>
  <Navbar />
  <div class="profile-container">
    <div class="profile-card">
      <h2 class="profile-title">个人中心</h2>
      
      <!-- 用户信息表单 -->
      <form class="profile-form" @submit.prevent="handleUpdate">
        <!-- 用户基本信息 -->
        <div class="profile-header">
          <img class="profile-avatar" src="../user.svg" alt="用户头像">
          <div class="profile-info">
            <h3 class="profile-name">{{ userData.username }}</h3>
            <p class="profile-email">{{ userData.email }}</p>
          </div>
        </div>
        
        <!-- 表单字段 -->
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            id="username"
            type="text"
            v-model="userData.username"
            class="form-input"
            disabled
            placeholder="用户名"
          >
        </div>
        
        <div class="form-group">
          <label for="email" class="form-label">邮箱</label>
          <input
            id="email"
            type="email"
            v-model="userData.email"
            class="form-input"
            disabled
            placeholder="邮箱"
          >
        </div>
        
        <!-- 新增的地址字段 -->
        <div class="form-group">
          <label for="address" class="form-label">地址</label>
          <input
            id="address"
            type="text"
            v-model="userData.address"
            class="form-input"
            placeholder="请输入您的地址"
            @blur="validateAddress"
          >
          <div v-if="errors.address" class="error-message">{{ errors.address }}</div>
        </div>
        
        <!-- 新增的电话字段 -->
        <div class="form-group">
          <label for="phone" class="form-label">电话</label>
          <input
            id="phone"
            type="tel"
            v-model="userData.phone"
            class="form-input"
            placeholder="请输入您的电话号码"
            @blur="validatePhone"
          >
          <div v-if="errors.phone" class="error-message">{{ errors.phone }}</div>
        </div>
        
        <!-- 保存按钮 -->
        <button type="submit" class="update-button" :disabled="isSubmitting">
          {{ isSubmitting ? '保存中...' : '保存修改' }}
        </button>
        
        <!-- 操作结果提示 -->
        <div v-if="updateSuccess" class="success-message">个人信息更新成功！</div>
        <div v-if="updateError" class="error-message">{{ updateError }}</div>
      </form>
    </div>
  </div>
  <Footer />
</template>

<script>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Profile',
  components: {
    Navbar,
    Footer
  },
  setup() {
    const router = useRouter()
    
    // 用户数据
    const userData = reactive({
      id: '',
      username: '',
      email: '',
      address: '',
      phone: ''
    })
    
    // 表单错误信息
    const errors = reactive({
      address: '',
      phone: ''
    })
    
    // 提交状态
    const isSubmitting = ref(false)
    
    // 操作结果
    const updateSuccess = ref('')
    const updateError = ref('')
    
    /**
     * 加载用户信息
     * 从localStorage获取用户信息并从服务器获取最新数据
     */
    const loadUserInfo = async () => {
      try {
        // 从sessionStorage获取用户信息
        const storedUser = sessionStorage.getItem('userInfo')
        if (!storedUser) {
          // 如果没有用户信息，跳转到登录页面
          router.push('/login')
          return
        }
        
        const localUser = JSON.parse(storedUser)
        userData.id = localUser.id
        userData.username = localUser.username
        userData.email = localUser.email
        
        // 从服务器获取最新的用户信息
        const response = await fetch(`http://localhost:3000/api/users/${localUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          // 更新用户数据，特别是地址和电话字段
          userData.address = data.address || ''
          userData.phone = data.phone || ''
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
        updateError.value = '加载用户信息失败，请刷新页面重试'
      }
    }
    
    /**
     * 验证地址
     */
    const validateAddress = () => {
      if (userData.address && userData.address.length > 255) {
        errors.address = '地址不能超过255个字符'
      } else {
        errors.address = ''
      }
    }
    
    /**
     * 验证电话
     */
    const validatePhone = () => {
      if (userData.phone && !/^1[3-9]\d{9}$/.test(userData.phone)) {
        errors.phone = '请输入有效的手机号码'
      } else if (userData.phone && userData.phone.length > 20) {
        errors.phone = '电话不能超过20个字符'
      } else {
        errors.phone = ''
      }
    }
    
    /**
     * 处理用户信息更新
     */
    const handleUpdate = async () => {
      // 清除之前的结果提示
      updateSuccess.value = ''
      updateError.value = ''
      
      // 验证表单
      validateAddress()
      validatePhone()
      
      // 如果有验证错误，不提交
      if (errors.address || errors.phone) {
        return
      }
      
      try {
        isSubmitting.value = true
        
        // 调用后端API更新用户信息
        const response = await fetch(`http://localhost:3000/api/users/${userData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address: userData.address,
            phone: userData.phone
          })
        })
        
        if (response.ok) {
          updateSuccess.value = '个人信息更新成功！'
          // 更新sessionStorage中的用户信息
          const storedUser = sessionStorage.getItem('userInfo')
          if (storedUser) {
            const localUser = JSON.parse(storedUser)
            localUser.address = userData.address
            localUser.phone = userData.phone
            sessionStorage.setItem('userInfo', JSON.stringify(localUser))
          }
          
          // 3秒后清除成功提示
          setTimeout(() => {
            updateSuccess.value = ''
          }, 3000)
        } else {
          const data = await response.json()
          updateError.value = data.message || '更新失败，请稍后再试'
        }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        updateError.value = '网络错误，请检查您的连接或稍后再试'
      } finally {
        isSubmitting.value = false
      }
    }
    
    // 组件挂载时加载用户信息
    onMounted(() => {
      loadUserInfo()
    })
    
    return {
      userData,
      errors,
      isSubmitting,
      updateSuccess,
      updateError,
      handleUpdate,
      validateAddress,
      validatePhone
    }
  }
}
</script>

<style scoped>
.profile-container {
  height:1000px; /* 减去导航栏和页脚的高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.profile-card {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.profile-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 20px;
}

.profile-info {
  text-align: left;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px 0;
}

.profile-email {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.profile-form {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: pink;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.update-button {
  width: 100%;
  padding: 12px;
  background-color: pink;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
}

.update-button:hover:not(:disabled) {
  background-color: rgb(255, 145, 164);
}

.update-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 5px;
}

.success-message {
  color: #52c41a;
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  background-color: #f6ffed;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-card {
    padding: 20px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-avatar {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .profile-info {
    text-align: center;
  }
}
</style>