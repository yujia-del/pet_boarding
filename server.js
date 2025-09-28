// 主服务器文件
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeDatabase } from './server/db.js';
import userRoutes from './server/routes/users.js';
import orderRoutes from './server/routes/orders.js';
import { WebSocketServer } from 'ws';
// 创建Express应用
const app = express();
const wss = new WebSocketServer({ port: 3001 });
wss.on('connection', (ws) => {
  console.log('新的WebSocket连接');
  ws.on('close',()=>{
    console.log("客户端断开连接")
  })
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

// 启动服务器
const PORT = process.env.PORT || 3000;

// 先启动服务器，再异步初始化数据库
function startServer() {
  // 立即启动服务器，不等待数据库初始化
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`API文档: http://localhost:${PORT}/api`);
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