import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 导入Element Plus和样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 创建应用实例
const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
