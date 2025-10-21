<template>
    <div class="reserve-container">
        <Navbar />
        <div class="reserve-content">
            <div class="reserve-table">
                <h2>宠物寄养预约</h2>
                <form @submit.prevent="submitForm">
                    <div class="form-group">
                        <label for="select-pet">选择宠物 <span style="color: red;">*</span></label>
                        <select id="select-pet" v-model="selectedPet" @change="onDateChange" required>
                            <option value="">请选择您的宠物</option>
                            <option v-for="pet in userPets" :key="pet.pet_id" :value="pet">
                                {{ pet.pet_name }} ({{ pet.type }})
                            </option>
                        </select>
                        <div v-if="userPets.length === 0" style="color: #999; font-size: 12px; margin-top: 5px;">
                            您还没有添加宠物信息，请先添加宠物
                        </div>
                    </div>
                    <div class="form-group">
                        <label>预约日期时间</label>
                        <div class="date-time-group">
                            <div>
                                <span>开始日期</span>
                                <select v-model="formData.reserveStartDate" @change="onDateChange" required>
                                    <option value="">请选择日期</option>
                                    <option v-for="date in availableDates" :key="date.value" :value="date.value">
                                        {{ date.label }}
                                    </option>
                                </select>
                                <div v-if="formData.reserveStartDate && formData.reserveEndDate && formData.reserveEndDate < formData.reserveStartDate" class="error-message">
                                    结束日期不能早于开始日期
                                </div>
                            </div>
                            <div>
                                <span>开始时间</span>
                                <select v-model="formData.reserveStartTime" @change="onDateChange" required>
                                    <option value="">请选择时间</option>
                                    <option v-for="time in availableTimeSlots" :key="time" :value="time">
                                        {{ formatTimeDisplay(time) }}
                                    </option>
                                    <option v-if="availableTimeSlots.length === 0" disabled>
                                        当前日期无可预约时间
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="date-time-group">
                            <div>
                                <span>结束日期</span>
                                <select v-model="formData.reserveEndDate" @change="onDateChange" required>
                                    <option value="">请选择日期</option>
                                    <option v-for="date in availableDates" :key="date.value" :value="date.value">
                                        {{ date.label }}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <span>结束时间</span>
                                <select v-model="formData.reserveEndTime" @change="onDateChange" required>
                                    <option value="">请选择时间</option>
                                    <option v-for="time in availableEndTimeSlots" :key="time" :value="time">
                                        {{ formatTimeDisplay(time) }}
                                    </option>
                                    <option v-if="availableEndTimeSlots.length === 0" disabled>
                                        当前日期无可预约时间
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div v-if="timeSlotInfo" class="time-slot-info">
                            <div class="date-range-info">
                                剩余名额: <span >{{ timeSlotInfo.available }}</span>/{{ timeSlotInfo.total }}
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="special-requests">特殊要求（选填）</label>
                        <textarea id="special-requests" v-model="formData.specialRequests" placeholder="如有特殊照顾需求，请在此说明" rows="3" maxlength="500"></textarea>
                        <div class="char-count">{{ formData.specialRequests.length }}/500 字符</div>
                    </div>
                    <div class="form-group">
                        <button type="submit" :disabled="!canSubmit">提交预约</button>
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
import {reactive, computed, ref, watch, onMounted} from 'vue'

