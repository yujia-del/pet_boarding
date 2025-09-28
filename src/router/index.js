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
    }
]
const router = createRouter({
    history: createWebHistory(),
    routes
})
export default router