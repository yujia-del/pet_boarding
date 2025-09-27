<script>
export default {
    name: 'Footer',
    data() {
        return {
            currentYear: new Date().getFullYear()
        }
    }
}
</script>
<template>
    <div class="footer">
        <div class="footer-left">
            <img src="../cat.svg" class="footer-logo" alt="logo">
        </div>
        <div class="footer-center">
            <p class="copyright">@{{ currentYear }} 宠物寄养</p>
            <p class="rights">保留所有权利</p>
        </div>
        <div class="footer-right">
            <div class="contact-item">电话:***********</div>
            <div class="contact-item">邮箱:service@petboarding.com</div>
        </div>
    </div>
</template>
<style scoped>
.footer {
    width: 100%;
    height: 100px;
    background-color: rgba(250, 171, 184, 0.775);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.footer-left{
    display: flex;
    padding-left: 30px;
    align-items: center;
    justify-content: center;
    gap:10px;
}
.copyright {
    margin: 0 0 5px 0;
    font-weight: 500;
}
.footer-right {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-right:20px;
    align-items: center;
}
.footer-logo{
    height: 80px;
}
.contact-item {
    font-size: 13px;
}
</style>