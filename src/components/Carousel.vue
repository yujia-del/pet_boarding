<template>
  <div class="carousel-container">
    <swiper
      :style="{
        '--swiper-navigation-color': '#fff',
        '--swiper-pagination-color': '#fff',
      }"
      :spaceBetween="10"
      :navigation="true"
      :thumbs="{ swiper: thumbsSwiper }"
      :modules="modules"
      class="mySwiper2"
    >
      <swiper-slide
        ><img
          src="../assets/home.jpeg" alt="宠物寄养服务" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物玩耍" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home3.jpg" alt="宠物休息" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home.jpeg" alt="宠物寄养环境" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物关爱" /></swiper-slide>
    </swiper>
    <swiper
      @swiper="setThumbsSwiper"
      :spaceBetween="10"
      :slidesPerView="4"
      :freeMode="true"
      :watchSlidesProgress="true"
      :modules="modules"
      class="mySwiper"
    >
      <swiper-slide
        ><img
          src="../assets/home.jpeg" alt="宠物寄养服务" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物玩耍" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home3.jpg" alt="宠物休息" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home.jpeg" alt="宠物寄养环境" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物关爱" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物关爱" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物关爱" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物关爱" /></swiper-slide
      ><swiper-slide
        ><img
          src="../assets/home2.jpg" alt="宠物关爱" /></swiper-slide
      ><swiper-slide
        ><img src="../assets/home2.jpg" alt="宠物关爱"
      /></swiper-slide>
    </swiper>
  </div>
</template>
<script>
import { ref } from 'vue';
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

// 注意：之前引用的 './style.css' 文件不存在，我们可以内联样式或创建该文件

// import required modules
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';

export default {
  name: 'Carousel',
  components: {
    Swiper,
    SwiperSlide,
  },
  setup() {
    // 用于缩略图轮播的引用
    const thumbsSwiper = ref(null);

    // 设置缩略图轮播实例的方法
    const setThumbsSwiper = (swiper) => {
      thumbsSwiper.value = swiper;
    };

    return {
      thumbsSwiper,
      setThumbsSwiper,
      modules: [FreeMode, Navigation, Thumbs],
    };
  },
};
</script>
<style scoped>
/* 添加轮播容器样式 */
.carousel-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Swiper 主轮播样式 */
.mySwiper2 {
  width: 100%;
  height: 400px;
  margin-bottom: 20px;
}

.mySwiper2 img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 缩略图轮播样式 */
.mySwiper {
  width: 100%;
  height: 120px;
}

.mySwiper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

/* 自定义导航按钮和分页器样式 */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  background-color: rgba(0, 0, 0, 0);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.swiper-button-next:after),
:deep(.swiper-button-prev:after) {
  font-size: 16px;
}
</style>
