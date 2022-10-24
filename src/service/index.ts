import axios from 'axios'

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


export default request
