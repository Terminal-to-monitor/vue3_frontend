import { defineStore } from 'pinia'
import {reqEditCzInfo, reqGetNodeInfo, reqGetSignInfo, reqLogin,reqDeleteCZ} from "../service/api";

export const  useStore = defineStore('user', {
    // 推荐使用 完整类型推断的箭头函数
    state: () => {
        return {
            // 所有这些属性都将自动推断其类型
            token: '',
            permissions: [],
            terminalInfo: [],
        }
    },
    actions: {
        //登录
        async login(userName: string, password: string) {
            const result = await reqLogin(userName, password)
            if (result.data.code === 200) {
                localStorage.setItem('permissions',result.data.data.permissions)
                this.token = result.data.data.token
                localStorage.setItem('token', this.token)
                return result.data
            } else {
                console.log(result.data)
            }
        },
        async getSignInfo() {
           try {
               const result = await reqGetSignInfo()
               if(result.data.code === 200){
                   this.terminalInfo = result.data.data
               }else{
                   console.log(result.data)
               }
           }catch (e){
               throw new Error('something wrong')
           }
        },
        async getNodeInfo(id: string){
               const result = await reqGetNodeInfo(id)
               if(result.data.code === 200){
                   return result.data
               }else{
                   console.log(result.data)
               }
        },
        async changeCzName(id: string, name: string){
            const result = await reqEditCzInfo(id, name)
            if(result.data.code === 200){
                return 'ok'
            }
        },
        async deleteCZ(id: string){
            const result = await reqDeleteCZ(id)
            if(result.data.code === 200){
                return 'ok'
            }
        }
    },
    })

















