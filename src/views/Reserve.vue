<template>
    <div class="reserve-container">
        <Navbar />
        <div class="reserve-content">
            <div class="reserve-table">
                <h2>宠物寄养预约</h2>
                <form @submit.prevent="submitForm">
                    <div class="form-group">
                        <label for="pet-name">宠物名称</label>
                        <input type="text" id="pet-name" v-model="formData.petName" placeholder="请输入宠物名称" required>
                    </div>
                    <div class="form-group">
                        <label for="pet-type">宠物类型</label>
                        <select id="pet-type" v-model="formData.petType" required>
                            <option value="">请选择</option>
                            <option value="dog">狗</option>
                            <option value="cat">猫</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>预约日期时间</label>
                        <div class="date-time-group">
                            <div>
                                <span>开始日期</span>
                                <input type="date" id="reserve-start-date" v-model="formData.reserveStartDate" :min="today" required>
                            </div>
                            <div>
                                <span>开始时间</span>
                                <input type="time" id="reserve-start-time" v-model="formData.reserveStartTime" :min="minStartTime" required>
                            </div>
                        </div>
                        <div class="date-time-group">
                            <div>
                                <span>结束日期</span>
                                <input type="date" id="reserve-end-date" v-model="formData.reserveEndDate" :min="minEndDate" required>
                            </div>
                            <div>
                                <span>结束时间</span>
                                <input type="time" id="reserve-end-time" v-model="formData.reserveEndTime" :min="minEndTime" required>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <button type="submit">提交预约</button>
                    </div>
                </form>
            </div>
        </div>
        <Footer />
    </div>
</template>
<script>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import {useRouter} from 'vue-router'
import {reactive, computed} from 'vue'

export default {
    name: 'Reserve',
    components: {
        Navbar,
        Footer
    },
    setup() {
        // 初始化路由
        const router = useRouter()
        
        // 获取今天的日期和时间，格式为YYYY-MM-DD和HH:MM
        const today = computed(() => {
            const date = new Date();
            return date.toISOString().split('T')[0];
        });
        
        // 获取当前时间，格式为HH:MM
        const currentTime = computed(() => {
            const date = new Date();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        });
        
        // 表单数据
        const formData = reactive({
            petName: '',
            petType: '',
            reserveStartDate: '',
            reserveStartTime: '10:00', // 默认开始时间
            reserveEndDate: '',
            reserveEndTime: '18:00'   // 默认结束时间
        });
        
        // 计算属性：结束日期的最小可选值
        const minEndDate = computed(() => {
            return formData.reserveStartDate || today.value;
        });
        
        // 计算属性：开始时间的最小可选值
        const minStartTime = computed(() => {
            // 如果选择的是今天，那么开始时间不能早于当前时间
            if (formData.reserveStartDate === today.value) {
                return currentTime.value;
            }
            // 否则没有限制
            return '00:00';
        });
        
        // 计算属性：结束时间的最小可选值
        const minEndTime = computed(() => {
            // 如果结束日期和开始日期相同
            if (formData.reserveEndDate === formData.reserveStartDate) {
                return formData.reserveStartTime;
            }
            // 如果结束日期是今天
            else if (formData.reserveEndDate === today.value) {
                return currentTime.value;
            }
            // 否则没有限制
            return '00:00';
        });
        
        // 提交表单处理函数
        const submitForm = async () => {
            if (!formData.petName || !formData.petType || !formData.reserveStartDate || !formData.reserveEndDate) {
                alert('请填写完整预约信息')
                return
            }
            
            // 日期验证：结束日期不能早于开始日期
            if (new Date(formData.reserveEndDate) < new Date(formData.reserveStartDate)) {
                alert('结束日期不能早于开始日期')
                return
            }
            
            // 合并日期和时间
            const startDateTime = `${formData.reserveStartDate}T${formData.reserveStartTime}:00`;
            const endDateTime = `${formData.reserveEndDate}T${formData.reserveEndTime}:00`;
            
            // 验证结束时间不早于开始时间
            if (new Date(endDateTime) < new Date(startDateTime)) {
                alert('结束时间不能早于开始时间');
                return;
            }
            
            // 验证：预约开始时间不能早于当前时间
            const currentDateTime = new Date();
            if (new Date(startDateTime) < currentDateTime) {
                alert('预约开始时间不能早于当前时间')
                return
            }
            
            try {
                // 从sessionStorage中获取用户信息
                const storedUser = sessionStorage.getItem('userInfo');
                
                console.log('获取用户信息:', storedUser);
                
                // 解析用户信息并获取用户ID
                const userInfo = JSON.parse(storedUser);
                console.log('完整的用户信息:', userInfo);
                
                // 确保userId是数字类型
                const userId = parseInt(userInfo.id);
                console.log('解析后的用户ID:', userId, '类型:', typeof userId);
                
                // 验证用户ID是否为有效数字
                if (isNaN(userId) || userId <= 0) {
                    console.error('无效的用户ID:', userInfo.id);
                    alert('用户信息异常，请重新登录');
                    router.push('/login');
                    return;
                }
                
                console.log('提交的表单数据:', formData);
                
                // 结束时间已经在前面验证过了，这里不需要重复验证
                
                // 向后端API发送预约数据
                const response = await fetch('http://localhost:3000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: userId,
                        petName: formData.petName,
                        petType: formData.petType,
                        startDate: startDateTime,
                        endDate: endDateTime
                    })
                });
                
                console.log('API响应状态:', response.status);
                
                if (!response.ok) {
                    // 尝试获取详细的错误信息
                    try {
                        const errorData = await response.json();
                        throw new Error(errorData.message || '预约失败，请稍后再试');
                    } catch (jsonError) {
                        throw new Error(`预约失败，HTTP状态码: ${response.status}`);
                    }
                }
                
                const data = await response.json();
                console.log('API响应数据:', data);
                
                // 提交成功后，跳转到成功页面，并传递预约详情和订单ID
                router.push({
                    name: 'ReserveSuccess', 
                    query: {
                        ...formData,
                        orderId: data.orderId
                    }
                });
            } catch (error) {
                console.error('预约失败:', error);
                alert(error.message || '提交预约时发生错误，请稍后再试');
            }
        }
        
        return {
            formData,
            submitForm,
            today,
            minEndDate
        }
    }

}
</script>
<style scoped>
.reserve-container {
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.reserve-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background-color: #f8f9fa;
}

.reserve-table {
    background-color: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
}

.reserve-table h2 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
    font-size: 1.8rem;
}

.form-group {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap:5px;
}

            .date-time-group {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
}

            .date-time-group > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #555;
    font-weight: 500;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: pink;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.form-group button {
    width: 100%;
    padding: 0.8rem;
    background-color: rgb(255, 126, 147);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.form-group button:hover {
    background-color: pink;
}
</style>
