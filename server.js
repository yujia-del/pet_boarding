// 主服务器文件
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeDatabase } from './server/db.js';
import userRoutes from './server/routes/users.js';
import orderRoutes from './server/routes/orders.js';
import petRoutes from './server/routes/pets.js';
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
app.use('/api/pets', petRoutes);

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
      
      // 初始化完成后启动定时任务
      startScheduledTasks();
    })
    .catch(error => {
      console.error('数据库初始化失败:', error);
      // 可以选择是否退出，取决于数据库对应用的重要性
      // process.exit(1);
    });
}

/**
 * 启动所有定时任务
 */
function startScheduledTasks() {
  console.log('启动定时任务...');
  
  // 定时检查并取消超过一小时未确认的订单，每5分钟执行一次
  const orderCheckInterval = setInterval(async () => {
    try {
      await cancelUnconfirmedOrders();
    } catch (error) {
      console.error('定时任务执行失败:', error);
    }
  }, 5 * 60 * 1000); // 5分钟
  
  console.log('订单自动取消任务已启动，每5分钟检查一次');
  
  // 定时检查并将超过开始时间的待进行订单状态更新为进行中，每5分钟执行一次
  const inProgressOrdersInterval = setInterval(async () => {
    try {
      await updateInProgressOrders();
    } catch (error) {
      console.error('更新进行中订单状态任务执行失败:', error);
    }
  }, 0.5 * 60 * 1000); // 5分钟
  
  console.log('订单自动变为进行中任务已启动，每5分钟检查一次');
  
  // 定时检查并将超过结束时间的订单状态更新为已完成，每5分钟执行一次
  const completeOrdersInterval = setInterval(async () => {
    try {
      await updateCompletedOrders();
    } catch (error) {
      console.error('更新已完成订单状态任务执行失败:', error);
    }
  }, 0.5 * 60 * 1000); // 5分钟
  
  console.log('订单自动完成任务已启动，每5分钟检查一次');
}

/**
 * 取消超过一小时未确认的待确认状态订单，并释放对应的名额
 */
async function cancelUnconfirmedOrders() {
  try {
    // 等待数据库连接就绪
    const pool = await import('./server/db.js').then(m => m.getPool());
    
    // 先查询需要取消的订单
    const [ordersToCancel] = await pool.query(
      'SELECT order_id, start_date, end_date FROM \`order\` WHERE status = ? AND create_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)',
      ['待确认']
    );
    
    if (ordersToCancel.length === 0) {
      console.log('没有需要自动取消的订单');
      return;
    }
    
    // 开始事务
    await pool.query('START TRANSACTION');
    
    try {
      // 更新订单状态为已取消
      const [result] = await pool.query(
        'UPDATE \`order\` SET status = ? WHERE status = ? AND create_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)',
        ['已取消', '待确认']
      );
      
      // 为每个取消的订单释放名额
      for (const order of ordersToCancel) {
        const start = new Date(order.start_date);
        const end = new Date(order.end_date);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        // 遍历日期范围，减少每天的已预约宠物数量
        for (let i = 0; i <= daysDiff; i++) {
          const updateDate = new Date(start);
          updateDate.setDate(start.getDate() + i);
          const updateDateStr = updateDate.toISOString().split('T')[0];
          
          // 减少名额，确保不小于0
          await pool.query(
            'UPDATE host_availability SET booked_pets = GREATEST(0, booked_pets - 1) WHERE date = ?',
            [updateDateStr]
          );
          
          console.log(`订单自动取消：已更新日期 ${updateDateStr} 的预约人数，减少1人`);
        }
      }
      
      // 提交事务
      await pool.query('COMMIT');
      
      if (result.affectedRows > 0) {
        console.log(`已自动取消 ${result.affectedRows} 个超过一小时未确认的订单，并释放了相应名额`);
      }
    } catch (error) {
      // 出错时回滚事务
      await pool.query('ROLLBACK');
      console.error('处理订单取消时发生错误，已回滚事务:', error);
      throw error;
    }
  } catch (error) {
    console.error('取消未确认订单失败:', error);
    throw error;
  }
}

/**
 * 将超过开始时间的待进行订单状态更新为进行中
 * 查找所有开始日期小于当前日期且状态为"待进行"的订单，并将状态更新为"进行中"
 */
async function updateInProgressOrders() {
  try {
    // 等待数据库连接就绪
    const pool = await import('./server/db.js').then(m => m.getPool());
    
    // 开始事务
    await pool.query('START TRANSACTION');
    
    try {
      // 更新订单状态为进行中
      const [result] = await pool.query(
        'UPDATE \`order\` SET status = ? WHERE status = ? AND start_date <= NOW()',
        ['进行中', '待进行']
      );
      
      // 提交事务
      await pool.query('COMMIT');
      
      if (result.affectedRows > 0) {
        console.log(`已自动将 ${result.affectedRows} 个开始时间已到的待进行订单状态更新为进行中`);
      } else {
        console.log('没有需要自动变为进行中的订单');
      }
    } catch (error) {
      // 出错时回滚事务
      await pool.query('ROLLBACK');
      console.error('处理订单自动变为进行中时发生错误，已回滚事务:', error);
      throw error;
    }
  } catch (error) {
    console.error('更新进行中订单状态失败:', error);
    throw error;
  }
}

/**
 * 将超过结束时间的订单状态更新为已完成，并释放对应的名额
 * 查找所有结束日期小于当前日期且状态不是"已完成"或"已取消"的订单，并将状态更新为"已完成"
 */
async function updateCompletedOrders() {
  try {
    // 等待数据库连接就绪
    const pool = await import('./server/db.js').then(m => m.getPool());
    
    // 先查询需要更新为已完成的订单
    const [ordersToComplete] = await pool.query(
      'SELECT order_id, start_date, end_date FROM \`order\` WHERE status NOT IN (?, ?) AND end_date < NOW()',
      ['已完成', '已取消']
    );
    
    if (ordersToComplete.length === 0) {
      console.log('没有需要自动完成的订单');
      return;
    }
    
    // 开始事务
    await pool.query('START TRANSACTION');
    
    try {
      // 更新订单状态为已完成
      const [result] = await pool.query(
        'UPDATE \`order\` SET status = ? WHERE status NOT IN (?, ?) AND end_date < NOW()',
        ['已完成', '已完成', '已取消']
      );
      
      // 为每个完成的订单释放名额
      for (const order of ordersToComplete) {
        const start = new Date(order.start_date);
        const end = new Date(order.end_date);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        // 遍历日期范围，减少每天的已预约宠物数量
        for (let i = 0; i <= daysDiff; i++) {
          const updateDate = new Date(start);
          updateDate.setDate(start.getDate() + i);
          const updateDateStr = updateDate.toISOString().split('T')[0];
          
          // 减少名额，确保不小于0
          await pool.query(
            'UPDATE host_availability SET booked_pets = GREATEST(0, booked_pets - 1) WHERE date = ?',
            [updateDateStr]
          );
          
          console.log(`订单自动完成：已更新日期 ${updateDateStr} 的预约人数，减少1人`);
        }
      }
      
      // 提交事务
      await pool.query('COMMIT');
      
      if (result.affectedRows > 0) {
        console.log(`已自动将 ${result.affectedRows} 个超过结束时间的订单状态更新为已完成，并释放了相应名额`);
      }
    } catch (error) {
      // 出错时回滚事务
      await pool.query('ROLLBACK');
      console.error('处理订单自动完成时发生错误，已回滚事务:', error);
      throw error;
    }
  } catch (error) {
    console.error('更新已完成订单状态失败:', error);
    throw error;
  }
}

// 启动服务器
startServer();