import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'tailwindcss/tailwind.css'
import router from './router/index'
import { createPinia } from 'pinia'
import "@amap/amap-jsapi-types";
import piniaPluginPersist from 'pinia-plugin-persist'
const app = createApp(App)
const store = createPinia()
app.use(store.use(piniaPluginPersist))
app.use(router)
app.use(ElementPlus)
app.mount('#app')