export default {
    name: 'Reserve',
    components: {
        Navbar,
        Footer
    },
    setup() {
        // 初始化路由
        const router = useRouter()
        
        // 获取今天的日期，格式为YYYY-MM-DD
        const today = computed(() => {
            const date = new Date();
            return date.toISOString().split('T')[0];
        });
        
        /**
         * 格式化日期为YYYY-MM-DD格式
         * @param {Date} date - 日期对象
         * @returns {string} - 格式化后的日期字符串
         */
        function formatDate(date) {
            return date.toISOString().split('T')[0];
        };
        
        // 表单数据
        const formData = reactive({
            reserveStartDate: '',
            reserveStartTime: '',
            reserveEndDate: '',
            reserveEndTime: '',
            specialRequests: '' // 特殊要求，对应数据库中的special_requests字段
        });
        
        // 选中的宠物信息
        const selectedPet = ref(null);
        
        // 用户的宠物列表
        const userPets = ref([]);
        
        // 加载用户宠物信息
        const loadUserPets = async () => {
            try {
                const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
                if (!userInfo) {
                    alert('请先登录');
                    router.push('/login');
                    return;
                }
                
                const response = await fetch('http://localhost:3000/api/pets?userId=' + userInfo.user_id);
                const result = await response.json();
                
                if (response.ok) {
                    userPets.value = result || [];
                } else {
                    alert(result.message || '获取宠物信息失败');
                }
            } catch (error) {
                console.error('获取宠物信息失败:', error);
                alert('获取宠物信息失败');
            }
        };
        
        // 时间段信息
        const timeSlotInfo = ref(null);
        
        // 监听开始日期变化
        watch(
            () => formData.reserveStartDate,
            (newStartDate, oldStartDate) => {
                // 清除之前选择的时间
                formData.reserveStartTime = '';
                formData.reserveEndTime = '';
                
                // 确保结束日期不早于开始日期
                if (newStartDate && formData.reserveEndDate && formData.reserveEndDate < newStartDate) {
                    formData.reserveEndDate = newStartDate;
                    // 当结束日期被自动调整时，触发结束日期变化的逻辑
                    onDateChange();
                }
                
                // 当日期改变时，检查是否有可用时间段
                if (newStartDate && availableTimeSlots.value.length === 0) {
                    // 如果当前日期没有可用时间段，可以选择下一个可用日期
                    const nextAvailableDate = availableDates.value.find(date => date.value > newStartDate);
                    if (nextAvailableDate) {
                        formData.reserveStartDate = nextAvailableDate.value;
                    }
                }
            }
        );
        
        // 监听结束日期变化
        watch(
            () => formData.reserveEndDate,
            (newEndDate, oldEndDate) => {
                // 清除之前选择的结束时间
                formData.reserveEndTime = '';
                
                // 如果开始日期和结束日期相同，则检查开始时间是否需要调整
                if (newEndDate === formData.reserveStartDate && formData.reserveStartTime) {
                    // 如果开始时间已选择，但在当前日期下不再有效，则清除开始时间
                    if (!availableTimeSlots.value.includes(formData.reserveStartTime)) {
                        formData.reserveStartTime = '';
                    }
                }
                
                // 触发日期变化事件处理
                if (newEndDate !== oldEndDate) {
                    onDateChange();
                }
            }
        );
        
        // 监听开始时间变化，确保结束时间的有效性并检查时间段名额
        watch(
            () => formData.reserveStartTime,
            async (newTime, oldTime) => {
                // 如果开始时间已选择，且结束日期与开始日期相同，且结束时间早于或等于开始时间，则清除结束时间
                if (formData.reserveStartDate === formData.reserveEndDate && 
                    newTime && 
                    formData.reserveEndTime && 
                    formData.reserveEndTime <= newTime) {
                    formData.reserveEndTime = '';
                }
                
                // 如果开始时间发生变化且有选择日期，检查该时间段的名额
                if (newTime && formData.reserveStartDate) {
                    await checkTimeSlotQuota(newTime);
                }
            }
        );
        
        /**
         * 预加载未来几天的日期可用性信息
         */
        async function preloadDateAvailability() {
            // 获取当前计算的可用日期列表
            const dates = [];
            const todayDate = new Date();
            
            // 计算未来10天的日期
            for (let i = 0; i < 10; i++) {
                const date = new Date(todayDate);
                date.setDate(todayDate.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                
                // 只预加载有效的日期
                if (isValidReservationDate(dateStr)) {
                    dates.push(dateStr);
                }
            }
            
            // 并发请求预加载日期可用性
            const promises = dates.map(async (date) => {
                try {
                    // 确保日期格式正确
                    const formattedDate = date.replace(/[^0-9-]/g, '');
                    
                    // 构建API URL
                    const apiUrl = `http://localhost:3000/api/orders/check-availability/${formattedDate}`;
                    
                    // 调用后端API检查日期的可用名额
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // 更新日期可用性缓存
                        dateAvailabilityCache.value[date] = data.hasAvailability;
                    }
                } catch (error) {
                    console.warn(`预加载日期 ${date} 可用性失败:`, error);
                    // 出错时默认认为日期可用
                    dateAvailabilityCache.value[date] = true;
                }
            });
            
            // 等待所有预加载请求完成
            await Promise.allSettled(promises);
        }
        
        // 组件挂载时，如果没有默认选中的日期且有可用日期，则选择第一个可用日期
        onMounted(async () => {
            // 预加载未来几天的日期可用性信息
            await preloadDateAvailability();
            
            if (!formData.reserveStartDate && availableDates.value.length > 0) {
                formData.reserveStartDate = availableDates.value[0].value;
                formData.reserveEndDate = availableDates.value[0].value;
            }
            // 加载用户宠物信息
            loadUserPets();
        });
        const canSubmit = computed(() => {
            // 检查所有必填字段
            if (!selectedPet.value || !formData.reserveStartDate || 
                !formData.reserveStartTime || !formData.reserveEndDate || !formData.reserveEndTime) {
                return false;
            }
            
            // 检查日期是否有效
            const startDate = new Date(formData.reserveStartDate);
            const endDate = new Date(formData.reserveEndDate);
            if (endDate < startDate) {
                return false;
            }
            
            // 检查时间是否有效
            if (formData.reserveStartDate === formData.reserveEndDate) {
                const startTime = formData.reserveStartTime;
                const endTime = formData.reserveEndTime;
                if (endTime <= startTime) {
                    return false;
                }
            }
            
            // 检查时间段是否还有名额
            if (timeSlotInfo.value && timeSlotInfo.value.available <= 0) {
                return false;
            }
            
            return true;
        });
        
        /**
         * 检查特定日期是否有可用的预约时间点
         * @param {string} date - 日期字符串，格式为YYYY-MM-DD
         * @returns {boolean} - 表示该日期是否有可用时间点
         */
        function hasAvailableTimeSlots(date) {
            // 检查日期是否有效
            if (!isValidReservationDate(date)) {
                return false;
            }
            
            // 检查缓存中的日期可用性
            if (dateAvailabilityCache.value[date] === false) {
                return false;
            }
            
            return true;
        }
        
        /**
         * 验证日期是否可以进行预约
         * @param {string} date - 日期字符串，格式为YYYY-MM-DD
         * @returns {boolean} - 表示日期是否有效可预约
         */
        function isValidReservationDate(date) {
            // 解析日期
            const targetDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 排除过去的日期
            if (targetDate < today) {
                return false;
            }
            
            // 如果是今天，要考虑当前时间是否已经过了预约时间
            if (date === formatDate(new Date())) {
                const now = new Date();
                const currentHour = now.getHours();
                // 如果当前时间已经过了17:00，则今天不再接受预约
                if (currentHour >= 17) {
                    return false;
                }
            }
            
            return true;
        }
        
        // 缓存日期可用性结果，避免重复计算
        const dateAvailabilityCache = ref({});

        // 可用的日期列表（从今天开始的10天，基于日期有效性和名额可用性）
        const availableDates = computed(() => {
            const dates = [];
            const todayDate = new Date();
            
            for (let i = 0; i < 10; i++) {
                const date = new Date(todayDate);
                date.setDate(todayDate.getDate() + i);
                
                const dateStr = date.toISOString().split('T')[0];
                const dateLabel = formatDateLabel(date);
                
                // 验证日期是否有效可预约
                if (isValidReservationDate(dateStr)) {
                    // 检查日期是否有可用名额（如果缓存中有记录）
                    // 如果缓存中没有记录，默认认为日期可用（避免因预加载不及时导致日期不显示）
                    const isDateAvailable = dateAvailabilityCache.value[dateStr] !== false;
                    
                    if (isDateAvailable) {
                        // 添加日期到列表中
                        dates.push({
                            value: dateStr,
                            label: dateLabel
                        });
                    }
                }
            }
            
            return dates;
        });
        
        // 获取当前时间，格式为HH:MM
        const currentTime = computed(() => {
            const date = new Date();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        });
        
        /**
         * 计算开始时间可用的时间段（9:00-17:00，每小时一个时间段）
         */
        const availableTimeSlots = computed(() => {
            // 如果没有选择日期，返回空数组
            if (!formData.reserveStartDate) {
                return [];
            }
            
            const allTimeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
            
            // 如果选择的是今天，则过滤掉已过去的时间
            if (formData.reserveStartDate === today.value) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                
                return allTimeSlots.filter(time => {
                    const [hour, minute] = time.split(':').map(Number);
                    // 如果当前小时小于时间点的小时，或者小时相同但分钟小于30，则该时间点可用
                    return hour > currentHour || (hour === currentHour && currentMinute < 30);
                });
            }
            
            // 如果选择的是未来的日期，显示所有时间段
            return allTimeSlots;
        });
        
        /**
         * 计算结束时间可用的时间段（9:00-17:00，每小时一个时间段）
         * 基于结束日期和开始时间过滤可用时间
         */
        const availableEndTimeSlots = computed(() => {
            // 如果没有选择日期，返回空数组
            if (!formData.reserveEndDate) {
                return [];
            }
            
            const allTimeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
            
            // 如果选择的是今天，则过滤掉已过去的时间
            if (formData.reserveEndDate === today.value) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                
                return allTimeSlots.filter(time => {
                    const [hour, minute] = time.split(':').map(Number);
                    // 如果当前小时小于时间点的小时，或者小时相同但分钟小于30，则该时间点可用
                    return hour > currentHour || (hour === currentHour && currentMinute < 30);
                });
            }
            
            // 如果开始日期和结束日期相同，则结束时间必须晚于开始时间
            if (formData.reserveStartDate === formData.reserveEndDate && formData.reserveStartTime) {
                return allTimeSlots.filter(time => time > formData.reserveStartTime);
            }
            
            // 如果选择的是未来的日期，显示所有时间段
            return allTimeSlots;
        });
        
        /**
         * 格式化日期显示标签
         */
        function formatDateLabel(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
            
            return `${year}-${month}-${day} (周${weekDay})`;
        }
        
        /**
         * 格式化时间显示
         */
        function formatTimeDisplay(time) {
            const [hours, minutes] = time.split(':');
            const hourNum = parseInt(hours);
            
            if (hourNum >= 12) {
                return hourNum === 12 ? `${hours}:${minutes} 中午` : `${hourNum - 12}:${minutes} 下午`;
            } else {
                return `${hours}:${minutes} 上午`;
            }
        }
        
        /**
         * 生成时间段列表，包含每个时间段的预约人数信息
         * @returns {Array} 包含时间段和预约人数的对象数组
         */
        const timeSlotsList = computed(() => {
            // 如果没有时间段预约信息，返回空数组
            if (!timeSlotInfo.value || !timeSlotInfo.value.bookedByTimeSlot) {
                return [];
            }
            
            // 获取所有可能的时间段（与availableTimeSlots保持一致）
            const allTimeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
            
            // 构建时间段列表，包含每个时间段的预约人数
            return allTimeSlots.map(time => ({
                time: time,
                booked: timeSlotInfo.value.bookedByTimeSlot[time] || 0
            }));
        });
        
        /**
         * 日期改变时的处理函数
         */
        async function onDateChange() {
            // 如果选择了日期范围，检查日期范围内的最低剩余名额
            if (formData.reserveStartDate && formData.reserveEndDate) {
                await checkDateRangeQuota();
            }
        }
        
        /**
         * 检查日期范围内的最低剩余名额
         */
        async function checkDateRangeQuota() {
            try {
                const { reserveStartDate, reserveEndDate } = formData;
                
                // 确保日期格式正确
                const formattedStartDate = reserveStartDate.replace(/[^0-9-]/g, '');
                const formattedEndDate = reserveEndDate.replace(/[^0-9-]/g, '');
                
                // 构建API URL，包含开始日期和结束日期
                let apiUrl = `http://localhost:3000/api/orders/check-availability/${formattedStartDate}`;
                if (formattedEndDate && formattedStartDate !== formattedEndDate) {
                    apiUrl += `?endDate=${formattedEndDate}`;
                }
                
                // 调用后端API检查日期范围的可用名额
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('检查可用名额失败');
                }
                
                const data = await response.json();
                
                // 更新时间段信息，显示日期范围内最低的剩余名额
                // 修复：使用正确的字段名minAvailable替代available
                const bookedCount = data.maxPets - data.minAvailable;
                
                timeSlotInfo.value = {
                    total: data.maxPets,
                    available: data.minAvailable !== undefined ? data.minAvailable : 0,
                    booked: bookedCount,
                    description: data.description || '',
                    bookedByTimeSlot: data.bookedByTimeSlot || {},
                    dailyAvailability: data.dailyAvailability  // 保存详细的每日可用信息
                };
                
                console.log('日期范围名额信息:', data);
            } catch (error) {
                console.error('检查日期范围名额失败:', error);
                // 错误时默认显示一些名额，避免界面卡住
                timeSlotInfo.value = {
                    total: 5,
                    available: 0,
                    booked: 5,
                    description: '系统暂时无法查询名额信息，请稍后再试'
                };
            }
        }
        
        /**
         * 检查时间段名额
         * @param {string} [timeSlot] - 可选，指定要检查的具体时间段，格式为HH:MM
         */
        async function checkTimeSlotQuota(timeSlot = null) {
            try {
                if (!formData.reserveStartDate) {
                    timeSlotInfo.value = null;
                    return;
                }
                
                // 使用传入的timeSlot或表单中选择的timeSlot
                const selectedTimeSlot = timeSlot || formData.reserveStartTime;
                console.log(`检查时间段名额: ${formData.reserveStartDate} ${selectedTimeSlot || '全天'}`);
                
                // 确保日期格式正确
                const formattedDate = formData.reserveStartDate.replace(/[^0-9-]/g, '');
                console.log(`格式化后的日期: ${formattedDate}`);
                
                // 构建API URL，根据是否有指定时间段添加查询参数
                let apiUrl = `http://localhost:3000/api/orders/check-availability/${formattedDate}`;
                if (selectedTimeSlot) {
                    apiUrl += `?timeSlot=${encodeURIComponent(selectedTimeSlot)}`;
                }
                console.log(`请求API URL: ${apiUrl}`);
                
                // 调用后端API检查日期或时间段的可用名额
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`API响应状态码: ${response.status}`);
                
                // 检查响应是否为JSON格式
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const errorText = await response.text();
                    console.error('API返回非JSON响应:', errorText);
                    throw new Error('服务器返回了无效的响应格式');
                }
                
                if (!response.ok) {
                    try {
                        const errorData = await response.json();
                        throw new Error(errorData.message || '检查名额失败');
                    } catch (jsonError) {
                        throw new Error(`检查名额失败，HTTP状态码: ${response.status}`);
                    }
                }
                
                const data = await response.json();
                console.log('时间段名额信息:', data);
                
                // 更新日期可用性缓存
                dateAvailabilityCache.value[formData.reserveStartDate] = data.hasAvailability;
                
                // 设置时间段信息，包含按时间段统计的预约情况
                // 修复：统一使用正确的字段名映射
                const currentDateAvailability = data.dailyAvailability ? data.dailyAvailability[formData.reserveStartDate] : null;
                // 优先使用minAvailable字段，这是后端返回的标准字段名
                const availableCount = data.minAvailable !== undefined ? data.minAvailable : 0;
                // 计算已预约数量：总名额减去可用名额
                const bookedCount = data.maxPets - availableCount;
                
                timeSlotInfo.value = {
                    date: formData.reserveStartDate,
                    time: selectedTimeSlot || '全天',
                    total: data.maxPets,
                    booked: bookedCount,
                    available: availableCount,
                    timeSlot: data.timeSlot,  // 存储当前查询的具体时间段
                    bookedByTimeSlot: data.bookedByTimeSlot || {},  // 存储各时间段的预约人数统计
                    description: data.description || '',  // 存储日期描述信息
                    dailyAvailability: data.dailyAvailability  // 保存详细的每日可用信息
                };
            } catch (error) {
                console.error('检查时间段名额失败:', error);
                timeSlotInfo.value = null;
                // 在错误情况下，可以显示一个默认的名额信息
                // 但最好提醒用户系统无法获取准确的名额信息
            }
        }
        
        // 提交表单处理函数
        const submitForm = async () => {
            // 优先检查是否是因为名额问题导致无法提交
            if (timeSlotInfo.value && timeSlotInfo.value.available <= 0) {
                alert('当前时段不可预约')
                return
            }
            
            if (!canSubmit.value) {
                // 提供更具体的错误信息
                if (!selectedPet.value) {
                    alert('请选择您的宠物');
                    return;
                }
                if (!formData.reserveStartDate || !formData.reserveEndDate) {
                    alert('请选择完整的预约日期');
                    return;
                }
                if (formData.reserveEndDate < formData.reserveStartDate) {
                    alert('结束日期不能早于开始日期');
                    return;
                }
                if (!formData.reserveStartTime || !formData.reserveEndTime) {
                    alert('请选择完整的预约时间');
                    return;
                }
                if (formData.reserveStartDate === formData.reserveEndDate && formData.reserveEndTime <= formData.reserveStartTime) {
                    alert('结束时间不能早于或等于开始时间');
                    return;
                }
                alert('请检查预约信息是否完整');
                return
            }
            
            // 检查是否已选择宠物
            if (!selectedPet.value || !selectedPet.value.pet_id) {
                alert('请选择宠物')
                return
            }
            
            // 合并日期和时间
            const startDateTime = `${formData.reserveStartDate}T${formData.reserveStartTime}:00`;
            const endDateTime = `${formData.reserveEndDate}T${formData.reserveEndTime}:00`;
            
            // 验证：订单起始时间必须大于24小时（使用完整日期时间计算）
            const startDate = new Date(startDateTime);
            const endDate = new Date(endDateTime);
            
            // 日期时间逻辑验证：结束时间不能早于开始时间
            if (endDate < startDate) {
                alert('结束时间不能早于开始时间')
                return
            }
            
            // 额外验证：结束时间不能等于开始时间
            if (endDate.getTime() === startDate.getTime()) {
                alert('结束时间不能等于开始时间')
                return
            }
            
            const diffTime = Math.abs(endDate - startDate);
            const diffHours = diffTime / (1000 * 60 * 60);
            
            if (diffHours <= 24) {
                alert('订单时间必须大于24小时')
                return
            }
            
            // 验证：预约开始时间不能早于当前时间
            const currentDateTime = new Date();
            if (new Date(startDateTime) < currentDateTime) {
                alert('预约开始时间不能早于当前时间')
                return
            }
            
            // 提交前再次检查可用名额，防止并发预约导致的名额问题
            try {
                // 确保日期格式正确
                const formattedStartDate = formData.reserveStartDate.replace(/[^0-9-]/g, '');
                const formattedEndDate = formData.reserveEndDate.replace(/[^0-9-]/g, '');
                
                console.log(`检查日期范围 ${formattedStartDate} 至 ${formattedEndDate} 的可用名额`);
                
                // 构建API URL，包含开始日期和结束日期
                let apiUrl = `http://localhost:3000/api/orders/check-availability/${formattedStartDate}`;
                if (formattedStartDate !== formattedEndDate) {
                    apiUrl += `?endDate=${formattedEndDate}`;
                }
                
                console.log(`请求API URL: ${apiUrl}`);
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`API响应状态码: ${response.status}`);
                
                // 检查响应是否为JSON格式
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const errorText = await response.text();
                    console.error('API返回非JSON响应:', errorText);
                    alert('服务器返回了无效的响应格式，请稍后再试');
                    return;
                }
                
                if (!response.ok) {
                    try {
                        const errorData = await response.json();
                        alert(errorData.message || '检查名额失败，请稍后再试');
                    } catch (jsonError) {
                        alert(`检查名额失败，HTTP状态码: ${response.status}`);
                    }
                    return;
                }
                
                const data = await response.json();
                
                // 检查日期范围内的最低剩余名额
                if (data.available <= 0) {
                    alert(`很抱歉，您选择的日期范围内名额已满，请选择其他日期`);
                    return;
                }
            } catch (error) {
                console.error('提交前检查名额失败:', error);
                alert('系统忙，请稍后再试');
                return;
            }
            
            try {
                // 从sessionStorage中获取用户信息
                const storedUser = sessionStorage.getItem('userInfo');
                
                console.log('获取用户信息:', storedUser);
                
                // 检查用户信息是否存在
                if (!storedUser) {
                    console.error('用户信息不存在');
                    alert('用户未登录，请先登录');
                    router.push('/login');
                    return;
                }
                
                // 解析用户信息并获取用户ID
                let userInfo;
                try {
                    userInfo = JSON.parse(storedUser);
                    console.log('完整的用户信息:', userInfo);
                } catch (parseError) {
                    console.error('解析用户信息失败:', parseError);
                    alert('用户信息格式错误，请重新登录');
                    router.push('/login');
                    return;
                }
                
                // 安全地获取用户ID
                let userId;
                if (userInfo && userInfo.user_id) {
                    userId = parseInt(userInfo.user_id);
                    console.log('解析后的用户ID:', userId, '类型:', typeof userId);
                }
                
                // 验证用户ID是否为有效数字
                if (isNaN(userId) || userId <= 0) {
                    console.error('无效的用户ID:', userInfo?.user_id || '未定义');
                    alert('用户信息异常，请重新登录');
                    router.push('/login');
                    return;
                }
                
                console.log('提交的表单数据:', formData);
                
                // 构建API请求数据，包含选中宠物的ID
                const requestData = {
                    userId: userId,
                    petId: selectedPet.value.pet_id,  // 添加宠物ID
                    petName: selectedPet.value.pet_name,
                    petType: selectedPet.value.type,
                    petBreed: selectedPet.value.breed || '', // 添加宠物品种
                    startDate: startDateTime,
                    endDate: endDateTime,
                    specialRequests: formData.specialRequests || ''
                };
                
                console.log('发送给API的数据:', requestData);
                console.log('JSON字符串:', JSON.stringify(requestData));
                
                // 向后端API发送预约数据
                const response = await fetch('http://localhost:3000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                console.log('API响应状态:', response.status);
                
                // 检查响应头，了解更多错误信息
                console.log('API响应头:', Object.fromEntries(response.headers.entries()));
                
                if (!response.ok) {
                    // 尝试获取详细的错误信息
                    try {
                        const errorData = await response.json();
                        console.error('API错误数据:', errorData);
                        throw new Error(errorData.message || '预约失败，请稍后再试');
                    } catch (jsonError) {
                        console.error('解析错误响应失败:', jsonError);
                        throw new Error(`预约失败，HTTP状态码: ${response.status}`);
                    }
                }
                
                const data = await response.json();
                console.log('API响应数据:', data);
                
                // 预约成功后，更新时间段名额状态，表示该时间段已被预约完
                if (timeSlotInfo.value) {
                    timeSlotInfo.value.available = 0;
                    timeSlotInfo.value.booked = 1; // 1个名额已被预约
                }
                
                // 提交成功后，跳转到成功页面，并传递预约详情和订单ID
                router.push({
                    name: 'ReserveSuccess', 
                    query: {
                        petName: selectedPet.value.pet_name,
                        petType: selectedPet.value.type,
                        reserveStartDate: formData.reserveStartDate,
                        reserveStartTime: formData.reserveStartTime,
                        reserveEndDate: formData.reserveEndDate,
                        reserveEndTime: formData.reserveEndTime,
                        specialRequests: formData.specialRequests,
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
            selectedPet,
            userPets,
            submitForm,
            today,
            availableDates,
                availableTimeSlots,
                availableEndTimeSlots,
                timeSlotInfo,
                canSubmit,
            formatTimeDisplay,
            onDateChange,
            hasAvailableTimeSlots,
            dateAvailabilityCache,
            loadUserPets
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
}

            .error-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
}


.booked-count {
    color: #606266;
    font-size: 0.9em;
    margin-left: 5px;
}

.date-range-info {
    color: #606266;
    font-size: 0.95em;
    margin-bottom: 5px;
}

.no-quota-warning {
    color: #dc3545;
    font-size: 12px;
    margin-left: 5px;
}

.availability-description {
    color: #6c757d;
    font-size: 14px;
    margin-top: 8px;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-left: 3px solid #17a2b8;
    border-radius: 4px;
    line-height: 1.4;
}

/* 时间段统计样式 */
.time-slot-stats {
    margin-top: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.stats-title {
    font-weight: 500;
    color: #495057;
    margin-bottom: 10px;
    font-size: 14px;
}

.time-slot-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}

.time-slot-item {
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.time-slot-item:hover:not(.slot-full) {
    background-color: #f5f5f5;
    border-color: #999;
}

.time-slot-item.selected {
    background-color: #4CAF50;
    color: white;
    border-color: #4CAF50;
}

.slot-time {
    font-weight: bold;
    color: #495057;
    margin-bottom: 4px;
}

.slot-status {
    font-size: 0.9em;
    font-weight: 500;
    color: #28a745;
}

.slot-full {
    color: #f44336;
    background-color: #f44336;
    color: white;
    cursor: not-allowed;
}

/* 名额显示相关样式 */
.quota-count {
    font-weight: bold;
    font-size: 1.1em;
}

.quota-normal {
    color: #4CAF50;
}

.quota-low {
    color: #ff9800;
}

.quota-full {
    color: #f44336;
}

.no-quota-warning {
    color: #f44336;
    font-weight: bold;
}

.date-range-info {
    margin-bottom: 10px;
    color: #606266;
    font-size: 0.95em;
}

.availability-description {
    font-size: 0.9em;
    color: #666;
    margin-top: 5px;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-left: 3px solid #17a2b8;
    border-radius: 4px;
    line-height: 1.4;
}

/* 每日名额详情样式 */
.daily-quota-details {
    margin-top: 15px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
}

.daily-quota-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid #eee;
}

.daily-quota-item:last-child {
    border-bottom: none;
}

.quota-date {
    font-weight: 500;
}

.quota-status {
    display: flex;
    align-items: center;
}

.quota-tight {
    display: inline-block;
    margin-left: 5px;
    color: #ff9800;
    font-size: 0.8em;
    background-color: #fff3cd;
    padding: 2px 6px;
    border-radius: 3px;
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

/* 字符计数器样式 */
.char-count {
    font-size: 12px;
    color: #666;
    text-align: right;
    margin-top: 4px;
}

/* 特殊要求输入框样式 */
#special-requests {
    resize: vertical; /* 仅允许垂直调整大小 */
    min-height: 80px; /* 最小高度限制 */
    max-height: 200px; /* 最大高度限制 */
}
</style>
