import {createRouter, createWebHistory,RouteRecordRaw} from "vue-router";

const routes: Array<RouteRecordRaw> = [
    {
      path: '/',
      name: 'home',
      component: () => import('../components/Home.vue')
    },
    {
      path:'/map',
      name: 'map',
      component: () => import('../pages/map.vue')
    },
    {
     path:'/monitoringpage',
     name:'monitoringpage',
     component: () => import('../pages/MonitoringPage.vue')

    }
]
const router = createRouter({
    history: createWebHistory(),
    routes, // `routes: routes` 的缩写
})
export default  router
