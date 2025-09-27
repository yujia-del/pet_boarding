<template>
    <Navbar />
    <div class="register-container">
        <div class="register-card">
            <h2 class="register-title">用户注册</h2>
            
            <!-- 注册表单 -->
            <form class="register-form" @submit.prevent="handleRegister">
                <!-- 用户名输入框 -->
                <div class="form-group">
                    <label for="username" class="form-label">用户名</label>
                    <input
                        id="username"
                        type="text"
                        v-model="formData.username"
                        class="form-input"
                        placeholder="请输入用户名"
                        required
                        @blur="validateUsername"
                    >
                    <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
                </div>
                
                <!-- 邮箱输入框 -->
                <div class="form-group">
                    <label for="email" class="form-label">邮箱</label>
                    <input
                        id="email"
                        type="email"
                        v-model="formData.email"
                        class="form-input"
                        placeholder="请输入邮箱"
                        required
                        @blur="validateEmail"
                    >
                    <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
                </div>
                
                <!-- 地址输入框 -->
                <div class="form-group">
                    <label for="address" class="form-label">地址（选填）</label>
                    <input
                        id="address"
                        type="text"
                        v-model="formData.address"
                        class="form-input"
                        placeholder="请输入您的地址"
                        @blur="validateAddress"
                    >
                    <div v-if="errors.address" class="error-message">{{ errors.address }}</div>
                </div>
                
                <!-- 电话输入框 -->
                <div class="form-group">
                    <label for="phone" class="form-label">电话（选填）</label>
                    <input
                        id="phone"
                        type="tel"
                        v-model="formData.phone"
                        class="form-input"
                        placeholder="请输入您的电话号码"
                        @blur="validatePhone"
                    >
                    <div v-if="errors.phone" class="error-message">{{ errors.phone }}</div>
                </div>
                
                <!-- 密码输入框 -->
                <div class="form-group">
                    <label for="password" class="form-label">密码</label>
                    <input
                        id="password"
                        type="password"
                        v-model="formData.password"
                        class="form-input"
                        placeholder="请输入密码"
                        required
                        @blur="validatePassword"
                    >
                    <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
                </div>
                
                <!-- 确认密码输入框 -->
                <div class="form-group">
                    <label for="confirmPassword" class="form-label">确认密码</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        v-model="formData.confirmPassword"
                        class="form-input"
                        placeholder="请再次输入密码"
                        required
                        @blur="validateConfirmPassword"
                    >
                    <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
                </div>
                
                <!-- 注册按钮 -->
                <button type="submit" class="register-button" :disabled="isSubmitting">
                    {{ isSubmitting ? '注册中...' : '注册' }}
                </button>
                
                <!-- 注册错误提示 -->
                <div v-if="registerError" class="register-error">{{ registerError }}</div>
                
                <!-- 登录链接 -->
                <div class="login-link">
                    已有账户? <a href="/login" class="login-button">前往登录</a>
                </div>
            </form>
        </div>
    </div>
    <Footer />
</template>

