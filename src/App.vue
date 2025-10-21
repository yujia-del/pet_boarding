<template>
  <div id="app">
    <!-- 路由视图容器，用于显示当前路由对应的组件 -->
    <router-view />
    
    <!-- 返回置顶组件 -->
    <BackToTop />
  </div>
</template>

<script>
import BackToTop from './components/BackToTop.vue'

/**
 * 应用主组件
 * 作为整个应用的入口容器，通过router-view展示不同的路由页面
 */
export default {
  name: 'App',
  components: {
    BackToTop
  }
}
</script>

<style>
/* 全局样式已在style.css中定义 */
</style>
