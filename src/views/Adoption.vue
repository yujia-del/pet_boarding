<template>
  <div class="adoption-page">
    <Navbar />
    <div v-if="!isLoggedIn" class="not-logged-in">
      <div class="not-logged-in-content">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#666" stroke-width="2"/>
            <path d="M3 14V21C3 21.5304 3.21071 22.0391 3.58579 22.4142C3.96086 22.7893 4.46957 23 5 23H19C19.5304 23 20.0391 22.7893 20.4142 22.4142C20.7893 22.0391 21 21.5304 21 21V14C21 13.4696 20.7893 12.9609 20.4142 12.5858C20.0391 12.2107 19.5304 12 19 12H5C4.46957 12 3.96086 12.2107 3.58579 12.5858C3.21071 12.9609 3 13.4696 3 14Z" stroke="#666" stroke-width="2"/>
          </svg>
        </div>
        <h2>请先登录</h2>
        <p>登录后才能浏览和申请领养宠物哦</p>
        <button @click="goToLogin" class="login-button">立即登录</button>
      </div>
    </div>
    <div v-else class="adoption-content">
      <header class="page-header">
        <h1>宠物领养</h1>
        <p>给它们一个温暖的家</p>
      </header>
      
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>宠物类型</label>
          <select v-model="filters.petType">
            <option value="all">全部</option>
            <option value="cat">猫</option>
            <option value="dog">狗</option>
            <option value="other">其他</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>年龄范围</label>
          <select v-model="filters.ageRange">
            <option value="all">不限</option>
            <option value="baby">幼年 (0-1岁)</option>
            <option value="young">青年 (1-3岁)</option>
            <option value="adult">成年 (3-7岁)</option>
            <option value="senior">老年 (7岁以上)</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>性别</label>
          <select v-model="filters.gender">
            <option value="all">不限</option>
            <option value="male">公</option>
            <option value="female">母</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>是否已绝育</label>
          <select v-model="filters.neutered">
            <option value="all">不限</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        </div>
        
        <button @click="resetFilters" class="reset-button">重置筛选</button>
      </div>
      
      <!-- 宠物列表 -->
      <div class="pets-grid">
        <div v-for="pet in filteredPets" :key="pet.id" class="pet-card">
          <div class="pet-image">
            <img :src="pet.image" :alt="pet.name" />
          </div>
          <div class="pet-info">
            <div class="pet-name-row">
              <h3>{{ pet.name }}</h3>
              <span class="pet-type-badge">{{ getPetTypeText(pet.type) }}</span>
            </div>
            <div class="pet-details">
              <div class="detail-item">
                <span class="detail-label">年龄:</span>
                <span class="detail-value">{{ pet.age }}岁</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">性别:</span>
                <span class="detail-value">{{ pet.gender === 'male' ? '公' : '母' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">品种:</span>
                <span class="detail-value">{{ pet.breed }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">绝育:</span>
                <span class="detail-value">{{ pet.neutered ? '是' : '否' }}</span>
              </div>
            </div>
            <p class="pet-description">{{ pet.description }}</p>
            <button @click="showAdoptionDialog(pet)" class="adopt-button">申请领养</button>
          </div>
        </div>
      </div>
      
      <!-- 领养对话框 -->
      <div v-if="showDialog" class="dialog-overlay" @click.self="closeAdoptionDialog">
        <div class="dialog-content">
          <h3>领养申请 - {{ selectedPet?.name }}</h3>
          <div class="dialog-pet-info">
            <img :src="selectedPet?.image" :alt="selectedPet?.name" />
            <div>
              <p><strong>品种:</strong> {{ selectedPet?.breed }}</p>
              <p><strong>年龄:</strong> {{ selectedPet?.age }}岁</p>
              <p><strong>性别:</strong> {{ selectedPet?.gender === 'male' ? '公' : '母' }}</p>
            </div>
          </div>
          <div class="adoption-form">
            <div class="form-group">
              <label>您的姓名</label>
              <input v-model="adoptionForm.name" type="text" placeholder="请输入您的姓名" />
            </div>
            <div class="form-group">
              <label>联系电话</label>
              <input v-model="adoptionForm.phone" type="tel" placeholder="请输入您的联系电话" />
            </div>
            <div class="form-group">
              <label>居住情况</label>
              <textarea v-model="adoptionForm.livingCondition" placeholder="请描述您的居住环境、是否有其他宠物等信息" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>领养原因</label>
              <textarea v-model="adoptionForm.reason" placeholder="请说明您想领养这只宠物的原因" rows="3"></textarea>
            </div>
          </div>
          <div class="dialog-actions">
            <button @click="closeAdoptionDialog" class="cancel-button">取消</button>
            <button @click="submitAdoption" class="submit-button">提交申请</button>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

// 路由实例
const router = useRouter()

// 状态管理
const isLoggedIn = ref(false)
const pets = ref([])
const filters = ref({
  petType: 'all',
  ageRange: 'all',
  gender: 'all',
  neutered: 'all'
})
const showDialog = ref(false)
const selectedPet = ref(null)
const adoptionForm = ref({
  name: '',
  phone: '',
  livingCondition: '',
  reason: ''
})

/**
 * 筛选后的宠物列表
 */
const filteredPets = computed(() => {
  return pets.value.filter(pet => {
    // 筛选宠物类型
    if (filters.value.petType !== 'all' && pet.type !== filters.value.petType) {
      return false
    }
    
    // 筛选年龄范围
    if (filters.value.ageRange !== 'all') {
      const age = pet.age
      switch (filters.value.ageRange) {
        case 'baby':
          if (age > 1) return false
          break
        case 'young':
          if (age <= 1 || age > 3) return false
          break
        case 'adult':
          if (age <= 3 || age > 7) return false
          break
        case 'senior':
          if (age <= 7) return false
          break
      }
    }
    
    // 筛选性别
    if (filters.value.gender !== 'all' && pet.gender !== filters.value.gender) {
      return false
    }
    
    // 筛选绝育情况
    if (filters.value.neutered !== 'all') {
      const neutered = filters.value.neutered === 'true'
      if (pet.neutered !== neutered) {
        return false
      }
    }
    
    return true
  })
})

/**
 * 检查用户登录状态
 */
const checkLoginStatus = () => {
  const userInfo = sessionStorage.getItem('userInfo')
  isLoggedIn.value = !!userInfo
}

/**
 * 跳转到登录页面
 */
const goToLogin = () => {
  // 保存当前页面路径，登录后可以返回
  sessionStorage.setItem('redirectPath', '/Adoption')
  router.push('/Login')
}

/**
 * 获取宠物列表数据
 */
const fetchPets = () => {
  // 这里应该从API获取数据，目前使用模拟数据
  pets.value = [
    {
      id: 1,
      name: '小白',
      type: 'cat',
      age: 2,
      gender: 'female',
      breed: '英国短毛猫',
      neutered: true,
      description: '性格温顺，喜欢与人互动，很适合有小孩的家庭。',
      image: 'https://picsum.photos/id/40/300/300'
    },
    {
      id: 2,
      name: '阿黄',
      type: 'dog',
      age: 3,
      gender: 'male',
      breed: '金毛',
      neutered: true,
      description: '活泼开朗，非常友善，喜欢户外活动。',
      image: 'https://picsum.photos/id/237/300/300'
    },
    {
      id: 3,
      name: '灰灰',
      type: 'cat',
      age: 1,
      gender: 'male',
      breed: '美国短毛猫',
      neutered: false,
      description: '好奇心强，喜欢玩耍，是个小机灵鬼。',
      image: 'https://picsum.photos/id/41/300/300'
    },
    {
      id: 4,
      name: '小黑',
      type: 'dog',
      age: 5,
      gender: 'female',
      breed: '拉布拉多',
      neutered: true,
      description: '非常温顺，训练有素，适合做导盲犬。',
      image: 'https://picsum.photos/id/238/300/300'
    },
    {
      id: 5,
      name: '花花',
      type: 'cat',
      age: 4,
      gender: 'female',
      breed: '布偶猫',
      neutered: true,
      description: '粘人，喜欢被抱抱，毛发柔软顺滑。',
      image: 'https://picsum.photos/id/42/300/300'
    },
    {
      id: 6,
      name: '豆豆',
      type: 'other',
      age: 1,
      gender: 'male',
      breed: '垂耳兔',
      neutered: false,
      description: '安静乖巧，不挑食，很好养活。',
      image: 'https://picsum.photos/id/338/300/300'
    }
  ]
}

/**
 * 获取宠物类型的中文文本
 * @param {string} type - 宠物类型
 * @returns {string} - 中文类型文本
 */
const getPetTypeText = (type) => {
  const typeMap = {
    cat: '猫',
    dog: '狗',
    other: '其他'
  }
  return typeMap[type] || type
}

/**
 * 重置筛选条件
 */
const resetFilters = () => {
  filters.value = {
    petType: 'all',
    ageRange: 'all',
    gender: 'all',
    neutered: 'all'
  }
}

/**
 * 显示领养对话框
 * @param {object} pet - 选中的宠物
 */
const showAdoptionDialog = (pet) => {
  selectedPet.value = pet
  adoptionForm.value = {
    name: '',
    phone: '',
    livingCondition: '',
    reason: ''
  }
  showDialog.value = true
}

/**
 * 关闭领养对话框
 */
const closeAdoptionDialog = () => {
  showDialog.value = false
  selectedPet.value = null
}

/**
 * 提交领养申请
 */
const submitAdoption = () => {
  // 这里应该提交到API，目前只是简单的提示
  if (!adoptionForm.value.name || !adoptionForm.value.phone || !adoptionForm.value.livingCondition || !adoptionForm.value.reason) {
    alert('请填写完整的领养信息')
    return
  }
  
  // 模拟提交成功
  alert('领养申请已提交，请等待工作人员联系您！')
  closeAdoptionDialog()
}

// 组件挂载时执行
onMounted(() => {
  checkLoginStatus()
  fetchPets()
})

</script>

<style scoped>
.adoption-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 未登录状态样式 */
.not-logged-in {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  background-color: #f5f5f5;
}

.not-logged-in-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.icon-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
}

.not-logged-in-content h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
}

.not-logged-in-content p {
  color: #666;
  margin-bottom: 20px;
}

.login-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #45a049;
}

