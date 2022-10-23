<script lang="ts" setup>
import {nextTick, onMounted} from "vue";
import Arrow from '../components/Arrow.vue'
let marker : any
let map : any
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
const addMarker = () => {
  if (marker) {
    return;
  }
  marker = new AMap.Marker({
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
    position: [117.738828,39.149659]
  });
  marker.setMap(map);
}
const addInfo = () => {
  let name: string = '欢乐城换热站'
  // 设置label标签
  // label默认蓝框白底左上角显示，样式className为：amap-marker-label
  marker.setLabel({
    offset: new AMap.Pixel(0, 10),  //设置文本标注偏移量
    content: `<div class="info">
    <div class="w-30 h-6 bg-black text-center absolute ml-2 -mt-3">
      <text class="text-white text-base">${name}</text>
    </div>
  </div>`, //设置文本标注内容
    direction: 'right' //设置文本标注方位
  });
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

