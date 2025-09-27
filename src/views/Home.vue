<script>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Carousel from '../components/Carousel.vue'
import { ref } from 'vue'

export default {
  name: 'Home',
  components: {
    Navbar,
    Footer,
    Carousel,
  },

  mounted() {
    console.log('Home页面已加载')
  },
}
</script>
<template>
  <!-- 主页容器 - 包含背景图 -->
  <div class="home-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <!-- 文字区域 -->
      <div class="hero-section">
        <p>我们提供专业的宠物寄养服务，让您外出无忧</p>
      </div>
      
      <!-- 轮播图区域 -->
      <div class="carousel-section">
        <Carousel />
      </div>
    </div>
    

    
    <!-- 页脚 -->
    <Footer />
  </div>
</template>
<style scoped>
/* 全局重置样式 */
:global(body),
:global(html) {
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 主页容器 - 包含全屏背景图 */
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  text-align: center;
  overflow-x: hidden;
  /* 将背景图设置在最外层容器 */
  background-image: url('../assets/home3.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* 固定背景图，使其不随滚动移动 */
  background-attachment: fixed;
  /* 确保子元素在背景图上方显示 */
  position: relative;
}

/* 内容包装器 - 包含所有内容 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  /* 确保内容在背景图上方 */
  position: relative;
  z-index: 10;
}

/* 英雄区域文字样式 */
.hero-section {
  color: white;
  padding: 40px 20px;
  margin-bottom: 30px;
}

.hero-section p {
  font-size: 2.5rem;
  margin: 0;
  font-weight: bold;
}

/* 轮播图区域 */
.carousel-section {
  /* 确保轮播图在内容区域中间 */
  margin-left: 20px;
  /* 设置合适的宽度和高度 */
  max-width: 900px;
  width: 100%;
  padding: 10px;
}

</style>
