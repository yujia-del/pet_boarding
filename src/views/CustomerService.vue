<template>
  <Navbar />
  <div class="customer-service-container">
    <div class="chat-card">
      <h2 class="chat-title">
        <span v-if="selectedUser" class="chat-target-id">({{ selectedUser.username }})</span>
      </h2>

      <!-- 聊天界面 -->
      <div class="chat-wrapper">
        <!-- 左侧在线用户列表 -->
        <div class="users-sidebar">
          <div class="sidebar-header">
            <h3>在线用户 ({{ onlineUsers.length }})</h3>
          </div>
          <div class="users-list">
            <div v-for="user in onlineUsers" :key="user.socketId"
              :class="['user-item', selectedUserId === user.socketId ? 'selected' : '']"
              @click="selectUser(user.socketId)">
              <div class="user-avatar">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.username }}</div>
                <div class="user-status">在线</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧聊天区域 -->
        <div class="chat-container">
          <!-- 聊天头部 -->
          <div class="chat-header">
            <div v-if="selectedUser" class="chat-with">
              与 {{ selectedUser.username }} 聊天中
            </div>
            <div v-else class="chat-with"></div>
          </div>

          <!-- 聊天消息区域 -->
          <div class="messages-container">
            <div v-if="!selectedUser" class="select-user-prompt">
            </div>
            <div v-else>
              <div v-for="message in currentChatMessages" :key="message.id"
                :class="['message', message.senderId === socketId ? 'sent' : 'received']">
                <div class="message-content">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- 消息输入区域 -->
          <div class="input-container">
            <input v-model="messageInput" @keyup.enter="sendMessage" :disabled="!selectedUser" :placeholder="请输入消息"
              class="message-input" />
            <button @click="sendMessage" :disabled="!selectedUser || !messageInput.trim()" class="send-button">
              发送
            </button>
          </div>
        </div>
      </div>

    </div>
    <!-- 连接状态显示 -->
    <div class="connection-status">
      <span :class="['status-indicator', socketConnected ? 'connected' : 'disconnected']"></span>
      <span class="status-text">{{ socketConnected ? '已连接' : '未连接' }}</span>
    </div>
  </div>
  <Footer />
</template>

<script>
import { io } from 'socket.io-client';
import { getUserInfo } from '../utils/api';
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

export default {
  name: 'CustomerService',
  components: {
    Navbar,
    Footer
  },
  setup() {
    const router = useRouter();
    const userInfo = ref(getUserInfo());
    const socket = ref(null);
    const socketId = ref('');
    const socketConnected = ref(false);
    const onlineUsers = ref([]);
    const selectedUserId = ref('');
    const messageInput = ref('');
    const chatMessages = ref(new Map());

    // 计算属性：当前选中的用户
    const selectedUser = computed(() => {
      return onlineUsers.value.find(user => user.socketId === selectedUserId.value);
    });

    // 计算属性：当前聊天的消息列表
    const currentChatMessages = computed(() => {
      if (!selectedUserId.value) return [];
      return chatMessages.value.get(selectedUserId.value) || [];
    });

    /**
     * 初始化Socket.IO连接
     */
    const initSocket = () => {
      try {
        // 连接到Socket.IO服务器
        socket.value = io('http://localhost:3000');

        // 监听连接成功事件
        socket.value.on('connect', () => {
          console.log('Socket.IO连接已建立');
          socketId.value = socket.value.id;
          socketConnected.value = true;

          // 如果用户已登录，发送用户信息到服务器
          if (userInfo.value) {
            // 统一使用user_id字段，与后端数据库保持一致
            socket.value.emit('userLogin', {
              username: userInfo.value.username,
              userId: userInfo.value.user_id
            });
            console.log('用户登录信息已发送到服务器:', userInfo.value);
          } else {
            console.log('未获取到用户信息，无法发送登录事件');
          }
        });

        // 监听在线用户列表更新
        socket.value.on('onlineUsersUpdate', (users) => {
          // 过滤掉当前用户自己
          onlineUsers.value = users.filter(user => user.socketId !== socketId.value);
        });

        // 监听私聊消息
        socket.value.on('privateMessage', (message) => {
          // 确保消息对象包含必要的字段
          if (!message.senderId || !message.content) {
            console.error('接收到无效的消息:', message);
            return;
          }

          // 确定聊天对象ID（如果是自己发送的，则是接收者ID；否则是发送者ID）
          const chatWithId = message.senderId === socketId.value ?
            message.receiverId : message.senderId;

          // 将消息添加到对应聊天记录
          if (!chatMessages.value.has(chatWithId)) {
            chatMessages.value.set(chatWithId, []);
          }
          const messages = chatMessages.value.get(chatWithId);
          messages.push(message);

          // 如果是新消息且当前没有选择聊天对象，自动选择该聊天对象
          if (!selectedUserId.value) {
            selectUser(chatWithId);
          }

          // 滚动到最新消息
          setTimeout(() => {
            scrollToBottom();
          }, 0);
        });

        // 监听消息错误
        socket.value.on('messageError', (error) => {
          console.error('消息发送错误:', error);
          // 显示错误提示给用户
          alert('消息发送失败：' + (error.error || '未知错误'));
        });

        // 监听连接断开事件
        socket.value.on('disconnect', () => {
          console.log('Socket.IO连接已断开');
          socketConnected.value = false;
        });

        // 监听连接错误事件
        socket.value.on('connect_error', (error) => {
          console.error('Socket.IO连接错误:', error);
          socketConnected.value = false;
        });

        // 监听强制断开连接事件
        socket.value.on('forceDisconnect', (data) => {
          console.log('收到强制断开连接通知:', data);
          alert(data.reason || '您的连接已断开，请重新登录');
          // 清空聊天数据
          onlineUsers.value = [];
          selectedUserId.value = '';
          chatMessages.value.clear();
          // 断开当前Socket连接
          disconnectSocket();
          // 跳转到登录页面
          router.push('/login');
        });
      } catch (error) {
        console.error('初始化Socket.IO失败:', error);
      }
    };

    /**
     * 断开Socket.IO连接
     */
    const disconnectSocket = () => {
      if (socket.value) {
        socket.value.disconnect();
      }
    };

    /**
     * 选择聊天用户
     * @param {string} userId - 用户ID
     */
    const selectUser = (userId) => {
      selectedUserId.value = userId;
      // 滚动到最新消息
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    };

    /**
     * 发送消息
     */
    const sendMessage = () => {
      const content = messageInput.value.trim();

      if (!content || !selectedUserId.value || !socketConnected.value) {
        return;
      }

      // 发送私聊消息到服务器
      socket.value.emit('privateMessage', {
        receiverId: selectedUserId.value,
        content: content
      });

      // 清空输入框
      messageInput.value = '';

      // 可以在这里添加发送成功的提示或状态更新
      console.log('消息已发送');
    };

    /**
     * 格式化时间
     * @param {string} timestamp - 时间戳字符串
     * @returns {string} 格式化后的时间字符串
     */
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    /**
     * 滚动到消息区域底部
     */
    const scrollToBottom = () => {
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    };

    /**
     * 跳转到登录页面
     */
    const goToLogin = () => {
      router.push('/login');
    };

    // 组件挂载时初始化Socket.IO连接
    onMounted(() => {
      initSocket();
    });

    // 组件卸载时断开Socket.IO连接
    onUnmounted(() => {
      disconnectSocket();
    });

    return {
      userInfo,
      socket,
      socketId,
      socketConnected,
      onlineUsers,
      selectedUserId,
      messageInput,
      selectedUser,
      currentChatMessages,
      selectUser,
      sendMessage,
      formatTime,
      scrollToBottom,
      goToLogin
    };
  }
};
</script>

