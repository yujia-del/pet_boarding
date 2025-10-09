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
                            </div>
                        </div>

                        <div class="reserve-info">
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
                        </div>
                    </div>

                    <div class="order-actions">
                        <button v-if="order.status === 'pending'" class="btn-cancel"
                            @click="handleCancelOrder(order.id)">
                            取消订单
                        </button>
                        <button v-if="order.status === 'pending'" class="btn-contact"
                            @click="navigateToCustomerService">
                            联系客服
                        </button>
                        <button v-if="order.status === 'completed'" class="btn-contact"
                            @click="navigateToCustomerService">
                            联系客服
                        </button>
                    </div>
                </div>
            </div>

            <!-- 无订单状态 -->
            <div class="no-orders" v-else>
                <img src="../assets/empty.png" alt="暂无订单" class="empty-image">
                <p>暂无订单记录</p>
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
import { getOrdersByUserId, cancelOrder } from '../utils/orderApi.js';
import { formatDate, formatDateWithTime, getOrderStatusText, getOrderStatusClass, formatPetType, calculateDays } from '../utils/formatters.js';

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
         * @param {string} orderId - 订单ID
         */
        const handleCancelOrder = async (orderId) => {
            if (confirm('确定要取消该订单吗？')) {
                try {
                    // 提取纯数字ID（去掉前缀）
                    const numericId = orderId.replace(/[^0-9]/g, '');

                    // 调用取消订单API
                    await cancelOrder(numericId);

                    // 更新本地订单状态
                    const order = orders.value.find(o => o.id === orderId);
                    if (order) {
                        order.status = 'cancelled';
                    }

                    alert('订单已取消');
                } catch (err) {
                    console.error('取消订单失败:', err);

                    // 即使API调用失败，也尝试在本地更新订单状态
                    const order = orders.value.find(o => o.id === orderId);
                    if (order) {
                        order.status = 'cancelled';
                    }

                    alert('取消订单时发生错误，请稍后重试');
                }
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
         * 当订单的结束时间已过且状态为待确认/已确认时，自动更新为已完成
         */
        const checkAndUpdateOrderStatus = () => {
            const now = new Date();
            
            orders.value.forEach(order => {
                // 检查订单是否应该自动完成
                if ((order.status === 'pending' || order.status === 'confirmed') && 
                    order.reserveEndDate) {
                    const endDate = new Date(order.reserveEndDate);
                    
                    // 如果当前时间已超过订单结束时间，更新状态为已完成
                    if (now > endDate) {
                        order.status = 'completed';
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
            
            // 设置定时器，每分钟检查一次
            statusCheckTimer = setInterval(checkAndUpdateOrderStatus, 60000);
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
            handleCancelOrder,
            goToReserve,
            navigateToCustomerService,
        };
    }
};
</script>

<style scoped>
@import './styles/OrderStyles.css';
</style>
