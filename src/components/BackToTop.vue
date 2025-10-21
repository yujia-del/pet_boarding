<template>
  <div 
    class="back-to-top" 
    :class="{ 'show': isVisible }"
    @click="scrollToTop"
    :title="'返回顶部'"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l-8 8h5v10h6v-10h5l-8-8z"/>
    </svg>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 返回置顶组件
 * 当页面滚动超过指定距离时显示返回顶部按钮，点击后平滑滚动到页面顶部
 */
export default {
  name: 'BackToTop',
  props: {
    /**
     * 滚动多少像素后显示返回顶部按钮
     */
    threshold: {
      type: Number,
      default: 300
    },
    /**
     * 滚动到顶部的动画持续时间（毫秒）
     */
    duration: {
      type: Number,
      default: 500
    }
  },
  setup(props) {
    // 控制按钮显示/隐藏状态
    const isVisible = ref(false)
    
    // 滚动事件处理函数
    const handleScroll = () => {
      const scrollY = window.scrollY
      isVisible.value = scrollY > props.threshold
    }
    
    /**
     * 平滑滚动到页面顶部
     */
    const scrollToTop = () => {
      const start = window.scrollY
      const startTime = Date.now()
      
      const animateScroll = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / props.duration, 1)
        // 使用缓动函数使滚动更自然
        const easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
        
        window.scrollTo(0, start - start * easeProgress)
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll)
        }
      }
      
      requestAnimationFrame(animateScroll)
    }
    
    // 组件挂载时添加事件监听
    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
      // 初始化检查一次滚动位置
      handleScroll()
    })
    
    // 组件卸载时移除事件监听
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })
    
    return {
      isVisible,
      scrollToTop
    }
  }
}
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background-color: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease;
  z-index: 1000;
}

.back-to-top:hover {
  background-color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.back-to-top.show {
  opacity: 1;
  transform: translateY(0);
}

/* 适配移动设备 */
@media (max-width: 768px) {
  .back-to-top {
    width: 40px;
    height: 40px;
    bottom: 20px;
    right: 20px;
  }
  
  .back-to-top svg {
    width: 20px;
    height: 20px;
  }
}
</style>