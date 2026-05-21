/**
 * HP-Agent 前端入口。
 * 挂载 Vue 3 应用 + vue-router，渲染到 #app。
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')