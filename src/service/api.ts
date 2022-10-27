import request from "./index";

//登录接口请求
export const reqLogin = (userName: string, password: string) => request('/user/login',{method:'post',data:{userName,password}})

//获取场站信息
export const reqGetSignInfo = () => request('/terminalmessage/message',{method:'get'})
