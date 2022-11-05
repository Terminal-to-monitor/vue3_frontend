<script lang="ts" setup>
import {onMounted, nextTick, ref, reactive} from "vue";
import {useStore} from "../store";
import {useRouter} from "vue-router";
import {emsg, smsg} from "../hooks/message";
import Authority from "../hooks/permissions";
const store = useStore()
const router = useRouter()

let map: any
let markerList: any[] = []
let drawer2 = ref<boolean>(false)
const direction = ref<string>('rtl')
let curName = reactive({
  id:'',
  name:''
})
let name = ref<string>('')

//派遣请求
const getsigninfo = async () => {
 await store.getSignInfo()
}
//地图初始化
const initMap = () => {
  //定义map变量，调用 TMap.Map() 构造函数创建地图
   map = new AMap.Map('container', {
    pitch:15, // 地图俯仰角度，有效范围 0 度- 83 度
    zoom:14,
    viewMode:'2D', // 地图模式
    //定义地图中心点坐标
    center:[117.743427,39.146973]
  })
}
//添加标记
const addMarker = () => {
  const {terminalInfo} = store
  terminalInfo.forEach((item,idx) => {
    markerList[idx] = new AMap.Marker({
          icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
          position:[item['longitude'],item['latitude']],
          extData: {
            id:item['id'],
            name:item['terminalName']
          }
        })

  })

  map.add(markerList)
}
//添加label
const addInfo = () => {
for (let i = 0; i < markerList.length; i++) {
  markerList[i].setLabel({
    offset: new AMap.Pixel(0, 10),  //设置文本标注偏移量
    content: `<div class="info">
    <div class="w-30 h-6 bg-black text-center absolute ml-2 -mt-3 cursor-pointer">
      <text class="text-white text-base">${store.terminalInfo[i]['terminalName']}</text>
    </div>
  </div>`, //设置文本标注内容
    direction: 'right' //设置文本标注方位
  });
}
}

//编辑场站信息
const editInfo = () => {
  markerList.forEach((item) => {
    item.on('click',()=>{
      curName.name = item.getExtData().name
      curName.id = item.getExtData().id
      name.value = item.getExtData().name
      drawer2.value = true
    },)
  })
}

const add = () =>{
  addMarker()
  addInfo()
  //addHandler()
  editInfo()
}
//发送修改请求
const changeName = async () => {
  const result = await store.changeCzName(curName.id, curName.name)
  if(result === 'ok'){
      smsg('修改成功')
      drawer2.value = false
      location.reload()
  }else{
      emsg('修改失败')
      drawer2.value = false
  }
}

//删除场站
const deleteCZ = async () =>{
 const result =  await store.deleteCZ(curName.id)
  if(result === 'ok'){
    smsg('删除成功')
    location.reload()
  }else{
    emsg('删除失败')
  }
}

const enter = () => {
  if(curName.id !== '1'){
    emsg('场站已关闭')
    return
  }
  router.push({path:'/monitoringpage',query:{
      id:curName.id
    }})
}
onMounted(() => {
  getsigninfo()
  nextTick(()=>{
    initMap()
    map.on("complete", ()=>{
       console.log("地图加载完成！")
       setTimeout(()=>{
        add()
      },1000)
     })

  })
})

</script>

<template>
<div class="overflow-hidden">
<!--  左上角提示信息-->
  <div class="translation hover:scale-105 text-center w-1/4 h-24 inline fixed z-10 bg-white mt-2 ml-10 flex  justify-around items-center rounded-xl shadow-lg">
    <div class="flex-1  ">
      <text class="text-blue-500 text-2xl font-semibold">{{store.terminalInfo.length ? store.terminalInfo.length : 0}}</text>
      <p class="text-sm font-semibold">场站数量</p>
    </div>
    <div class="flex-1">
      <text class="text-orange-500 text-2xl font-semibold">25</text>
      <p class="text-sm font-semibold">未处理信息</p>
    </div>
    <div class="flex-1">
      <text class="text-red-500 text-2xl font-semibold">26</text>
      <p class="text-sm font-semibold">告警总数量</p>
    </div>
  </div>
  <div class="w-screen h-screen" id="container">

  </div>
  <el-drawer v-model="drawer2" :direction="direction">
    <template #title>
      <h4 class="font-semibold">{{ name }}</h4>
    </template>
    <template #default>
      <div>
        <p class="text-sm text-blue-400 -mt-4">请输入要修改的新的场站名称:</p>
        <br>
        <el-input
            type="text"
            v-model="curName.name"
            :placeholder="curName.name"
        />
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="drawer2 = false">取消</el-button>
        <el-button type="danger" @click="deleteCZ" :disabled="Authority.deleteAuthority === -1">删除</el-button>
        <el-button type="primary" @click='changeName' :disabled="Authority.updateAuthority !== -1" >保存</el-button>
        <el-button class="ml-2" type="primary" @click="enter">进入</el-button>
      </div>
    </template>
  </el-drawer>
</div>
</template>
<style>
.info{
  position: relative;
  width: 0;
  height: 0;
  border: 10px solid  rgba(0,0,0,0);
  border-right: 10px solid black;
}
.amap-marker-label{
  border: none;
  background-color: rgba(0,0,0,0);
}
</style>

