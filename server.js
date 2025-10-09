// 主服务器文件
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeDatabase } from './server/db.js';
import userRoutes from './server/routes/users.js';
import orderRoutes from './server/routes/orders.js';
import { Server } from 'socket.io';
import http from 'http';

// 创建Express应用
const app = express();
// 创建HTTP服务器
const server = http.createServer(app);
// 创建Socket.IO服务器
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 路由
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// 测试接口
app.get('/api', (req, res) => {
  res.json({ message: 'API服务器运行正常' });
});

// 存储在线用户信息 - 使用userId作为键，确保一个用户只能有一个连接
const onlineUsers = new Map();
// 存储userId到socketId的映射
const userIdToSocketId = new Map();

// Socket.IO事件处理
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);
  
  // 监听用户登录事件
  socket.on('userLogin', (userData) => {
    // 检查用户是否已经有活跃连接
    if (userData.userId && userIdToSocketId.has(userData.userId)) {
      const existingSocketId = userIdToSocketId.get(userData.userId);
      
      // 如果已经有连接且不是当前连接，则断开旧连接
      if (existingSocketId !== socket.id) {
        console.log(`用户 ${userData.username} 已有连接，断开旧连接: ${existingSocketId}`);
        
        // 从onlineUsers中删除旧连接
        onlineUsers.delete(existingSocketId);
        
        // 向旧连接发送被强制下线的通知
        io.to(existingSocketId).emit('forceDisconnect', {
          reason: '您的账户在其他设备上登录，当前连接已断开'
        });
      }
    }
    
    // 存储用户信息，使用socket.id作为键
    onlineUsers.set(socket.id, { ...userData, socketId: socket.id });
    
    // 如果用户有userId，则建立userId到socketId的映射
    if (userData.userId) {
      userIdToSocketId.set(userData.userId, socket.id);
    }
    
    // 向所有用户广播在线用户列表更新
    io.emit('onlineUsersUpdate', Array.from(onlineUsers.values()));
    
    console.log(`${userData.username || '用户'}登录成功`);
  });
  
  // 监听私聊消息
  socket.on('privateMessage', ({ receiverId, content }) => {
    const sender = onlineUsers.get(socket.id);
    
    // 先尝试直接通过socketId查找接收者
    let receiver = onlineUsers.get(receiverId);
    
    if (receiver) {
      // 创建消息对象
      const message = {
        id: Date.now().toString(),
        senderId: socket.id,
        senderName: sender?.username || '匿名用户',
        receiverId: receiverId,
        content: content,
        timestamp: new Date().toISOString()
      };
      
      // 发送消息给接收者
      io.to(receiver.socketId).emit('privateMessage', message);
      // 发送消息给发送者（确认消息已发送）
      socket.emit('privateMessage', message);
      
      console.log(`消息从 ${sender?.username} 发送到 ${receiver.username}: ${content}`);
    } else {
      // 接收者不在线
      socket.emit('messageError', { error: '用户不在线或不存在' });
    }
  });
  
  // 监听断开连接事件
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      
      // 如果用户有userId，检查是否需要从userIdToSocketId中删除
      if (user.userId && userIdToSocketId.get(user.userId) === socket.id) {
        userIdToSocketId.delete(user.userId);
      }
      
      // 向所有用户广播在线用户列表更新
      io.emit('onlineUsersUpdate', Array.from(onlineUsers.values()));
      console.log(`${user.username || '用户'}断开连接`);
    } else {
      console.log('匿名用户断开连接');
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

// 先启动服务器，再异步初始化数据库
function startServer() {
  // 立即启动服务器，不等待数据库初始化
  server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`API文档: http://localhost:${PORT}/api`);
    console.log('Socket.IO服务已启动');
    console.log('数据库初始化中，请稍候...');
  });
  
  // 异步初始化数据库
  initializeDatabase()
    .then(() => {
      console.log('数据库初始化完成！API现在可以正常使用');
    })
    .catch(error => {
      console.error('数据库初始化失败:', error);
      // 可以选择是否退出，取决于数据库对应用的重要性
      // process.exit(1);
    });
}

// 启动服务器
startServer();