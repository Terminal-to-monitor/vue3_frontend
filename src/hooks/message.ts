import { ElMessage } from 'element-plus'
//错误提示
export const emsg = (msg: string) => {
    ElMessage.error(msg)
}
//成功提示
export const smsg = (msg: string) => {
    ElMessage({
        message: msg,
        type: 'success',
    })
}