<style scoped>
.customer-service-container {
  max-width: 1000px;
  min-height: calc(100vh - 120px);
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  display: flex;
  flex-direction: column;
}

.chat-card {
  flex: 1;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-title {
  text-align: center;
  color: #333;
  margin: 0;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.chat-target-id {
  font-size: 14px;
  color: #666;
  font-weight: normal;
  margin-left: 10px;
}



/* 登录界面样式 */
/* 聊天主界面样式 */
.chat-wrapper {
  height: calc(100% - 61px);
  display: flex;
  overflow: hidden;
}

/* 左侧用户列表样式 */
.users-sidebar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  background: white;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.user-item:hover {
  background-color: rgba(0, 132, 255, 0.05);
}

.user-item.selected {
  background-color: rgba(0, 132, 255, 0.1);
  border-left: 4px solid rgb(251, 171, 184);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgb(251, 171, 184);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: 12px;
  color: #52c41a;
}

/* 右侧聊天区域样式 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  background: #f8f9fa;
}

.chat-with {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.select-user-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
  text-align: center;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9f9f9;
}

.message {
  margin-bottom: 20px;
  max-width: 70%;
}

.message.sent {
  margin-left: auto;
}

.message.received {
  margin-right: auto;
}

.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  position: relative;
}

.message.sent .message-content {
  background-color: rgb(251, 171, 184);
  color: white;
}

.message.received .message-content {
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.message.received .message-time {
  text-align: left;
}

.input-container {
  display: flex;
  padding: 16px;
  background-color: white;
  border-top: 1px solid #ddd;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
}

.message-input:focus {
  border-color: rgb(251, 171, 184);
}

.message-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.send-button {
  margin-left: 12px;
  padding: 12px 24px;
  background-color: rgb(251, 171, 184);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  outline: none;
  transition: background-color 0.3s;
}

.send-button:hover:not(:disabled) {
  background-color:rgb(251, 171, 184);
}

.send-button:active:not(:disabled) {
  background-color: rgb(251, 171, 184);
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 连接状态样式 */
.connection-status {
  margin: 16px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1000px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.connected {
  background-color: #52c41a;
}

.status-indicator.disconnected {
  background-color: #ff4d4f;
}

.status-text {
  color: #666;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-wrapper {
    flex-direction: column;
  }

  .users-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }

  .messages-container {
    height: 300px;
  }
}
</style>