# 宠物寄养系统 - 数据库配置指南

## 前提条件

在运行此项目之前，请确保您已安装以下软件：

1. [Node.js](https://nodejs.org/) (v14 或更高版本)
2. [MySQL](https://www.mysql.com/) 数据库服务器

## 数据库自动配置

本项目现在支持**自动创建数据库和表**，无需手动执行SQL语句。系统会在首次启动时自动完成以下操作：

1. 创建数据库（如果不存在）
2. 创建必要的表结构
3. 配置连接池

## 配置数据库连接

1. 打开 `server/db.js` 文件

2. 修改以下配置以匹配您的MySQL设置：

```javascript
const dbConfig = {
  host: 'localhost',
  user: 'root', // 请替换为您的MySQL用户名
  password: 'password', // 请替换为您的MySQL密码
  database: 'pet_reserve',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

确保替换 `user` 和 `password` 为您的实际MySQL用户名和密码。

## 安装依赖

在项目根目录下运行以下命令安装所需的依赖：

```bash
npm install mysql2 express cors body-parser bcrypt
```

## 启动应用

1. 确保MySQL服务已启动：
   - **Windows**: 通过服务管理器启动MySQL服务
   - **macOS**: 使用 `brew services start mysql` (如果通过Homebrew安装)
   - **Linux**: 使用 `sudo systemctl start mysql` 或类似命令

2. 启动后端服务器：

```bash
npm run server
```

如果一切正常，您将看到以下消息：
```
数据库 pet_reserve 已创建或已存在
users表已创建或已存在
数据库初始化完成！
服务器运行在端口 3000
API文档: http://localhost:3000/api
```

## 常见问题

### 初始化失败

如果数据库初始化失败，请检查以下几点：

1. MySQL服务是否正在运行
2. 用户名和密码是否正确
3. 用户是否有创建数据库和表的权限

### 权限问题

如果您遇到权限问题，可以在MySQL客户端中执行以下命令为用户授予权限：

```sql
GRANT ALL PRIVILEGES ON *.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

请将 `your_username` 替换为您的MySQL用户名。

### 其他问题

如果您遇到其他问题，可以查看控制台输出的错误信息，这通常会提供有关问题的更多详细信息。