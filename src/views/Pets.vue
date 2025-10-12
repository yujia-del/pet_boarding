<template>
  <div class="pets-container">
    <Navbar />
    
    <main class="content-wrapper">
      <div class="pets-content">
        <h1 class="page-title">我的宠物</h1>
        
        <!-- 添加宠物按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="showAddPetDialog">
            <el-icon><Plus /></el-icon>
            添加宠物
          </el-button>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <p>加载中...</p>
        </div>

        <!-- 宠物列表 -->
        <div v-else class="pets-list">
          <div v-if="pets.length === 0" class="empty-state">
            <el-empty description="暂无宠物信息" />
          </div>
          
          <el-card v-for="pet in pets" :key="pet.pet_id" class="pet-card">
            <div class="pet-card-header">
              <div class="pet-avatar">
                <el-avatar :icon="getPetIcon(pet.type)">{{ pet.pet_name.charAt(0) }}</el-avatar>
              </div>
              <div class="pet-info">
                <h3>{{ pet.pet_name }}</h3>
                <p>{{ pet.type }} · {{ pet.age }}岁 · {{ pet.gender }}</p>
              </div>
              <div class="pet-actions">
                <el-button type="primary" size="small" @click="editPet(pet)">编辑</el-button>
                <el-button type="danger" size="small" @click="deletePet(pet.pet_id)">删除</el-button>
              </div>
            </div>
            <div class="pet-details">
              <p><strong>品种：</strong>{{ pet.breed || '无' }}</p>
              <p><strong>体重：</strong>{{ pet.weight ? pet.weight + ' kg' : '未填写' }}</p>
              <p><strong>健康信息：</strong>{{ pet.health_info || '无' }}</p>
            </div>
          </el-card>
        </div>

        <!-- 添加/编辑宠物对话框 -->
        <el-dialog
          v-model="dialogVisible"
          :title="isEditing ? '编辑宠物' : '添加宠物'"
          width="500px"
        >
          <el-form
            ref="petFormRef"
            :model="formData"
            label-width="100px"
            :rules="formRules"
          >
            <el-form-item label="宠物名称" prop="petName">
              <el-input v-model="formData.petName" placeholder="请输入宠物名称" />
            </el-form-item>
            
            <el-form-item label="宠物类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择宠物类型">
                <el-option label="猫" value="猫" />
                <el-option label="狗" value="狗" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="宠物品种" prop="breed">
              <el-input v-model="formData.breed" placeholder="请输入宠物品种" />
            </el-form-item>
            
            <el-form-item label="年龄" prop="age">
              <el-input v-model.number="formData.age" placeholder="请输入年龄" type="number" min="0" />
            </el-form-item>
            
            <el-form-item label="性别" prop="gender">
              <el-select v-model="formData.gender" placeholder="请选择性别">
                <el-option label="公" value="公" />
                <el-option label="母" value="母" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="体重(kg)" prop="weight">
              <el-input v-model.number="formData.weight" placeholder="请输入体重" type="number" min="0" step="0.1" />
            </el-form-item>
            
            <el-form-item label="健康信息" prop="health_info">
              <el-input v-model="formData.health_info" placeholder="请输入健康信息" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取消</el-button>
              <el-button type="primary" @click="submitForm" :loading="isSubmitting">确定</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </main>
    
    <Footer />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

