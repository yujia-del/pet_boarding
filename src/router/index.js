import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import About from '../views/About.vue'
import Reserve from '../views/Reserve.vue'
import Order from '../views/Order.vue'
import CustomerService from '../views/CustomerService.vue'
import ReserveSuccess from '../views/ReserveSuccess.vue'
import Adoption from '../views/Adoption.vue'
import Pets from '../views/Pets.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component:Home
    },
    {
        path:'/login',
        name:'Login',
        component:Login
    },
    {
        path:'/register',
        name:'Register',
        component:Register
    },
    {
        path:'/profile',
        name:'Profile',
        component:Profile
    },
    {
        path:'/about',
        name:'About',
        component:About
    },
    {
        path:'/reserve',
        name:'Reserve',
        component:Reserve
    },
    {
        path:'/order',
        name:'Order',
        component:Order
    },
    {
        path:'/reserve-success',
        name:'ReserveSuccess',
        component:ReserveSuccess
    },
    {
        path:'/customer-service',
        name:'CustomerService',
        component:CustomerService
    },
    {
        path:'/adoption',
        name:'Adoption',
        component:Adoption
    },
    {
        path:'/pets',
        name:'Pets',
        component:Pets
    },
    
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

/**
 * 全局前置守卫 - 检测用户登录状态
 */
router.beforeEach((to, from, next) => {
    // 需要登录的路由列表
    const requiresAuth = ['Profile', 'Reserve', 'Order', 'CustomerService', 'ReserveSuccess', 'Pets']
    
    // 检查是否需要登录以及用户是否已登录
    const isAuthenticated = !!sessionStorage.getItem('userInfo')
    
    // 如果路由需要登录且用户未登录，则重定向到登录页面
    if (requiresAuth.includes(to.name) && !isAuthenticated) {
        // 保存用户尝试访问的页面，登录后可以重定向回来
        sessionStorage.setItem('redirectPath', to.fullPath)
        next({ name: 'Login' })
    } else {
        // 其他情况，允许访问
        next()
    }
})

export default router