<script>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
    name: 'Register',
    components: {
        Navbar,
        Footer
    },
    setup() {
        const router = useRouter()
        
        // 表单数据
        const formData = reactive({
            username: '',
            email: '',
            address: '',
            phone: '',
            password: '',
            confirmPassword: ''
        })
        
        // 错误信息
        const errors = reactive({
            username: '',
            email: '',
            address: '',
            phone: '',
            password: '',
            confirmPassword: ''
        })
        
        // 注册错误信息
        const registerError = ref('')
        
        // 提交状态
        const isSubmitting = ref(false)
        
        /**
         * 验证用户名
         */
        const validateUsername = () => {
            if (!formData.username.trim()) {
                errors.username = '用户名不能为空'
            } else if (formData.username.length < 4) {
                errors.username = '用户名至少需要4个字符'
            } else {
                errors.username = ''
            }
        }
        
        /**
         * 验证邮箱
         */
        const validateEmail = () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!formData.email.trim()) {
                errors.email = '邮箱不能为空'
            } else if (!emailRegex.test(formData.email)) {
                errors.email = '请输入有效的邮箱地址'
            } else {
                errors.email = ''
            }
        }
        
        /**
         * 验证密码
         */
        const validatePassword = () => {
            if (!formData.password) {
                errors.password = '密码不能为空'
            } else if (formData.password.length < 6) {
                errors.password = '密码至少需要6个字符'
            } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(formData.password)) {
                errors.password = '密码必须包含字母和数字'
            } else {
                errors.password = ''
            }
        }
        
        /**
         * 验证地址
         */
        const validateAddress = () => {
            if (formData.address && formData.address.length > 255) {
                errors.address = '地址不能超过255个字符'
            } else {
                errors.address = ''
            }
        }
        
        /**
         * 验证电话
         */
        const validatePhone = () => {
            if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
                errors.phone = '请输入有效的手机号码'
            } else if (formData.phone && formData.phone.length > 20) {
                errors.phone = '电话不能超过20个字符'
            } else {
                errors.phone = ''
            }
        }
        
        /**
         * 验证确认密码
         */
        const validateConfirmPassword = () => {
            if (!formData.confirmPassword) {
                errors.confirmPassword = '请确认密码'
            } else if (formData.confirmPassword !== formData.password) {
                errors.confirmPassword = '两次输入的密码不一致'
            } else {
                errors.confirmPassword = ''
            }
        }
        
        /**
         * 处理注册提交
         */
        const handleRegister = async () => {
            // 清除之前的错误信息
            registerError.value = ''
            
            // 验证表单
            validateUsername()
            validateEmail()
            validateAddress()
            validatePhone()
            validatePassword()
            validateConfirmPassword()
            
            // 如果有验证错误，不提交
            if (errors.username || errors.email || errors.address || errors.phone || errors.password || errors.confirmPassword) {
                return
            }
            
            try {
                isSubmitting.value = true
                
                // 调用后端API进行注册
                const response = await fetch('http://localhost:3000/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        email: formData.email,
                        address: formData.address,
                        phone: formData.phone,
                        password: formData.password
                    })
                })
                
                const data = await response.json()
                
                if (response.ok) {
                    // 注册成功后跳转到登录页面
                    router.push('/login')
                } else {
                    // 显示后端返回的错误信息
                    registerError.value = data.message || '注册失败，请稍后再试'
                }
                
            } catch (error) {
                console.error('注册请求失败:', error)
                registerError.value = '网络错误，请检查您的连接或稍后再试'
            } finally {
                isSubmitting.value = false
            }
        }
        
        return {
            formData,
            errors,
            registerError,
            isSubmitting,
            validateUsername,
            validateEmail,
            validatePassword,
            validateConfirmPassword,
            handleRegister
        }
    }
}
</script>

<style scoped>
.register-container {
    height: 1000px; 
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: #f5f5f5;
}

.register-card {
     width: 100%;
    max-width: 500px; /* 增加最大宽度 */
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 40px;
}

.register-title {
    text-align: center;
    margin-bottom: 25px;
    color: #333;
    font-size: 24px;
    font-weight: 600;
}

.register-form {
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
    border-color: #b887b0;
}

.error-message {
    color: #ff4d4f;
    font-size: 14px;
    margin-top: 5px;
}

.register-button {
    width: 100%;
    padding: 12px;
    background-color: #b887b0;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
}

.register-button:hover:not(:disabled) {
    background-color: #a5709d;
}

.register-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.register-error {
    color: #ff4d4f;
    text-align: center;
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 4px;
    background-color: #fff2f0;
}

.login-link {
    text-align: center;
    margin-top: 20px;
    color: #666;
}

.login-button {
    color: #b887b0;
    text-decoration: none;
    font-weight: 500;
}

.login-button:hover {
    text-decoration: underline;
}
</style>