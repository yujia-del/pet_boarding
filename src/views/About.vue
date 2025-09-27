<template>
  <div class="about-container">
    <Navbar />

    <div class="about-header">
      <div class="about-title-container">
        <h1 class="about-title">关于我们</h1>
        <div class="about-subtitle">专业的宠物寄养服务平台</div>
      </div>
    </div>

    <div class="about-content">
      <section class="about-section">
        <p>
          我们是一家致力于为宠物主人提供高品质寄养服务的平台。无论您是外出旅行、工作忙碌还是临时有事，
          我们都能为您的爱宠提供舒适的居住环境和专业的照顾，让您无后顾之忧。
        </p>
      </section>
      
      <section class="about-section">
        <div class="advantages-grid">
          <div class="advantage-item">
            <img class="advantage-icon" src="../about.svg" alt="专业团队" />
            <h3>专业团队</h3>
            <p>我们的工作人员都经过专业培训，了解不同宠物的需求和行为特点</p>
          </div>
          <div class="advantage-item">
            <img class="advantage-icon" src="../house.svg" alt="舒适环境" />
            <h3>舒适环境</h3>
            <p>宽敞明亮的寄养空间，定期清洁消毒，确保宠物健康舒适</p>
          </div>
          <div class="advantage-item">
            <img class="advantage-icon" src="../moniter.svg" alt="实时监控" />
            <h3>实时监控</h3>
            <p>通过平台可随时查看宠物状态，了解爱宠的日常生活</p>
          </div>
          <div class="advantage-item">
            <img class="advantage-icon" src="../love.svg" alt="爱心照顾" />
            <h3>爱心照顾</h3>
            <p>我们像对待自己的宠物一样关爱每一位寄养的小伙伴</p>
          </div>
        </div>
      </section>
      
      <section class="about-section">
        <h2>联系我们</h2>
        <div class="contact-info">
          <p><strong>电话：</strong>XXX-XXX-XXXX</p>
          <p><strong>邮箱：</strong>contact@pet-reserve.com</p>
          <p><strong>地址：</strong>XX市XX区XX大厦XX室</p>
        </div>
      </section>
    </div>
    
    <Footer />
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';

export default {
  name: 'About',
  components: {
    Navbar,
    Footer
  }
};
</script>

<style scoped>
/* 页面容器样式 */
.about-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

/* 页面头部样式 */
.about-header {
  background-color: rgb(237, 155, 155);
  color: white;
  text-align: center;
  padding: 60px 20px;
}

.about-title-container {
  max-width: 800px;
  margin: 0 auto;
}

.about-title {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.about-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

/* 主要内容样式 */
.about-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 内容区块样式 */
.about-section {
  background: white;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 30px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.about-section h2 {
  display: flex;
  align-items: center;
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 20px;
}

.about-icon {
  font-size: 1.5rem;
  margin-right: 15px;
}

.about-section p {
  color: #666;
  line-height: 1.8;
  font-size: 1rem;
}

/* 优势网格样式 */
.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.advantage-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease;
}

.advantage-item:hover {
  transform: translateY(-3px);
  background: #f0f0f0;
}

/* 调整图标样式，同时支持图片和文字表情符号 */
.advantage-icon {
  margin-bottom: 15px;
}

/* 为图片图标添加样式 */
.advantage-icon[src] {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

/* 为文字表情符号图标添加样式 */
.advantage-icon:not([src]) {
  font-size: 2rem;
}

.advantage-item h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.advantage-item p {
  font-size: 0.95rem;
  color: #777;
}

/* 联系信息样式 */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.contact-info p {
  margin: 0;
  display: flex;
  align-items: center;
}

.contact-info strong {
  min-width: 80px;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-header {
    padding: 40px 20px;
  }
  
  .about-title {
    font-size: 2rem;
  }
  
  .about-content {
    padding: 20px 15px;
  }
  
  .about-section {
    padding: 20px;
  }
  
  .advantages-grid {
    grid-template-columns: 1fr;
  }
}
</style>
