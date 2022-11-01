import request from "./index";

//登录接口请求
export const reqLogin = (userName: string, password: string) => request('/user/login',{method:'post',data:{userName,password}})

//获取场站信息
export const reqGetSignInfo = () => request('/terminalmessage/message',{method:'get'})

//获取节点信息
export const reqGetNodeInfo = (id: string) => request(`/monitor/czmessage/${id}`,{method:'get'})

//修改场站名称
export const reqEditCzInfo = (id: string, newName: string) => request('/terminalmessage/update',{method:'put', data:{id,terminalName:newName}})

//删除场站信息
export const reqDeleteCZ = (id: string) => request('terminalmessage/delete/1',{method:'delete'})