/* 领养内容样式 */
.adoption-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin: 20px 0;
}

.page-header h1 {
  font-size: 36px;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 18px;
  opacity: 0.9;
}

/* 筛选栏样式 */
.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.filter-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
}

.reset-button {
  padding: 10px 20px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.reset-button:hover {
  background-color: #e0e0e0;
}

/* 宠物列表样式 */
.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.pet-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.pet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.pet-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.pet-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.pet-card:hover .pet-image img {
  transform: scale(1.05);
}

.pet-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pet-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.pet-name-row h3 {
  font-size: 20px;
  margin: 0;
  color: #333;
}

.pet-type-badge {
  background-color: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.pet-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-label {
  width: 60px;
  color: #666;
}

.detail-value {
  color: #333;
  flex: 1;
}

.pet-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
  flex: 1;
}

.adopt-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.adopt-button:hover {
  background-color: #45a049;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

.dialog-pet-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.dialog-pet-info img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 20px;
}

.dialog-pet-info p {
  margin: 5px 0;
  color: #666;
}

/* 表单样式 */
.adoption-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

/* 对话框按钮 */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cancel-button {
  padding: 10px 20px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.submit-button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #45a049;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    gap: 15px;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .pets-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .dialog-content {
    padding: 20px;
  }
}
</style>