import { createApp } from 'vue'
import App from './App.vue'
import 'tailwindcss/tailwind.css'
import router from './router/index'
import { createPinia } from 'pinia'


createApp(App).use(createPinia()).use(router).mount('#app')
