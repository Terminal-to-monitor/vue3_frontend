import { defineStore } from 'pinia'
import {reqGetSignInfo, reqLogin} from "../service/api";

export const  useStore = defineStore('user', {
    // 推荐使用 完整类型推断的箭头函数
    state: () => {
        return {
            // 所有这些属性都将自动推断其类型
            token: '',
            permissions: [],
            terminalInfo: []
        }
    },
    actions: {
        //登录
        async login(userName: string, password: string) {
            const result = await reqLogin(userName, password)
            if (result.data.code === 200) {
                this.permissions = result.data.data.permissions
                this.token = result.data.data.token
                window.localStorage.setItem('token', this.token)
                return result.data
            } else {
                console.log(result.data)
            }
        },
        async getSignInfo() {
            const result = await reqGetSignInfo()
            if(result.data.code === 200){
                this.terminalInfo = result.data.data
            }
        }
    }
    })

















