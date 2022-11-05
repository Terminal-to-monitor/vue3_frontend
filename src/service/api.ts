import request from "./index";
import type {update} from "./type";
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

//阀门开关接口
export const reqSwitch = (data: update) => request('element/update',{method:'put',data})

//节点信息修改
export const reqSaveNodeInfo = (data: any) => request('element/update',{method:'put',data})
