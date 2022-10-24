import request from "./index";

//登录接口请求
export  const reqLogin = (userName: string, password: string) => request('/user/login',{method:'post',data:{userName,password}})

//获取地图场站信息

