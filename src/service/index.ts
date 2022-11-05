import axios from 'axios'
import {emsg} from "../hooks/message";
import {useRouter} from "vue-router";
import router from "../router";
let request = axios.create({
    baseURL:'http://43.138.33.203:8088',
    timeout:10000
})
let token = ''
request.interceptors.request.use((config) => {
    //如果本地存储中有token就在请求头中带上token
    token =localStorage.getItem('token') ?? ''

    if(token) {
        if (config && config.headers) { // 不判断会报类型定义错误
            config.headers['token'] = token
        }
    }
    return config
})

request.interceptors.response.use((res) => {
    if(res.data.code === 401 && res.data.msg === '认证失败请重新登录'){
        localStorage.removeItem('token')
        emsg('登录过期，请重新登录')
        router.push('/')
    }
    return res
},(err)=>{
    if(err.message ){
        emsg('网络错误')
    }
})

export default request
