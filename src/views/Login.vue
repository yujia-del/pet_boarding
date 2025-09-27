<template>
    <Navbar />
    <div class="login-container">
        <div class="login-card">
            <h2 class="login-title">用户登录</h2>
            
            <!-- 登录表单 -->
            <form class="login-form" @submit.prevent="handleLogin">
                <!-- 用户名/邮箱输入框 -->
                <div class="form-group">
                    <label for="username" class="form-label">用户名/邮箱</label>
                    <input
                        id="username"
                        type="text"
                        v-model="formData.username"
                        class="form-input"
                        placeholder="请输入用户名或邮箱"
                        required
                        @blur="validateUsername"
                    >
                    <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
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
                
                <!-- 记住我和忘记密码 -->
                <div class="login-options">
                    <label class="remember-me">
                        <input type="checkbox" v-model="formData.rememberMe">
                        记住我
                    </label>
                    <a href="#" class="forgot-password">忘记密码?</a>
                </div>
                
                <!-- 登录按钮 -->
                <button type="submit" class="login-button" :disabled="isSubmitting">
                    {{ isSubmitting ? '登录中...' : '登录' }}
                </button>
                
                <!-- 错误提示 -->
                <div v-if="loginError" class="login-error">{{ loginError }}</div>
                
                <!-- 注册链接 -->
                <div class="register-link">
                    还没有账户? <a href="/register" class="register-button">前往注册</a>
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
    name: 'Login',
    components: {
        Navbar,
        Footer
    },
    setup() {
        const router = useRouter()
        
        // 表单数据
        const formData = reactive({
            username: '',
            password: '',
            rememberMe: false
        })
        
        // 错误信息
        const errors = reactive({
            username: '',
            password: ''
        })
        
        // 登录错误信息
        const loginError = ref('')
        
        // 提交状态
        const isSubmitting = ref(false)
        
        /**
         * 验证用户名
         */
        const validateUsername = () => {
            if (!formData.username.trim()) {
                errors.username = '用户名或邮箱不能为空'
            } else if (!/\S+@\S+\.\S+/.test(formData.username) && formData.username.length < 4) {
                errors.username = '用户名至少需要4个字符'
            } else {
                errors.username = ''
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
            } else {
                errors.password = ''
            }
        }
        
        /**
         * 处理登录提交
         */
        const handleLogin = async () => {
            // 清除之前的错误信息
            loginError.value = ''
            
            // 验证表单
            validateUsername()
            validatePassword()
            
            // 如果有验证错误，不提交
            if (errors.username || errors.password) {
                return
            }
            
            try {
                isSubmitting.value = true
                
                // 调用后端API进行登录验证
                const response = await fetch('http://localhost:3000/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password
                    })
                })
                
                const data = await response.json()
                
                if (response.ok) {
                    // 登录成功后，获取完整的用户信息（包括地址和电话）
                    const userDetailResponse = await fetch(`http://localhost:3000/api/users/${data.user.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    
                    if (userDetailResponse.ok) {
                        const userDetail = await userDetailResponse.json()
                        // 保存完整的用户信息到localStorage
                        localStorage.setItem('userInfo', JSON.stringify(userDetail))
                    } else {
                        // 如果获取详情失败，使用登录返回的基本信息
                        localStorage.setItem('userInfo', JSON.stringify(data.user))
                    }
                    
                    // 跳转到首页
                    router.push('/')
                } else {
                    // 显示后端返回的错误信息
                    loginError.value = data.message || '登录失败，请检查用户名和密码是否正确'
                }
                
            } catch (error) {
                console.error('登录请求失败:', error)
                loginError.value = '网络错误，请检查您的连接或稍后再试'
            } finally {
                isSubmitting.value = false
            }
        }
        
        return {
            formData,
            errors,
            loginError,
            isSubmitting,
            validateUsername,
            validatePassword,
            handleLogin
        }
    }
}
</script>

<style scoped>
.login-container {
    min-height: calc(100vh - 120px); /* 减去导航栏和页脚的高度 */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: #f5f5f5;
}

.login-card {
    width: 100%;
    max-width: 500px; /* 增加最大宽度 */
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 40px;
}

.login-title {
    text-align: center;
    margin-bottom: 25px;
    color: #333;
    font-size: 24px;
    font-weight: 600;
}

.login-form {
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
    padding: 15px; /* 增加内边距 */
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 18px; /* 增加字体大小 */
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

.login-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.remember-me {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #666;
}

.remember-me input[type="checkbox"] {
    margin-right: 6px;
}

.forgot-password {
    color: #b887b0;
    text-decoration: none;
    font-size: 14px;
}

.forgot-password:hover {
    text-decoration: underline;
}

.login-button {
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

.login-button:hover:not(:disabled) {
    background-color: #a5709d;
}

.login-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.login-error {
    color: #ff4d4f;
    text-align: center;
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 4px;
    background-color: #fff2f0;
}

.register-link {
    text-align: center;
    margin-top: 20px;
    color: #666;
}

.register-button {
    color: #b887b0;
    text-decoration: none;
    font-weight: 500;
}

.register-button:hover {
    text-decoration: underline;
}
</style>