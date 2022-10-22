<script setup lang="ts">
import {ref} from "vue";
import {useStore} from "../store/";

const store = useStore()
const username = ref<string>('')
const passwd = ref<string>('')

const submit = () => {
  if(username.value === '' || passwd.value === ''){
    alert('您未输入账户或密码')
  }
  store.login(username.value, passwd.value)
}

</script>
<template id="home">
  <div class='h-screen flex flex-col'>

    <div class='h-full flex flex-col items-center justify-center'>
      <div class='flex flex-col justify-center items-center '>
        <text class='text-4xl'>场站监控系统</text>
      </div>
      <div class='mt-4 w-96 flex'>
        <input
            type="text"
            name="email"
            maxlength="10"
            class="w-full placeholder:text-lg mt-1 px-4 py-3  bg-white border shadow-sm transition duration-150 border-slate-300 placeholder-slate-400 focus:scale-105 hover:scale-105 focus:border-sky-800 focus:ring-sky-500 rounded-md sm:text-sm focus:ring-1"
            placeholder="请输入用户名"
            v-model="username"
        />

      </div>
      <div class='mt-4 w-96 flex'>
        <input
            type="password"
            name="email"
            maxlength="15"
            class="w-full placeholder:text-lg mt-1 px-4 py-3  bg-white border shadow-sm transition duration-150 border-slate-300 placeholder-slate-400 focus:scale-105 hover:scale-105 focus:border-sky-800 focus:ring-sky-500 rounded-md sm:text-sm focus:ring-1"
            placeholder="请输入密码"
            v-model="passwd"
        />
      </div>
      <button
          @click="submit"
          class='bg-blue-600 transition duration-150 ease-in-out hover:scale-105 rounded-md text-white mt-12 w-96 h-12 flex flex-row items-center justify-center'>
        <text class=' text-lg' >提交</text>
      </button>
    </div>
    <div class='h-1/6 mt-auto flex items-end'>
      <text class='w-full flex flex-col justify-center items-center mb-4 opacity-50'>
        © Copyright  | 2022
      </text>
    </div>
  </div>

</template>
