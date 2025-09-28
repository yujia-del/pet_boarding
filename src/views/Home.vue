<script>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Carousel from '../components/Carousel.vue'

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
  <div class="background-layer"></div>
  <div class="home-container">
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

      <!-- 平台故事部分 -->
      <div class="story-section">
        <div class="story-container">
          <div class="story-content">
            <h2>我们的平台故事</h2>
            <p>宠物之家创立于2020年，源于对宠物的热爱和对专业寄养服务的需求。我们的团队由一群充满爱心和专业知识的宠物爱好者组成，致力于为您的爱宠提供如家般的寄养体验。</p>
            <p>三年来，我们已服务超过1000个宠物家庭，精心照料了各类萌宠。我们相信，每一位宠物主人都希望在外出时，自己的宝贝能得到专业、贴心的照顾。这就是我们创立宠物之家的初衷。</p>

          </div>
          <div class="story-image">
            <img src="../assets/home3.jpg" alt="我们的平台故事">
          </div>
        </div>
      </div>
      <div class="story-highlights">
        <div class="highlight-item">
          <div class="highlight-icon">🏠</div>
          <div class="highlight-content">
            <h3>舒适的居住环境</h3>
            <p>为您的爱宠提供宽敞明亮、干净舒适的居住空间</p>
          </div>
        </div>
        <div class="highlight-item">
          <div class="highlight-content">
            <h3>专业的照顾团队</h3>
            <p>经验丰富的宠物护理人员提供专业照料和关爱</p>
          </div>
          <div class="highlight-icon">👩‍⚕️</div>
        </div>
        <div class="highlight-item">
          <div class="highlight-icon">🐾</div>
          <div class="highlight-content">
            <h3>丰富的活动空间</h3>
            <p>专门的活动区域让宠物自由活动、玩耍和社交</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>
<style scoped>
/* 背景图层样式 */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('../assets/home3.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

/* 主页容器样式 */
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  min-height: 100vh;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
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

.story-section {
  background-color: rgba(255, 255, 255, 0.7);
  padding: 60px 20px;
  margin-top: 50px;
  width: 100%;
}

.story-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 40px;
}

.story-content {
  flex: 1;
  text-align: left;
  color: #333;
}

.story-content h2 {
  font-size: 2.2rem;
  margin-bottom: 20px;
  color: #333;
  font-weight: bold;
}

.story-content p {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 20px;
  color: #555;
}

.story-highlights {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 40px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
}

.highlight-item {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 20px;
  margin-bottom: 20px;
  height: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  width:1000px;
  justify-content: center;
}

.highlight-item:nth-child(odd) {
  flex-direction: row;
}

.highlight-item:nth-child(even) {
  flex-direction: row-reverse;
}

.highlight-item:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.highlight-icon {
  font-size: 4rem;
  color: #ff8c94;
  margin: 0 30px;
  flex-shrink: 0;
}

.highlight-content {
  flex: 1;
  text-align: left;
}

.highlight-item h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #fc9696;
  margin: 0 0 8px 0;
}

.highlight-item p {
  font-size: 1rem;
  color: #333333;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
}

.story-image {
  flex: 1;
  max-width: 500px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.story-image img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .story-container {
    flex-direction: column;
  }

  .story-image {
    max-width: 100%;
  }

  .story-highlights {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