export default {
  name: 'Pets',
  components: {
    Plus,
    Navbar,
    Footer
  },
  setup() {
    const pets = ref([])
    const dialogVisible = ref(false)
    const isEditing = ref(false)
    const editingPetId = ref(null)
    const petFormRef = ref(null)
    const isLoading = ref(false)
    const isSubmitting = ref(false)
    
    // 表单数据，包含数据库中所有字段
    const formData = reactive({
      petName: '',
      type: '',
      breed: '',
      age: '',
      gender: '',
      weight: '',
      health_info: ''
    })
    
    // 表单验证规则
    const formRules = {
      petName: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
      type: [{ required: true, message: '请选择宠物类型', trigger: 'change' }],
      breed: [{ required: true, message: '请输入宠物品种', trigger: 'blur' }],
      age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
      gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
      weight: [{ required: true, message: '请输入体重', trigger: 'blur' }],
      health_info: [{ required: true, message: '请输入健康信息', trigger: 'blur' }]
    }
    
    /**
     * 加载宠物列表
     */
    const loadPets = async () => {
      isLoading.value = true
      try {
        const userInfoStr = sessionStorage.getItem('userInfo')
        
        if (!userInfoStr) {
          ElMessage.error('用户未登录，请先登录')
          return
        }
        
        let userInfo
        try {
          userInfo = JSON.parse(userInfoStr)
        } catch (parseError) {
          console.error('用户信息解析失败:', parseError)
          ElMessage.error('用户登录信息格式错误，请重新登录')
          return
        }
        
        if (!userInfo || typeof userInfo !== 'object' || !userInfo.user_id) {
          ElMessage.error('用户登录信息无效或不完整，请重新登录')
          return
        }
        
        try {
          const response = await fetch(`/api/pets?userId=${userInfo.user_id}`)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('API请求失败:', response.status, errorText)
            throw new Error(`获取宠物列表失败，状态码：${response.status}，错误信息：${errorText}`)
          }
          
          try {
            const data = await response.json()
            pets.value = data
          } catch (jsonError) {
            console.error('响应数据解析失败:', jsonError)
            throw new Error('服务器返回数据格式错误')
          }
        } catch (networkError) {
          console.error('网络请求失败:', networkError)
          // 检查是否是网络连接问题
          if (!navigator.onLine) {
            ElMessage.error('网络连接已断开，请检查网络设置')
          } else {
            throw networkError
          }
        }
      } catch (error) {
        console.error('加载宠物数据失败:', error.message)
        // 根据错误类型提供更具体的错误信息
        if (error.message.includes('404')) {
          ElMessage.error('请求的资源不存在，请联系管理员')
        } else if (error.message.includes('500')) {
          ElMessage.error('服务器内部错误，请稍后再试')
        } else {
          ElMessage.error('加载宠物数据失败，请稍后再试')
        }
      } finally {
        isLoading.value = false
      }
    }
    
    /**
     * 显示添加宠物对话框
     */
    const showAddPetDialog = () => {
      resetForm()
      isEditing.value = false
      dialogVisible.value = true
    }
    
    /**
     * 编辑宠物
     * @param {Object} pet - 要编辑的宠物对象
     */
    const editPet = (pet) => {
      Object.assign(formData, {
        petName: pet.pet_name,
        type: pet.type,
        breed: pet.breed,
        age: pet.age,
        gender: pet.gender,
        weight: pet.weight === null || pet.weight === undefined ? '' : pet.weight,
        health_info: pet.health_info === null || pet.health_info === undefined ? '' : pet.health_info
      })
      isEditing.value = true
      editingPetId.value = pet.pet_id
      dialogVisible.value = true
    }
    
    /**
     * 删除宠物
     * @param {number} id - 宠物ID
     */
    const deletePet = async (id) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除这只宠物吗？\n注意：如果该宠物已有相关寄养订单，将无法删除。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await fetch(`/api/pets/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          // 尝试解析错误信息
          let errorMessage = `删除宠物失败，状态码：${response.status}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            // 如果无法解析JSON，使用默认错误信息
          }
          throw new Error(errorMessage)
        }
        
        // 重新加载宠物列表
        await loadPets()
        ElMessage.success('删除成功')
      } catch (error) {
        if (error.name !== 'Error' || error.message !== 'cancel') {
          console.error('删除宠物失败:', error)
          // 如果是因为有订单导致的删除失败，显示更友好的提示
          if (error.message.includes('已有相关寄养订单')) {
            ElMessage.error(error.message)
          } else {
            ElMessage.error('删除失败，请稍后重试')
          }
        } else {
          ElMessage.info('已取消删除')
        }
      }
    }
    
    /**
     * 提交表单
     * 添加或更新宠物信息
     */
    const submitForm = async () => {
      petFormRef.value.validate(async (valid) => {
        if (valid) {
          isSubmitting.value = true
          try {
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))
            if (!userInfo || !userInfo.user_id) {
              throw new Error('用户未登录或登录信息无效')
            }
            
            let url = '/api/pets'
            let method = 'POST'
            
            // 准备请求体，包含所有需要的字段，并处理空值和类型转换
            const requestBody = {
              petName: formData.petName,
              type: formData.type,
              breed: formData.breed,
              age: formData.age,
              gender: formData.gender,
              weight: formData.weight === '' || formData.weight === null || formData.weight === undefined ? null : Number(formData.weight),
              health_info: formData.health_info === '' || formData.health_info === null || formData.health_info === undefined ? null : formData.health_info,
              ownerId: userInfo.user_id
            }
            
            if (isEditing.value) {
              url = `/api/pets/${editingPetId.value}`
              method = 'PUT'
            }
            
            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            })
            
            if (!response.ok) {
              throw new Error(`${isEditing.value ? '更新' : '添加'}宠物失败，状态码：${response.status}`)
            }
            
            // 重新加载宠物列表
            await loadPets()
            
            // 关闭对话框
            dialogVisible.value = false
            ElMessage.success(`${isEditing.value ? '更新' : '添加'}宠物信息成功`)
          } catch (error) {
            console.error(`${isEditing.value ? '更新' : '添加'}宠物数据失败:`, error)
            ElMessage.error(`${isEditing.value ? '更新' : '添加'}失败，请稍后重试`)
          } finally {
            isSubmitting.value = false
          }
        }
      })
    }
    
    /**
     * 重置表单
     */
    const resetForm = () => {
      if (petFormRef.value) {
        petFormRef.value.resetFields()
      }
      Object.keys(formData).forEach(key => {
        formData[key] = ''
      })
      editingPetId.value = null
    }
    
    /**
     * 根据宠物类型获取对应的图标
     * @param {string} type - 宠物类型
     * @returns {undefined} - 不返回图标，使用宠物名称首字母
     */
    const getPetIcon = (type) => {
      // 不返回任何图标，让el-avatar使用宠物名称首字母
      return undefined
    }
    
    // 组件挂载时加载宠物列表
    onMounted(() => {
      loadPets()
    })
    
    return {
      pets,
      dialogVisible,
      isEditing,
      petFormRef,
      formData,
      formRules,
      isLoading,
      isSubmitting,
      showAddPetDialog,
      editPet,
      deletePet,
      submitForm,
      getPetIcon
    }
  }
}
</script>

<style scoped>
.pets-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  background-color: #f5f7fa;
}

.pets-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: #303133;
  margin-bottom: 20px;
  text-align: center;
}

.action-buttons {
  margin-bottom: 20px;
  text-align: right;
}

.loading-state {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pets-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.pet-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pet-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.pet-avatar {
  margin-right: 15px;
}

.pet-info {
  flex: 1;
}

.pet-info h3 {
  margin: 0 0 5px 0;
  color: #303133;
}

.pet-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.pet-actions {
  display: flex;
  gap: 10px;
}

.pet-details {
  margin-top: auto;
}

.pet-details p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>