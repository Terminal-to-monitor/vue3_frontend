import { defineStore } from 'pinia'
import axios from 'axios'
export const  useStore = defineStore('user', {
    // 推荐使用 完整类型推断的箭头函数
    state: () => {
        return {
            // 所有这些属性都将自动推断其类型
            token: ''
        }
    },
    actions:{
        async login(username: string, passwd: string){
            try {
                const result = await axios.post('http://localhost:8080/api/login',{username,passwd})
                if(result.data.status === 200){
                    this.token = result.data.data.token
                    alert('登录成功，token为'+this.token)
                }

            }
            catch (err: any){
                return err.message
            }
        }
    }
})
