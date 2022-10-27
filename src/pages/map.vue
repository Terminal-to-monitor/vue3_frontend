<script lang="ts" setup>
import {nextTick, onMounted} from "vue";
import {useStore} from "../store";

const store = useStore()
const getsigninfo = async () => {
 await store.getSignInfo()
}
getsigninfo()


let map : any
let markerList: any[] = []


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
          clickable:true
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
    <div class="w-30 h-6 bg-black text-center absolute ml-2 -mt-3">
      <text class="text-white text-base">${store.terminalInfo[i]['terminalName']}</text>
    </div>
  </div>`, //设置文本标注内容
    direction: 'right' //设置文本标注方位
  });
}
}

onMounted(() => {
  nextTick(() => {
    initMap()
    map.on("complete", function(){
      console.log("地图加载完成！");
      addMarker()
      addInfo()
    });
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
      <p class="text-sm font-semibold">告警未处理信息</p>
    </div>
    <div class="flex-1">
      <text class="text-red-500 text-2xl font-semibold">26</text>
      <p class="text-sm font-semibold">告警总数量</p>
    </div>
  </div>
  <div class="w-screen h-screen" id="container">

  </div>
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

