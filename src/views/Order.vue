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
                            <span class="order-date">创建时间: {{ formatDateWithTime(order.createTime) }}</span>
                        </div>
                        <div class="order-status" :class="getOrderStatusClass(order.status)">
                            {{ getOrderStatusText(order.status) }}
                        </div>
                    </div>

                    <div class="order-details">
                        <div class="pet-info">
                            <div class="pet-details">
                                <span class="pet-name">宠物名称: {{ order.petName }}</span>
                                <span class="pet-type">宠物类型: {{ formatPetType(order.petType) }}</span>
                                <span class="pet-type">宠物品种: {{ order.petBreed || '未填写' }}</span>
                            </div>
                        </div>

                        <div class="reserve-info">
                            <!-- 特殊要求信息 -->
                            <div class="special-requests" v-if="order.specialRequests && order.specialRequests.trim()">
                                <div class="request-label">备注:</div>
                                <div class="request-content">{{ order.specialRequests }}</div>
                            </div>
                            <div class="date-info">
                                <span class="date-label">开始日期:</span>
                                <span class="date-value">{{ formatDateWithTime(order.reserveStartDate) }}</span>
                            </div>
                            <div class="date-info">
                                <span class="date-label">结束日期:</span>
                                <span class="date-value">{{ formatDateWithTime(order.reserveEndDate) }}</span>
                            </div>
                            <div class="days-info">
                                共 {{ calculateDays(order.reserveStartDate, order.reserveEndDate) }} 天
                            </div>
                            <div class="price-info">
                                <span class="price-label">总金额:</span>
                                <span class="price-value">¥{{ formatPrice(order.totalPrice) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="order-actions">
                        <button v-if="order.status === '待确认'" class="btn-confirm" @click="handleConfirmOrder(order.id)">
                            确定订单
                        </button>
                        <button v-if="order.status === '待确认'" class="btn-cancel" @click="handleCancelOrder(order.id)">
                            取消订单
                        </button>
                        <button v-if="order.status === '待确认'" class="btn-contact" @click="navigateToCustomerService">
                            联系客服
                        </button>
                        <button v-if="order.status === '已完成'" class="btn-contact" @click="navigateToCustomerService">
                            联系客服
                        </button>
                    </div>
                </div>
            </div>

            <!-- 无订单状态 -->
            <div class="no-orders" v-else>
                <p>暂无订单</p>
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { getCurrentUserId, handleApiError } from '../utils/api.js';
import { getOrdersByUserId, cancelOrder, confirmOrder } from '../utils/orderApi.js';
import { formatDate, formatDateWithTime, getOrderStatusText, getOrderStatusClass, formatPetType, calculateDays, formatPrice } from '../utils/formatters.js';

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

        /**
         * 加载订单数据
         */
        const loadOrders = async () => {
            loading.value = true;
            error.value = '';

            try {

                const currentUserId = getCurrentUserId();

                if (!currentUserId) {
                    error.value = '请先登录';
                    loading.value = false;
                    return;
                }

                console.log('加载订单数据，用户ID:', currentUserId);

                // 调用订单API获取数据
                const data = await getOrdersByUserId(currentUserId);

                // 检查返回数据是否为空
                if (!data) {
                    orders.value = [];
                    console.log('API返回空数据');
                    loading.value = false;
                    return;
                }

                // 检查是否有订单数据
                if (data.orders && data.orders.length > 0) {
                    orders.value = data.orders;
                    console.log('成功加载订单数据:', orders.value);
                } else {
                    // API返回但没有订单数据时，显示空状态但不报错
                    orders.value = [];
                    console.log('用户暂无订单');
                }
            } catch (apiError) {
                handleApiError(apiError, (message) => { error.value = message; });
                orders.value = [];
            } finally {
                loading.value = false;
            }
        };

        /**
         * 处理取消订单
         * @param {string} orderId - 订单ID (格式如ORD000001)
         */
        const handleCancelOrder = async (orderId) => {
            // 查找对应的订单对象
            const order = orders.value.find(o => o.id === orderId);
            if (!order) {
                alert('找不到该订单');
                return;
            }

            // 检查距离订单开始时间是否不足2小时
            const now = new Date();
            const orderStartTime = new Date(order.reserveStartDate);
            const timeDiff = orderStartTime - now;
            const twoHoursInMs = 2 * 60 * 60 * 1000; // 2小时的毫秒数

            // 如果距离订单开始时间不足2小时，显示提示框并阻止取消
            if (timeDiff > 0 && timeDiff < twoHoursInMs) {
                const hoursRemaining = Math.floor(timeDiff / (60 * 60 * 1000));
                const minutesRemaining = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
                alert(`距离订单开始时间不足2小时，无法取消订单。`);
                return;
            }

            if (confirm('确定要取消该订单吗？')) {
                try {
                    // 从格式化的订单ID中提取数字ID (从ORD000001中提取1)
                    const numericId = parseInt(orderId.replace('ORD', ''));

                    // 验证提取的数字ID是否有效
                    if (isNaN(numericId) || numericId <= 0) {
                        throw new Error('订单ID无效');
                    }

                    // 调用取消订单API
                    await cancelOrder(numericId);

                    if (order) {
                        order.status = '已取消';
                    }

                    alert('订单已取消');
                } catch (err) {
                    console.error('取消订单失败:', err);

                    // 即使API调用失败，也尝试在本地更新订单状态
                    if (order) {
                        order.status = '已取消';
                    }

                    alert('取消订单时发生错误，请稍后重试');
                }
            }
        };

        /**
         * 确认订单
         * @param {number} orderId - 订单ID
         */
        const handleConfirmOrder = async (orderId) => {
            const order = orders.value.find(o => o.id === orderId);
            if (!order) {
                alert('订单不存在');
                return;
            }

            try {
                // 调用API确认订单
                await confirmOrder(orderId);

                // 更新本地订单状态
                if (order) {
                    order.status = '待进行';
                }

                alert('订单确认成功');
            } catch (err) {
                console.error('订单确认失败:', err);

                alert('确认订单时发生错误，请稍后重试');
            }
        };

        /**
         * 跳转到预约页面
         */
        const goToReserve = () => {
            router.push('/reserve');
        };
        /**
         * 跳转到联系客服页面
         */
        const navigateToCustomerService = () => {
            router.push('/customer-service');
        };
        /**
         * 检查订单时间并自动更新状态
         * 当订单的结束时间已过且状态为待确认时，自动更新为已完成
         */
        const checkAndUpdateOrderStatus = () => {
            const now = new Date();

            orders.value.forEach(order => {
                // 检查订单是否应该自动完成
                if ((order.status === '待确认') && order.reserveEndDate) {
                    const endDate = new Date(order.reserveEndDate);

                    // 如果当前时间已超过订单结束时间，更新状态为已完成
                    if (now > endDate) {
                        order.status = '已完成';
                        console.log(`订单 ${order.id} 已自动更新为已完成状态`);
                    }
                }
            });
        };

        // 定时器ID
        let statusCheckTimer = null;

        // 启动订单状态检查定时器
        const startStatusCheckTimer = () => {
            // 先立即检查一次
            checkAndUpdateOrderStatus();

            // 设置定时器，每5秒检查一次，实现近似实时更新
            statusCheckTimer = setInterval(checkAndUpdateOrderStatus, 5000);
        };

        // 清除定时器
        const clearStatusCheckTimer = () => {
            if (statusCheckTimer) {
                clearInterval(statusCheckTimer);
                statusCheckTimer = null;
            }
        };

        // 监听订单数据变化，重新启动定时器
        watch(orders, (newOrders) => {
            if (newOrders && newOrders.length > 0) {
                clearStatusCheckTimer();
                startStatusCheckTimer();
            }
        }, { deep: true });

        // 组件挂载时加载订单数据并启动定时器
        onMounted(() => {
            loadOrders();
        });

        // 组件卸载时清除定时器
        onUnmounted(() => {
            clearStatusCheckTimer();
        });

        return {
            orders,
            loading,
            error,
            formatDate,
            formatDateWithTime,
            getOrderStatusText,
            getOrderStatusClass,
            formatPetType,
            calculateDays,
            formatPrice,
            handleCancelOrder,
            goToReserve,
            navigateToCustomerService,
            handleConfirmOrder,
        };
    }
};
</script>

<style scoped>
@import './styles/OrderStyles.css';

/* 特殊要求样式 */
.special-requests {
    margin-top: 10px;
    font-weight: bold;
}

/* 宠物品种样式 */
.pet-breed {
    display: block;
    margin-top: 5px;
    color: #666;
}

.request-content {
    color: #666;
    line-height: 1.5;
    font-size: 14px;
}

/* 价格信息样式 */
.price-info {
    margin-top: 10px;
    font-weight: bold;
}

.price-label {
    color: #666;
    margin-right: 8px;
}

.price-value {
    color: #ff6b6b;
    font-size: 16px;
}
</style>
