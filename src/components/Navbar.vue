<template>
  <div 
    class="navbar" 
    :style="{
      opacity: opacity,
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }"
  >
    <div class="navbar-left">
      <img src="../cat.svg" class="navbar-logo" alt="logo"></img>
      <span class="brand-name">宠物寄养</span>
    </div>
    <div class="navbar-center">
      <div class="navbar-center-item" @click="navigateToHome">首页</div>
      <div class="navbar-center-item" @click="navigateToReserve">预约服务</div>
      <div class="navbar-center-item" @click="navigateToServices">服务介绍</div>
      <div class="navbar-center-item" @click="navigateToAbout">关于我们</div>
    </div>
    <div class="navbar-right">
      <!-- 用户未登录状态显示 -->
      <div class="navbar-right-item" @click="navigateToLogin" v-if="!isAuthenticated">登录/注册</div>
      <!-- 用户已登录状态显示 -->
      <div v-if="isAuthenticated" class="navbar-right">
        <!-- 用户图标和下拉框 -->
        <div class="user-dropdown-container">
          <img 
            class="user-icon" 
            @click="navigateToProfile"
            @mouseenter="showUserDropdown = true"
            @mouseleave="handleUserIconMouseLeave"
            src="../user.svg" 
            alt="用户图标">
          
          <!-- 用户信息下拉框 -->
           <div 
             class="user-dropdown" 
             v-if="showUserDropdown && userInfo"
             @mouseenter="handleDropdownMouseEnter"
             @mouseleave="showUserDropdown = false">
            <div class="user-dropdown-header">
              <img class="dropdown-user-icon" src="../user.svg" alt="用户头像">
              <div class="user-details">
                <div class="user-dropdown-name">{{ userInfo.username }}</div>
                <div class="user-dropdown-email">{{ userInfo.email }}</div>
              </div>
            </div>
            <div class="user-dropdown-menu">
              <div class="user-dropdown-item" @click="navigateToProfile">
                <span>个人中心</span>
              </div>
              <div class="user-dropdown-item" @click="navigateToOrder">
                <span>我的订单</span>
              </div>
              <div class="user-dropdown-item" @click="navigateToCustomerService">
                <span>联系客服</span>
              </div>
              <div class="user-dropdown-divider"></div>
              <div class="user-dropdown-item logout-item" @click="navigateToLogout">
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'Navbar',
  setup() {
    const router = useRouter()
    // 用户认证状态
    const isAuthenticated = ref(false)
    // 用户信息
    const userInfo = ref(null)
    // 控制用户下拉框显示
    const showUserDropdown = ref(false)
    // 下拉框显示的定时器
    let dropdownTimer = null
    // 滚动相关变量
    const lastScrollY = ref(0)
    const isVisible = ref(true)
    const opacity = ref(1)

    /**
     * 检查用户认证状态
     * 从localStorage中读取用户信息并设置认证状态
     */
    const checkAuthStatus = () => {
      const storedUser = localStorage.getItem('userInfo')
      if (storedUser) {
        try {
          userInfo.value = JSON.parse(storedUser)
          isAuthenticated.value = true
        } catch (error) {
          console.error('解析用户信息失败:', error)
          isAuthenticated.value = false
          userInfo.value = null
        }
      }
    }

    /**
     * 跳转到首页
     */
    const navigateToHome = () => {
      router.push('/')
    }
    /**
     * 跳转到联系客服页面
     */
    const navigateToCustomerService = () => {
      router.push('/customer-service')
    }
    /**
     * 跳转到在线预约页面
     */
    const navigateToReserve = () => {
      router.push('/reserve')
    }

    /**
     * 跳转到服务介绍页面
     */
    const navigateToServices = () => {
      router.push('/services')
    }
    const navigateToOrder = () => {
      router.push('/order')
    }

    /**
     * 跳转到关于我们页面
     */
    const navigateToAbout = () => {
      router.push('/about')
    }

    /**
     * 跳转到登录页面
     */
    const navigateToLogin = () => {
      router.push('/login')
    }

    /**
     * 跳转到个人中心页面
     */
    const navigateToProfile = () => {
      if (isAuthenticated.value) {
        showUserDropdown.value = false
        router.push('/profile')
      }
    }

    /**
     * 退出登录
     * 清除用户信息并跳转到登录页面
     */
    const navigateToLogout = () => {
      // 清除用户信息
      localStorage.removeItem('userInfo')
      isAuthenticated.value = false
      userInfo.value = null
      showUserDropdown.value = false
      // 跳转到登录页面
      router.push('/')
    }

    /**
      * 处理用户图标鼠标离开事件
      * 添加延迟以允许鼠标移动到下拉框
      */
     const handleUserIconMouseLeave = () => {
       dropdownTimer = setTimeout(() => {
         showUserDropdown.value = false
       }, 200)
     }

     /**
      * 处理下拉框鼠标进入事件
      * 清除定时器并保持下拉框显示
      */
     const handleDropdownMouseEnter = () => {
       if (dropdownTimer) {
         clearTimeout(dropdownTimer)
         dropdownTimer = null
       }
       showUserDropdown.value = true
     }

    /**
     * 处理滚动事件
     * 实现导航栏在向下滑动时逐渐消失，向上滑动时重新显示
     */
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // 降低触发阈值，使效果更敏感
      if (Math.abs(currentScrollY - lastScrollY.value) > 2) {
        // 向下滚动超过20px时就开始隐藏导航栏，降低触发高度
        if (currentScrollY > lastScrollY.value && currentScrollY > 20) {
          isVisible.value = false
          // 简化透明度计算，使过渡更直接
          opacity.value = 0
        } else {
          // 向上滚动时，立即显示导航栏
          isVisible.value = true
          opacity.value = 1
        }
        
        lastScrollY.value = currentScrollY
      }
    }

    // 组件挂载时检查认证状态并添加滚动监听
    onMounted(() => {
      checkAuthStatus()
      window.addEventListener('scroll', handleScroll)
    })

    // 组件卸载时移除滚动监听
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      isAuthenticated,
      userInfo,
      showUserDropdown,
      navigateToHome,
      navigateToServices,
      navigateToAbout,
      navigateToLogin,
      navigateToProfile,
      navigateToLogout,
      navigateToReserve,
      navigateToCustomerService,
      handleUserIconMouseLeave,
      handleDropdownMouseEnter,
      navigateToOrder,
      isVisible,
      opacity
    }
  }
}
</script>
<style scoped>
.navbar {
  width: 100%;
  height: 70px;
  background-color: rgb(250, 171, 184);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.navbar-logo {
  height: 50px;
  width: 50px;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.navbar-logo:hover {
  transform: scale(1.1);
}

.user-icon{
  height: 40px;
  width: 40px;
  border-radius: 50%;
}

.user-icon:hover {
  transform: scale(1.1);
  transition: 200ms;
}

.brand-name {
  font-size: 1.4rem;
  font-weight: bold;
  font-family: 'Arial', sans-serif;
}

.navbar-center {
  display: flex;
  gap: 20px;
}

.navbar-center-item {
  cursor: pointer;
  padding: 5px 10px;
  transition: all 0.3s ease;
  border-radius: 4px;
  font-size: 1rem;
}

.navbar-center-item:hover {
  color: rgb(140, 49, 114);
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.navbar-right {
  display: flex;
  gap: 15px;
  align-items: center;
  padding-top: 3px;
}

.navbar-right-item {
  cursor: pointer;
  padding: 5px 10px;
  transition: all 0.3s ease;
  border-radius: 4px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.navbar-right-item:hover {
  color: rgb(140, 49, 114);
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* 用户信息样式 */
.user-info {
  background-color: rgba(255, 255, 255, 0.15);
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.user-name {
  font-size: 0.9rem;
}

/* 图标样式 */
.login-icon,
.profile-icon,
.logout-icon,
.feedback-icon {
  font-size: 1rem;
}

/* 退出按钮特殊样式 */
.logout {
  background-color: rgba(0, 0, 0, 0.2);
}

.logout:hover {
  background-color: rgba(9, 3, 3, 0.495);
  color: white;
}

/* 用户下拉框样式 */
.user-dropdown-container {
  position: relative;
  display: inline-block;
  background-color: rgba(0, 0, 0, 0);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 220px;
  margin-top: 8px;
  z-index: 1001;
  color: #000000da;
}

.user-dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
}

.dropdown-user-icon {
  height: 40px;
  width: 40px;
  border-radius: 50%;
}

.user-details {
  flex: 1;
}

.user-dropdown-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
}

.user-dropdown-email {
  font-size: 0.85rem;
  color: #666;
  margin-top: 2px;
}

.user-dropdown-menu {
  padding: 4px 0;
}

.user-dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-dropdown-item:hover {
  background-color: rgba(184, 135, 176, 0.1);
  color: #b887b0;
}

.user-dropdown-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}

.logout-item:hover {
  color: #e53e3e !important;
}

/* 下拉框箭头 */
.user-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 16px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(255, 255, 255, 0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    padding: 0 10px;
  }

  .navbar-center {
    gap: 10px;
  }

  .navbar-center-item {
    font-size: 0.85rem;
  }

  .navbar-right {
    gap: 10px;
  }

  .navbar-right-item {
    font-size: 0.85rem;
    padding: 3px 8px;
  }

  .brand-name {
    font-size: 1rem;
  }
}
</style>