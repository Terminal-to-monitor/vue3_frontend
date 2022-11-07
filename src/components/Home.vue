<script setup lang="ts">
import {ref, onMounted, reactive} from "vue";
import {useStore} from "../store/";
import {useRouter} from "vue-router";
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const store = useStore()
const ruleForm=reactive({
  userName:'',
  passWord:''
})

const rules = ref<FormRules>({
  userName:[{required: true, message: '请输入用户名', trigger: 'blur'},
    { min: 1, max: 10, message: 'Length should be 1 to 10', trigger: 'blur' }],
  passWord:[{required: true, message: '请输入密码', trigger: 'blur'},
    { min: 1, max: 10, message: 'Length should be 1 to 10', trigger: 'blur' }]
})



//登录
const submit = async () => {
  const result = await store.login(ruleForm.userName, ruleForm.passWord)
  console.log(result)
  if(result.code == 200){
    router.push('/map')
  }
}
onMounted(() => {
  const token = localStorage.getItem('token')
  if(token){
    router.push('/map')
  }
})

</script>
<template id="home">
  <div class='h-screen w-full flex justify-center items-center  bg'>
    <div class='h-96 w-3/6  flex bg-gray-50 rounded-2xl shadow-xl'>
    <div class="w-4/6 flex flex-col justify-center items-center">
        <div class="text-3xl font-semibold ">Login</div>
      <el-form :rules="rules" :model="ruleForm">
        <p class="text-xs text-gray-300 mr-40 mt-10">Enter Your Username:</p>
        <el-form-item prop="userName"  >
          <el-input  v-model="ruleForm.userName" style="width: 300px;margin-left:-3px;margin-top:3px"   />
        </el-form-item>


      <p class="text-xs text-gray-300 mr-40 mt-5">Enter Your Password:</p>
        <el-form-item prop="passWord"  >
      <el-input type="password" v-model="ruleForm.passWord" prop="password" style="width: 300px;margin-left:-3px;margin-top:3px" />
        </el-form-item>
      <button
          @click.prevent="submit"
          class='bg-blue-500 transition duration-150 ease-in-out hover:scale-105 rounded-md text-white mt-12 w-80 h-10 flex flex-row items-center justify-center'>
        <text class=' text-lg' >login</text>
      </button>
      </el-form>
    </div>
      <div class="flex-1 bg-blue-300 rounded-2xl bg1 "></div>
    </div>

  </div>

</template>
<style>
.bg{
  background: url('../assets/bg.jpg') ;
  background-size: 85%;
}
.bg1{
  background: url('../assets/bg2.png') no-repeat;
  background-size: 120%;
}
</style>

