<script lang="ts" setup>
import {useStore} from "../store";
import {useRoute} from "vue-router";
import {ref, onMounted} from "vue";
import {reqSwitch,reqSaveNodeInfo} from "../service/api";
import {emsg,smsg} from "../hooks/message";
import _ from 'lodash'

const store = useStore()
const route = useRoute()
let nodeInfo = ref([])
let drawer = ref<boolean>(false)
let drawer2 = ref<boolean>(false)
const direction = ref<string>('rtl')
const lines = document.getElementsByTagName('line')


//流向显示
const valveSwitch = (mode: string ) => {
    switch (mode){
      case '1' :
        lines[1].style.visibility = 'hidden'
        lines[2].style.visibility = 'hidden'
        lines[3].style.visibility = 'hidden'
        lines[4].style.visibility = 'hidden'
        lines[6].style.visibility = 'hidden'
        lines[7].style.visibility = 'hidden'
        lines[8].style.visibility = 'hidden'
        lines[9].style.visibility = 'hidden'
        break;
      case '2' :
        lines[1].style.visibility = 'hidden'
        lines[3].style.visibility = 'hidden'
        lines[8].style.visibility = 'hidden'
        break;
      case '3' :
        lines[2].style.visibility = 'hidden'
        lines[4].style.visibility = 'hidden'
        lines[9].style.visibility = 'hidden'
        break;
      case '4' :
        lines[3].style.visibility = 'hidden'
       break;
      case '5' :
        lines[4].style.visibility = 'hidden'
        break;
    }
}
//获取节点信息
const getNode = async () => {
  const result = await store.getNodeInfo(route.query.id as string)
  nodeInfo.value = result.data
  console.log(nodeInfo.value)
}
getNode()

//普通节点数据
let currentNode = ref<any>({})
//温度计节点数据
let thermometer = ref<any>({})
let wrongInfo = ref<any>([])
let timer: number

//阀门流向初始化渲染
const vShow = () => {
  const lines = document.getElementsByTagName('line')
  if(nodeInfo.value[6]['status'] === 0 ){
    for (let i = 0; i < lines.length ; i++) {
      lines[i].style.visibility = 'hidden'
    }
    return
  }
  if(nodeInfo.value[7]['status'] === 0 ){
    valveSwitch('1')
    return
  }
  if(nodeInfo.value[10]['status'] === 0){
    valveSwitch('2')
  }
  if(nodeInfo.value[11]['status'] === 0){
    valveSwitch('3')
    return
  }
  if(nodeInfo.value[12]['status'] === 0){
    valveSwitch('4')
    return
  }
  if(nodeInfo.value[13]['status'] === 0){
    valveSwitch('5')
    return
  }
}

//获取错误信息
const getWrong = () => {
  nodeInfo.value.forEach((item: any) => {
    if (item.wrong){
      wrongInfo.value.push(...item.wrong)
    }
  })
}

//动态控制流向
const showIf = (id:number,show: string) => {
 switch (id){
   case 6 :
     for (let i = 0; i < lines.length ; i++) {
       lines[i].style.visibility = show
     }
         break;
   case 7 :
     lines[1].style.visibility = show
     lines[2].style.visibility = show
     lines[3].style.visibility = show
     lines[4].style.visibility = show
     lines[6].style.visibility = show
     lines[7].style.visibility = show
     lines[8].style.visibility = show
     lines[9].style.visibility = show
        break;
   case 10 :
     lines[1].style.visibility = show
     lines[3].style.visibility = show
     lines[8].style.visibility = show
         break;
   case 11 :
     lines[2].style.visibility = show
     lines[4].style.visibility = show
     lines[9].style.visibility = show
     break;
   case 12 :
     lines[3].style.visibility = show
     break;
   case 13 :
     lines[4].style.visibility = show
     break;
 }
}
//阀门开关
const c = async(id: number) =>{
  const item: any = nodeInfo.value[id]
  item.status = item.status ===  1 ? 0 : 1
  if(id === 7 && nodeInfo.value[6]['status'] === 0 ){
      emsg('前向阀门已关闭')
      return
  }
  if(id === 10 && (nodeInfo.value[6]['status'] === 0 || nodeInfo.value[7]['status'] === 0) ){
    emsg('前向阀门已关闭')
    return
  }
  if(id === 11 && (nodeInfo.value[6]['status'] === 0 || nodeInfo.value[7]['status'] === 0 ) ){
    emsg('前向阀门已关闭')
    return
  }
  if(id === 12 && (nodeInfo.value[6]['status'] === 0 || nodeInfo.value[7]['status'] === 0  || nodeInfo.value[11]['status'] === 0 ) ){
    emsg('前向阀门已关闭')
    return
  }
  if(id === 13 && (nodeInfo.value[6]['status'] === 0 || nodeInfo.value[7]['status'] === 0 || nodeInfo.value[10]['status'] === 0 || nodeInfo.value[11]['status'] === 0 ) ){
    emsg('前向阀门已关闭')
    return
  }
  const result = await reqSwitch(item)
    if(result.data.code == 200){
      getNode()
    setTimeout(()=>{
      const status = nodeInfo.value[id]['status']
      const info = status === 1 ? '阀门已开启':'阀门已关闭'
      const show = status === 1 ? 'visible':'hidden'
      if((nodeInfo.value[12]['status'] === 0 && nodeInfo.value[13]['status'] === 0) && (id === 12 || id === 13)){
        lines[7].style.visibility = 'hidden'
        lines[4].style.visibility = 'hidden'
        lines[3].style.visibility = 'hidden'
        return
      }
      if((nodeInfo.value[12]['status'] === 1 && nodeInfo.value[13]['status'] === 1) && (id === 12 || id === 13)){
        lines[7].style.visibility = 'visible'
        lines[4].style.visibility = 'visible'
        lines[3].style.visibility = 'visible'
        return
      }
      if(nodeInfo.value[10]['status'] === 0 && nodeInfo.value[11]['status'] === 0){
        valveSwitch('1')
        return
      }
      console.log(id,status,show)
      showIf(id,show)
      smsg(info)
    },500)
    }else{
      emsg('网络错误')
    }

}

const changeState1 = _.debounce(c,500)
//编辑普通节点信息
const editInfo = (e: any) => {
  const id = e.target.getAttribute('myid')
  nodeInfo.value.forEach((item: any)=>{
    if(id == item.id){
      currentNode.value = {...item}
    }
  })
  drawer.value = true

}

//编辑温度计节点信息
const thermometerInfo = (e: any) => {
  const id = e.target.getAttribute('myid')
  nodeInfo.value.forEach((item: any)=>{
    if(id == item.id){
      thermometer.value = {...item}
    }
  })
  drawer2.value = true
}

//保存信息
const saveInfo = async (isThermometer: string) => {
  const data = isThermometer === '1' ? thermometer.value : currentNode.value
  const result = await reqSaveNodeInfo(data)
  console.log(result.data)
  if(result.data.code == 200){
    smsg('更新成功')
    drawer.value = false
    drawer2.value = false
    getNode()
  }else {
    emsg('更新失败')
    drawer.value = false
    drawer2.value = false
  }
}

onMounted(()=>{
   /*timer = setInterval(()=>{
    getNode()
  },3000)*/
  getWrong()
  vShow()
})
/*onBeforeUnmount(()=>{
  clearInterval(timer)
})*/
</script>
<template>
  <div class=" fixed w-40 h-full text-center">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>点位告警</span>
          </div>
        </template>
       <p  class='text-red-400 mt-2 ' v-for="(info,index) in wrongInfo" :key="index">{{info}}</p>
      </el-card>
  </div>
  <el-drawer v-model="drawer" :direction="direction" >
    <template #title>
      <h4 class="font-semibold">详情</h4>
    </template>
    <template #default>
      <div>
        节点名称：<el-input
          type="text"
          v-model="currentNode.name"
      />
        上限：<el-input
            type="number"
            v-model="currentNode.upperlimit"
        />
        下限：<el-input
          type="number"
          v-model="currentNode.lowerlimit"
      />
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="drawer = false">取消</el-button>
        <el-button type="primary" @click="saveInfo" >保存</el-button>
      </div>
    </template>
  </el-drawer>
  <el-drawer v-model="drawer2" :direction="direction" >
    <template #title>
      <h4 class="font-semibold">详情</h4>
    </template>
    <template #default>
      <div>
        节点名称：<el-input
          type="text"
          v-model="thermometer.name"
      />
        压力上限：<el-input
          type="number"
          v-model="thermometer.pressuremaxvalue"
      />
        压力下限：<el-input
          type="number"
          v-model="thermometer.pressureminvalue"
      />
        温度上限：<el-input
          type="number"
          v-model="thermometer.temperaturemaxvalue"
      />
        温度下限：<el-input
          type="number"
          v-model="thermometer.temperatureminvalue"
      />
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="drawer2 = false">取消</el-button>
        <el-button type="primary" @click="saveInfo('1')" >保存</el-button>
      </div>
    </template>
  </el-drawer>
  <div class="h-5/6 w-full ml-24  ">
    <svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         viewBox="0 0 1532 839.8" style="enable-background:new 0 0 1532 839.8;" xml:space="preserve">

      <g id="图层_2_00000183236611106581558810000005086829020359163574_">
	<g id="图层_1-2">

			<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="232.1195" y1="1675.5922" x2="233.7695" y2="1675.5922" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -895.4627 -57.2373)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
        <stop  offset="0.52" style="stop-color:#D8D6C3"/>
        <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>
    <rect x="746" y="174.7" class="st0" width="68.3" height="2"/>

    <linearGradient id="SVGID_00000003095335573697418690000010313640217454868901_" gradientUnits="userSpaceOnUse" x1="562.2595" y1="910.0972" x2="563.8995" y2="910.0972" gradientTransform="matrix(1 0 0 -1 177.89 1075.7345)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="739.9" y="160.3" style="fill:url(#SVGID_00000003095335573697418690000010313640217454868901_);" width="2" height="10.7"/>
    <g>
			<defs>
				<path id="SVGID_00000012444089966329138920000009805522656918344111_" d="M742.1,172.7c0,1,0.8,1.8,1.8,1.8h2.1v2.4h-2.8
					c-1.9,0-3.4-1.5-3.4-3.4v-2.2h2.3V172.7z"/>
			</defs>
      <clipPath id="SVGID_00000072256204850217558090000017560771800055727506_">
				<use xlink:href="#SVGID_00000012444089966329138920000009805522656918344111_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000072256204850217558090000017560771800055727506_);">
				<g>
					<defs>
						<rect id="SVGID_00000021803258991493162840000009876372081197880504_" x="734.7" y="166.3" width="16.2" height="15.6"/>
					</defs>
          <clipPath id="SVGID_00000073001484191330977290000010256511558566937238_">
						<use xlink:href="#SVGID_00000021803258991493162840000009876372081197880504_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000073001484191330977290000010256511558566937238_);">

							<image style="overflow:visible;enable-background:new    ;" width="35" height="34" xlink:href="data:image/png;base64,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
QGeons4BoFoAAAAASUVORK5CYII=" transform="matrix(0.48 0 0 0.48 734.5995 166.0122)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="739.7" y="171" class="st4" width="2.3" height="0.2"/>

    <linearGradient id="SVGID_00000141424509084353586200000015223269114766156948_" gradientUnits="userSpaceOnUse" x1="3017.6746" y1="559.8422" x2="3017.6746" y2="562.0522" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 179.9173 -2846.4373)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.44" style="stop-color:#DAD7C5"/>
      <stop  offset="0.52" style="stop-color:#D9D6C3"/>
      <stop  offset="0.99" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="739.7" y="171" style="fill:url(#SVGID_00000141424509084353586200000015223269114766156948_);" width="2.4" height="0.5"/>
    <rect x="739.8" y="171.5" class="st4" width="0.1" height="0.1"/>
    <rect x="740.3" y="171.5" class="st4" width="0.1" height="0.1"/>
    <rect x="740.8" y="171.5" class="st4" width="0.1" height="0.1"/>
    <rect x="741.3" y="171.5" class="st4" width="0.1" height="0.1"/>
    <rect x="741.8" y="171.5" class="st4" width="0.1" height="0.1"/>
    <rect x="745.9" y="174.5" class="st4" width="0.2" height="2.3"/>

    <linearGradient id="SVGID_00000015353864093010566850000017106977975136391831_" gradientUnits="userSpaceOnUse" x1="2802.1145" y1="101.0223" x2="2802.1145" y2="103.2322" gradientTransform="matrix(-1 0 0 1 3547.8792 73.56)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="745.5" y="174.5" style="fill:url(#SVGID_00000015353864093010566850000017106977975136391831_);" width="0.5" height="2.4"/>
    <rect x="745.5" y="174.7" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="175.2" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="175.7" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="176.2" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="176.7" class="st4" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000175306103555829800360000016041806575562952623_" gradientUnits="userSpaceOnUse" x1="380.0095" y1="1938.2272" x2="381.6495" y2="1938.2272" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -895.4627 -57.2373)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="745.9" y="322.6" style="fill:url(#SVGID_00000175306103555829800360000016041806575562952623_);" width="593.6" height="2"/>

    <linearGradient id="SVGID_00000168081327404480423340000011028901760190970544_" gradientUnits="userSpaceOnUse" x1="562.2595" y1="762.2072" x2="563.8995" y2="762.2072" gradientTransform="matrix(1 0 0 -1 177.89 1075.7345)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="739.9" y="308.2" style="fill:url(#SVGID_00000168081327404480423340000011028901760190970544_);" width="2" height="10.6"/>
    <g>
			<defs>
				<path id="SVGID_00000174565172962825562140000017484985017077271683_" d="M742.1,320.6c0,1,0.8,1.8,1.8,1.8h2.1v2.4h-2.8
					c-1.9,0-3.4-1.5-3.4-3.4v-2.2h2.3V320.6z"/>
			</defs>
      <clipPath id="SVGID_00000181785037684970940680000017231431222128301967_">
				<use xlink:href="#SVGID_00000174565172962825562140000017484985017077271683_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000181785037684970940680000017231431222128301967_);">
				<g>
					<defs>
						<rect id="SVGID_00000008128314240820856020000008171150649783735993_" x="734.7" y="314.1" width="16.2" height="15.6"/>
					</defs>
          <clipPath id="SVGID_00000017508319141475429170000014922996485202536580_">
						<use xlink:href="#SVGID_00000008128314240820856020000008171150649783735993_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000017508319141475429170000014922996485202536580_);">

							<image style="overflow:visible;enable-background:new    ;" width="35" height="34" xlink:href="data:image/png;base64,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" transform="matrix(0.48 0 0 0.48 734.5995 313.8522)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="739.7" y="318.9" class="st4" width="2.4" height="0.2"/>

    <linearGradient id="SVGID_00000150786808709580546690000017175336583407406010_" gradientUnits="userSpaceOnUse" x1="3165.5544" y1="559.8422" x2="3165.5544" y2="562.0522" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 179.9073 -2846.4272)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.44" style="stop-color:#DAD7C5"/>
      <stop  offset="0.52" style="stop-color:#D9D6C3"/>
      <stop  offset="0.99" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="739.7" y="318.9" style="fill:url(#SVGID_00000150786808709580546690000017175336583407406010_);" width="2.4" height="0.5"/>
    <rect x="739.8" y="319.4" class="st4" width="0.1" height="0.1"/>
    <rect x="740.3" y="319.4" class="st4" width="0.1" height="0.1"/>
    <rect x="740.8" y="319.4" class="st4" width="0.1" height="0.1"/>
    <rect x="741.3" y="319.4" class="st4" width="0.1" height="0.1"/>
    <rect x="741.8" y="319.3" class="st4" width="0.1" height="0.1"/>
    <rect x="745.9" y="322.4" class="st4" width="0.2" height="2.4"/>

    <linearGradient id="SVGID_00000096022694170709754970000013037654636996608678_" gradientUnits="userSpaceOnUse" x1="2802.1145" y1="248.9022" x2="2802.1145" y2="251.1222" gradientTransform="matrix(-1 0 0 1 3547.8792 73.56)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="745.5" y="322.4" style="fill:url(#SVGID_00000096022694170709754970000013037654636996608678_);" width="0.5" height="2.4"/>
    <rect x="745.5" y="322.6" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="323.1" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="323.6" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="324.1" class="st4" width="0.1" height="0.1"/>
    <rect x="745.5" y="324.6" class="st4" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000127032477665617800280000004028308613455233979_" gradientUnits="userSpaceOnUse" x1="818.1695" y1="600.4272" x2="819.8095" y2="600.4272" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>
    <rect x="818" y="180" style="fill:url(#SVGID_00000127032477665617800280000004028308613455233979_);" width="2" height="142.6"/>
    <g>
			<defs>
				<path id="SVGID_00000078734989473172681480000010376233498630600882_" d="M817.9,178.4c0-0.9-0.7-1.7-1.7-1.7h-1.9v-2.2h2.6
					c1.7,0,3.2,1.4,3.2,3.1v2h-2.2V178.4z"/>
			</defs>
      <clipPath id="SVGID_00000154401581624071879400000016537403305492538761_">
				<use xlink:href="#SVGID_00000078734989473172681480000010376233498630600882_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000154401581624071879400000016537403305492538761_);">
				<g>
					<defs>
						<rect id="SVGID_00000160151288488131268890000003714313050317205129_" x="809.3" y="169.6" width="15.7" height="15.2"/>
					</defs>
          <clipPath id="SVGID_00000001659568264268525940000012453663396874446499_">
						<use xlink:href="#SVGID_00000160151288488131268890000003714313050317205129_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000001659568264268525940000012453663396874446499_);">

							<image style="overflow:visible;enable-background:new    ;" width="34" height="33" xlink:href="data:image/png;base64,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" transform="matrix(0.48 0 0 0.48 808.9995 169.3722)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="817.9" y="179.9" class="st4" width="2.2" height="0.2"/>

    <linearGradient id="SVGID_00000078749503949357456050000010006292938771603903_" gradientUnits="userSpaceOnUse" x1="2956.5945" y1="578.3723" x2="2956.5945" y2="580.4122" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 239.5373 -2776.8171)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.44" style="stop-color:#DAD7C5"/>
      <stop  offset="0.52" style="stop-color:#D9D6C3"/>
      <stop  offset="0.99" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="817.8" y="179.6" style="fill:url(#SVGID_00000078749503949357456050000010006292938771603903_);" width="2.2" height="0.5"/>
    <rect x="819.8" y="179.5" class="st4" width="0.1" height="0.1"/>
    <rect x="819.3" y="179.5" class="st4" width="0.1" height="0.1"/>
    <rect x="818.9" y="179.5" class="st4" width="0.1" height="0.1"/>
    <rect x="818.4" y="179.5" class="st4" width="0.1" height="0.1"/>
    <rect x="817.9" y="179.5" class="st4" width="0.1" height="0.1"/>
    <rect x="814.2" y="174.6" class="st4" width="0.2" height="2.2"/>

    <linearGradient id="SVGID_00000031199062836009454000000009567716036373611139_" gradientUnits="userSpaceOnUse" x1="2783.2747" y1="40.3823" x2="2783.2747" y2="42.4222" gradientTransform="matrix(-1 0 0 1 3597.729 134.22)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="814.2" y="174.5" style="fill:url(#SVGID_00000031199062836009454000000009567716036373611139_);" width="0.5" height="2.2"/>
    <rect x="814.7" y="176.5" class="st4" width="0.1" height="0.1"/>
    <rect x="814.7" y="176" class="st4" width="0.1" height="0.1"/>
    <rect x="814.7" y="175.6" class="st4" width="0.1" height="0.1"/>
    <rect x="814.7" y="175.1" class="st4" width="0.1" height="0.1"/>
    <rect x="814.7" y="174.6" class="st4" width="0.1" height="0.1"/>
    <polygon class="st18" points="1339.6,332.4 1330.6,328.1 1330.6,331 1315,331 1315,333.7 1330.6,333.7 1330.6,336.6 		"/>
    <polygon class="st18" points="1339.6,80.8 1330.6,76.5 1330.6,79.4 1315,79.4 1315,82.2 1330.6,82.2 1330.6,85.1 		"/>

    <linearGradient id="SVGID_00000144315872887270695540000017587752622974749078_" gradientUnits="userSpaceOnUse" x1="10270.2354" y1="-3190.5376" x2="10270.2354" y2="-3188.5276" gradientTransform="matrix(6.123234e-17 -1 -1 -6.123234e-17 -2370.5881 10592.3125)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000144315872887270695540000017587752622974749078_);" d="M817.9,321.4v1.1l0,0
			c0,0.1,0.5,0.2,1.1,0.2s1.1-0.1,1.1-0.2l0,0v-1.1H817.9z"/>
    <path class="st20" d="M820,322.2c0,0,0,0.4,0.4,0.4H820V322.2z"/>
    <path class="st21" d="M817.4,322.6c0,0,0.4,0,0.4-0.4v0.4H817.4z"/>
    <rect x="817.9" y="321.9" class="st4" width="2.2" height="0.1"/>

    <linearGradient id="SVGID_00000036214347256160168990000002093208139337831068_" gradientUnits="userSpaceOnUse" x1="10270.3496" y1="-3190.5576" x2="10270.3496" y2="-3188.5676" gradientTransform="matrix(6.123234e-17 -1 -1 -6.123234e-17 -2370.5881 10592.3115)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="817.9" y="321.9" style="fill:url(#SVGID_00000036214347256160168990000002093208139337831068_);" width="2.2" height="0.1"/>
    <circle class="st4" cx="817.9" cy="322" r="0"/>

    <linearGradient id="SVGID_00000145760715349960867860000010536622550423496094_" gradientUnits="userSpaceOnUse" x1="-399.4216" y1="3308.1011" x2="-399.3517" y2="3308.1011" gradientTransform="matrix(0.3545 0.9351 0.9351 -0.3545 -2133.7717 1868.1514)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000145760715349960867860000010536622550423496094_);" cx="817.9" cy="322" r="0"/>
    <circle class="st4" cx="818.3" cy="322" r="0"/>

    <linearGradient id="SVGID_00000003091753746182306460000014405330379614940554_" gradientUnits="userSpaceOnUse" x1="-399.2716" y1="3308.4939" x2="-399.2016" y2="3308.4939" gradientTransform="matrix(0.3545 0.9351 0.9351 -0.3545 -2133.7717 1868.1514)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000003091753746182306460000014405330379614940554_);" cx="818.3" cy="322" r="0"/>
    <circle class="st4" cx="818.7" cy="322" r="0"/>

    <linearGradient id="SVGID_00000000926453923919015820000004440055936552956090_" gradientUnits="userSpaceOnUse" x1="-399.1216" y1="3308.8772" x2="-399.0616" y2="3308.8772" gradientTransform="matrix(0.3545 0.9351 0.9351 -0.3545 -2133.7717 1868.1514)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000000926453923919015820000004440055936552956090_);" cx="818.7" cy="322" r="0"/>
    <circle class="st4" cx="819.2" cy="322" r="0"/>

    <linearGradient id="SVGID_00000130623917060683160780000013370971276544761748_" gradientUnits="userSpaceOnUse" x1="-398.9816" y1="3309.2605" x2="-398.9117" y2="3309.2605" gradientTransform="matrix(0.3545 0.9351 0.9351 -0.3545 -2133.7717 1868.1514)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000130623917060683160780000013370971276544761748_);" cx="819.2" cy="322" r="0"/>
    <circle class="st4" cx="819.6" cy="322" r="0"/>

    <linearGradient id="SVGID_00000011029319114558451780000015273712798357046166_" gradientUnits="userSpaceOnUse" x1="-398.8316" y1="3309.644" x2="-398.7716" y2="3309.644" gradientTransform="matrix(0.3545 0.9351 0.9351 -0.3545 -2133.7717 1868.1514)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000011029319114558451780000015273712798357046166_);" cx="819.6" cy="322" r="0"/>
    <circle class="st4" cx="820" cy="322" r="0"/>

    <linearGradient id="SVGID_00000016064417638280727170000010332337012249968028_" gradientUnits="userSpaceOnUse" x1="-398.6816" y1="3310.0366" x2="-398.6216" y2="3310.0366" gradientTransform="matrix(0.3545 0.9351 0.9351 -0.3545 -2133.7717 1868.1514)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000016064417638280727170000010332337012249968028_);" cx="820" cy="322" r="0"/>
    <rect x="817.9" y="321.5" class="st4" width="2.2" height="0.2"/>

    <linearGradient id="SVGID_00000003805905952108958940000008928605809635004859_" gradientUnits="userSpaceOnUse" x1="-1243.6604" y1="-1650.1678" x2="-1243.6604" y2="-1648.1178" gradientTransform="matrix(6.123234e-17 -1 -1 -6.123234e-17 -830.1583 -922.2282)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="817.8" y="321.2" style="fill:url(#SVGID_00000003805905952108958940000008928605809635004859_);" width="2.2" height="0.5"/>
    <rect x="819.8" y="321.2" class="st4" width="0.1" height="0.1"/>
    <rect x="819.3" y="321.2" class="st4" width="0.1" height="0.1"/>
    <rect x="818.9" y="321.2" class="st4" width="0.1" height="0.1"/>
    <rect x="818.4" y="321.2" class="st4" width="0.1" height="0.1"/>
    <rect x="817.9" y="321.2" class="st4" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000073716599955598779390000000123980482582208165_" gradientUnits="userSpaceOnUse" x1="1045.0396" y1="593.1072" x2="1046.6794" y2="593.1072" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1044.8" y="236.2" style="fill:url(#SVGID_00000073716599955598779390000000123980482582208165_);" width="2" height="44.7"/>

    <linearGradient id="SVGID_00000154407891090252499000000007340552692326334377_" gradientUnits="userSpaceOnUse" x1="284.5195" y1="1927.8972" x2="284.7996" y2="1927.8972" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.8027 -31.3073)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1050.3" y="253.2" style="fill:url(#SVGID_00000154407891090252499000000007340552692326334377_);" width="1.7" height="0.3"/>

    <linearGradient id="SVGID_00000156555324191473815890000018040540629663209105_" gradientUnits="userSpaceOnUse" x1="284.3795" y1="1927.7572" x2="284.9395" y2="1927.7572" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.7927 -31.3173)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1050.9" y="253.1" style="fill:url(#SVGID_00000156555324191473815890000018040540629663209105_);" width="0.2" height="0.6"/>
    <rect x="1050.3" y="253.1" class="st33" width="0.6" height="0"/>
    <rect x="1050.3" y="253.5" class="st33" width="0.6" height="0"/>
    <path class="st34" d="M1051.6,253.3c0-1.2,0-2.4,0.1-3.3c0-0.4,0.1-0.8,0.1-1s0.1-0.5,0.3-0.5c0.2,0,0.2,0.2,0.3,0.5
			c0,0.3,0.1,0.7,0.1,1c0,0.9,0.1,2,0.1,3.3s0,2.4-0.1,3.3c0,0.3,0,0.7-0.1,1c0,0.3-0.1,0.5-0.3,0.5c-0.2,0-0.2-0.2-0.3-0.5
			c0-0.3-0.1-0.6-0.1-1C1051.6,255.7,1051.6,254.6,1051.6,253.3z M1052,249.6c-0.1,0.7-0.1,2-0.1,3.7s0,3,0.1,3.7
			c0.1-0.7,0.1-2,0.1-3.7S1052.1,250.3,1052,249.6z"/>
    <rect x="1051.9" y="253" class="st34" width="0.1" height="0.7"/>

    <rect x="1052.1" y="253.6" transform="matrix(0.9983 -5.826098e-02 5.826098e-02 0.9983 -13.0411 61.7284)" class="st34" width="0.1" height="1.8"/>

    <rect x="1050.5" y="251.5" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 751.5153 1290.6382)" class="st34" width="3" height="0.1"/>

    <rect x="1051.6" y="253.5" transform="matrix(0.5547 -0.8321 0.8321 0.5547 257.4185 988.0892)" class="st34" width="0.5" height="0.1"/>

    <linearGradient id="SVGID_00000097499424119292228470000014973045257903361208_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.5538" x2="284.7996" y2="1927.5538" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.852 -31.2938)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000097499424119292228470000014973045257903361208_);" points="1050.7,253.5 1050.7,253.2
			1050.7,253.2 1050.7,253.5 		"/>

    <linearGradient id="SVGID_00000128470854428011022730000005036284278742408576_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.5128" x2="284.7996" y2="1927.5128" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8591 -31.2978)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000128470854428011022730000005036284278742408576_);" points="1050.6,253.5 1050.7,253.2
			1050.7,253.2 1050.6,253.5 		"/>

    <linearGradient id="SVGID_00000169550621651782350180000014145304398627704741_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.4618" x2="284.7996" y2="1927.4618" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8464 -31.2901)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000169550621651782350180000014145304398627704741_);" points="1050.6,253.5 1050.6,253.2
			1050.6,253.2 1050.6,253.5 		"/>

    <linearGradient id="SVGID_00000147899005691238728990000001049311098241953687_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.4109" x2="284.7996" y2="1927.4109" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8419 -31.3023)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000147899005691238728990000001049311098241953687_);" points="1050.5,253.5 1050.6,253.2
			1050.6,253.2 1050.6,253.5 		"/>

    <linearGradient id="SVGID_00000081630644080897617030000012755451997560681616_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.3698" x2="284.7996" y2="1927.3698" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8491 -31.2963)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000081630644080897617030000012755451997560681616_);" points="1050.5,253.5 1050.5,253.2
			1050.5,253.2 1050.5,253.5 		"/>

    <linearGradient id="SVGID_00000108289892719301205980000018087801980174361005_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.3188" x2="284.7996" y2="1927.3188" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8464 -31.2986)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000108289892719301205980000018087801980174361005_);" points="1050.4,253.5 1050.5,253.2
			1050.5,253.2 1050.5,253.5 		"/>

    <linearGradient id="SVGID_00000099646559181189761960000000277432811067632519_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.2794" x2="284.7996" y2="1927.2794" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8535 -31.3026)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000099646559181189761960000000277432811067632519_);" points="1050.4,253.5 1050.4,253.2
			1050.5,253.2 1050.4,253.5 		"/>

    <linearGradient id="SVGID_00000176022400720758717010000008989050214072695473_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.2284" x2="284.7996" y2="1927.2284" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8507 -31.2949)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000176022400720758717010000008989050214072695473_);" points="1050.3,253.5 1050.4,253.2
			1050.4,253.2 1050.4,253.5 		"/>

    <linearGradient id="SVGID_00000071540701340108446370000001531944542372891799_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.1873" x2="284.7996" y2="1927.1873" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8578 -31.2989)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000071540701340108446370000001531944542372891799_);" points="1050.3,253.5 1050.3,253.2
			1050.4,253.2 1050.3,253.5 		"/>

    <linearGradient id="SVGID_00000132080238432310348850000014632289001609991593_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.1379" x2="284.7996" y2="1927.1379" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8552 -31.2912)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000132080238432310348850000014632289001609991593_);" points="1050.3,253.5 1050.3,253.2
			1050.3,253.2 1050.3,253.5 		"/>

    <linearGradient id="SVGID_00000119077550241082033450000018174612237809344149_" gradientUnits="userSpaceOnUse" x1="284.5196" y1="1927.087" x2="284.7996" y2="1927.087" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8424 -31.2936)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000119077550241082033450000018174612237809344149_);" points="1050.2,253.5 1050.3,253.2
			1050.3,253.2 1050.2,253.5 		"/>

    <linearGradient id="SVGID_00000013906209348032825710000018425273460478447505_" gradientUnits="userSpaceOnUse" x1="284.1595" y1="1925.665" x2="285.1595" y2="1925.675" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.8027 -31.3173)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000013906209348032825710000018425273460478447505_);" d="M1049.6,252.3h-0.2v0.5
			c-0.1,0.1-0.2,0.1-0.3,0.1h-0.9v0.9h1c0.1,0,0.2,0,0.3,0.1v0.4h0.2V252.3z"/>

    <linearGradient id="SVGID_00000041272004872390624380000007981001185752418235_" gradientUnits="userSpaceOnUse" x1="284.1596" y1="-893.024" x2="285.1596" y2="-893.014" gradientTransform="matrix(0 1 -1 0 156.9117 -31.3173)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000041272004872390624380000007981001185752418235_);" d="M1049.6,252.3h0.2v0.6
			c0.1,0.1,0.2,0.1,0.3,0.1h0.2v0.5h-0.2c-0.1,0-0.2,0-0.3,0.1v0.6h-0.2V252.3z"/>

    <linearGradient id="SVGID_00000087381492375093992030000002898372737627199140_" gradientUnits="userSpaceOnUse" x1="41.1945" y1="1792.4822" x2="41.1945" y2="1788.3221" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -744.6827 207.6927)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1043.4" y="248.4" style="fill:url(#SVGID_00000087381492375093992030000002898372737627199140_);" width="4.9" height="0.9"/>

    <linearGradient id="SVGID_00000063613427929826733460000002808881568811241104_" gradientUnits="userSpaceOnUse" x1="31.4145" y1="1792.4822" x2="31.4145" y2="1788.3221" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -744.6827 226.3827)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1043.4" y="257.3" style="fill:url(#SVGID_00000063613427929826733460000002808881568811241104_);" width="4.9" height="0.9"/>

    <linearGradient id="SVGID_00000101080179280260398430000017223866217004119724_" gradientUnits="userSpaceOnUse" x1="284.6445" y1="1924.9323" x2="284.6445" y2="1920.0522" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.8027 -31.3173)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000101080179280260398430000017223866217004119724_);" d="M1047.5,256.8c0.1-1.4,1.2-1.9,1.2-3.4
			s-1.2-2.4-1.2-3.5v-0.5h-3.4v0.5c0,1.1-1.2,2-1.2,3.5s1,2.1,1.2,3.4v0.6h3.4V256.8z"/>

    <linearGradient id="SVGID_00000134228627610396707780000010244810393672574373_" gradientUnits="userSpaceOnUse" x1="288.0295" y1="1952.0372" x2="289.6795" y2="1952.0372" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -895.4628 -57.2273)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1050.4" y="230.6" style="fill:url(#SVGID_00000134228627610396707780000010244810393672574373_);" width="12.4" height="2"/>
    <g>
			<defs>
				<path id="SVGID_00000126311331399326418610000010350744028649814696_" d="M1048.8,232.8c-1,0-1.8,0.8-1.8,1.8v2.1h-2.3v-2.8
					c0-1.9,1.5-3.4,3.4-3.4h2.2v2.4L1048.8,232.8z"/>
			</defs>
      <clipPath id="SVGID_00000067233099924082429460000001927404605123062678_">
				<use xlink:href="#SVGID_00000126311331399326418610000010350744028649814696_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000067233099924082429460000001927404605123062678_);">
				<g>
					<defs>
						<rect id="SVGID_00000150817451090757744310000003279449421058182536_" x="1039.6" y="225.4" width="15.6" height="16.2"/>
					</defs>
          <clipPath id="SVGID_00000170269623776119975790000000437094532875566731_">
						<use xlink:href="#SVGID_00000150817451090757744310000003279449421058182536_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000170269623776119975790000000437094532875566731_);">

							<image style="overflow:visible;enable-background:new    ;" width="33" height="35" xlink:href="data:image/png;base64,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
7G20Hx1ihfoAAAAASUVORK5CYII=" transform="matrix(0.48 0 0 0.48 1039.3995 225.0522)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="1050.3" y="230.4" class="st4" width="0.2" height="2.4"/>

    <linearGradient id="SVGID_00000085211677708406956150000007568655278399190926_" gradientUnits="userSpaceOnUse" x1="2587.4644" y1="813.5822" x2="2587.4644" y2="815.8022" gradientTransform="matrix(-1 0 0 1 3637.719 -583.11)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.44" style="stop-color:#DAD7C5"/>
      <stop  offset="0.52" style="stop-color:#D9D6C3"/>
      <stop  offset="0.99" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1050" y="230.4" style="fill:url(#SVGID_00000085211677708406956150000007568655278399190926_);" width="0.5" height="2.4"/>
    <rect x="1049.9" y="230.6" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="231.1" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="231.6" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="232.1" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="232.6" class="st4" width="0.1" height="0.1"/>
    <rect x="1044.6" y="236.6" class="st4" width="2.4" height="0.2"/>

    <linearGradient id="SVGID_00000062151679132785644770000009368044368200178867_" gradientUnits="userSpaceOnUse" x1="2548.3645" y1="-329.1778" x2="2548.3645" y2="-326.9677" gradientTransform="matrix(6.123234e-17 -1 -1 -6.123234e-17 717.7318 2784.8516)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="1044.6" y="236.2" style="fill:url(#SVGID_00000062151679132785644770000009368044368200178867_);" width="2.4" height="0.5"/>
    <rect x="1046.7" y="236.2" class="st4" width="0.1" height="0.1"/>
    <rect x="1046.2" y="236.2" class="st4" width="0.1" height="0.1"/>
    <rect x="1045.7" y="236.2" class="st4" width="0.1" height="0.1"/>
    <rect x="1045.2" y="236.2" class="st4" width="0.1" height="0.1"/>
    <rect x="1044.7" y="236.2" class="st4" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000091008303799818646220000017504671543376555697_" gradientUnits="userSpaceOnUse" x1="1045.0396" y1="740.3073" x2="1046.6794" y2="740.3073" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1044.8" y="89" style="fill:url(#SVGID_00000091008303799818646220000017504671543376555697_);" width="2" height="44.7"/>

    <linearGradient id="SVGID_00000045589004264074040830000016045408348575259823_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.8972" x2="137.5995" y2="1927.8972" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.8027 -31.3073)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1050.3" y="106" style="fill:url(#SVGID_00000045589004264074040830000016045408348575259823_);" width="1.7" height="0.3"/>

    <linearGradient id="SVGID_00000129888377367719862190000017229698689264541324_" gradientUnits="userSpaceOnUse" x1="137.1795" y1="1927.7572" x2="137.7395" y2="1927.7572" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.7927 -31.3173)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1050.9" y="105.9" style="fill:url(#SVGID_00000129888377367719862190000017229698689264541324_);" width="0.2" height="0.6"/>
    <rect x="1050.3" y="105.9" class="st33" width="0.6" height="0"/>
    <rect x="1050.3" y="106.3" class="st33" width="0.6" height="0"/>
    <path class="st34" d="M1051.6,106.1c0-1.2,0-2.4,0.1-3.3c0-0.4,0.1-0.8,0.1-1c0-0.2,0.1-0.5,0.3-0.5c0.2,0,0.2,0.2,0.3,0.5
			c0,0.3,0.1,0.7,0.1,1c0,0.9,0.1,2,0.1,3.3c0,1.3,0,2.4-0.1,3.3c0,0.3,0,0.7-0.1,1c0,0.3-0.1,0.5-0.3,0.5c-0.2,0-0.2-0.2-0.3-0.5
			s-0.1-0.6-0.1-1C1051.6,108.5,1051.6,107.4,1051.6,106.1z M1052,102.4c-0.1,0.7-0.1,2-0.1,3.7c0,1.7,0,3,0.1,3.7
			c0.1-0.7,0.1-2,0.1-3.7C1052.1,104.4,1052.1,103.1,1052,102.4z"/>
    <rect x="1051.9" y="105.8" class="st34" width="0.1" height="0.7"/>

    <rect x="1052" y="106.4" transform="matrix(0.9983 -5.826098e-02 5.826098e-02 0.9983 -4.4645 61.4774)" class="st34" width="0.1" height="1.8"/>

    <rect x="1050.5" y="104.3" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 898.5389 1150.3185)" class="st34" width="3" height="0.1"/>

    <rect x="1051.6" y="106.3" transform="matrix(0.5547 -0.8321 0.8321 0.5547 379.8987 922.5418)" class="st34" width="0.5" height="0.1"/>

    <linearGradient id="SVGID_00000160870677688227107710000009436322374835684737_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.548" x2="137.5995" y2="1927.548" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8442 -31.2846)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000160870677688227107710000009436322374835684737_);" points="1050.7,106.3 1050.7,106
			1050.7,106 1050.7,106.3 		"/>

    <linearGradient id="SVGID_00000000217969074136974610000007073309175087496094_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.5052" x2="137.5995" y2="1927.5052" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8497 -31.2985)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000000217969074136974610000007073309175087496094_);" points="1050.6,106.3 1050.7,106
			1050.7,106 1050.6,106.3 		"/>

    <linearGradient id="SVGID_00000040543167166358768110000005194979223109660575_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.4542" x2="137.5995" y2="1927.4542" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8469 -31.2908)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000040543167166358768110000005194979223109660575_);" points="1050.6,106.3 1050.6,106
			1050.6,106 1050.6,106.3 		"/>

    <linearGradient id="SVGID_00000041991053389917830520000004575332267445012125_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.4148" x2="137.5995" y2="1927.4148" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.854 -31.2947)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000041991053389917830520000004575332267445012125_);" points="1050.5,106.3 1050.6,106
			1050.6,106 1050.5,106.3 		"/>

    <linearGradient id="SVGID_00000098925221597573808550000014331869089936475267_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.3638" x2="137.5995" y2="1927.3638" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8413 -31.2971)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000098925221597573808550000014331869089936475267_);" points="1050.5,106.3 1050.5,106
			1050.6,106 1050.5,106.3 		"/>

    <linearGradient id="SVGID_00000021106095032831784580000001305440569792707985_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.3129" x2="137.5995" y2="1927.3129" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8386 -31.2895)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000021106095032831784580000001305440569792707985_);" points="1050.4,106.3 1050.5,106
			1050.5,106 1050.5,106.3 		"/>

    <linearGradient id="SVGID_00000084530922673568759400000011294106788389483648_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.2734" x2="137.5995" y2="1927.2734" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8457 -31.2934)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000084530922673568759400000011294106788389483648_);" points="1050.4,106.3 1050.4,106
			1050.5,106 1050.4,106.3 		"/>

    <linearGradient id="SVGID_00000168104033848163924850000002357364276834800015_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.2224" x2="137.5995" y2="1927.2224" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8429 -31.2857)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000168104033848163924850000002357364276834800015_);" points="1050.4,106.3 1050.4,106
			1050.4,106 1050.4,106.3 		"/>

    <linearGradient id="SVGID_00000164484959558235534720000001636052593787916705_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.1814" x2="137.5995" y2="1927.1814" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.85 -31.2896)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000164484959558235534720000001636052593787916705_);" points="1050.3,106.3 1050.3,106
			1050.4,106 1050.3,106.3 		"/>

    <linearGradient id="SVGID_00000022543057818967204380000013609635084025845398_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.1321" x2="137.5995" y2="1927.1321" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8474 -31.282)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000022543057818967204380000013609635084025845398_);" points="1050.3,106.3 1050.3,106
			1050.3,106 1050.3,106.3 		"/>

    <linearGradient id="SVGID_00000165943363607054657460000011801269370639100348_" gradientUnits="userSpaceOnUse" x1="137.3195" y1="1927.0795" x2="137.5995" y2="1927.0795" gradientTransform="matrix(1.420832e-07 1 1 -1.420832e-07 -876.8429 -31.2942)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000165943363607054657460000011801269370639100348_);" points="1050.2,106.3 1050.3,106
			1050.3,106 1050.2,106.3 		"/>

    <linearGradient id="SVGID_00000127744902893118330570000004798130541242919341_" gradientUnits="userSpaceOnUse" x1="136.9595" y1="1925.665" x2="137.9595" y2="1925.675" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.8027 -31.3173)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000127744902893118330570000004798130541242919341_);" d="M1049.6,105.1h-0.2v0.5
			c-0.1,0.1-0.2,0.1-0.3,0.1h-0.9v0.9h1c0.1,0,0.2,0,0.3,0.1v0.4h0.2V105.1z"/>

    <linearGradient id="SVGID_00000070110780325826829290000017449688360113963136_" gradientUnits="userSpaceOnUse" x1="136.9596" y1="-893.024" x2="137.9596" y2="-893.014" gradientTransform="matrix(0 1 -1 0 156.9117 -31.3173)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000070110780325826829290000017449688360113963136_);" d="M1049.6,105.1h0.2v0.7
			c0.1,0.1,0.2,0.1,0.3,0.1h0.2v0.5h-0.2c-0.1,0-0.2,0-0.3,0.1v0.6h-0.2V105.1z"/>

    <linearGradient id="SVGID_00000008830782108130118030000009902806254464648066_" gradientUnits="userSpaceOnUse" x1="-106.0055" y1="1792.4822" x2="-106.0055" y2="1788.3221" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -744.6827 207.6927)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1043.4" y="101.2" style="fill:url(#SVGID_00000008830782108130118030000009902806254464648066_);" width="4.9" height="0.9"/>

    <linearGradient id="SVGID_00000173852378968896642750000007517865021287837105_" gradientUnits="userSpaceOnUse" x1="-115.7855" y1="1792.4822" x2="-115.7855" y2="1788.3221" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -744.6827 226.3827)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1043.4" y="110.1" style="fill:url(#SVGID_00000173852378968896642750000007517865021287837105_);" width="4.9" height="0.9"/>

    <linearGradient id="SVGID_00000103239543440919187460000008056878342818500261_" gradientUnits="userSpaceOnUse" x1="137.4395" y1="1924.9323" x2="137.4395" y2="1920.0522" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -876.8027 -31.3173)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000103239543440919187460000008056878342818500261_);" d="M1047.5,109.6c0.1-1.4,1.2-2,1.2-3.4
			c0-1.4-1.2-2.4-1.2-3.5v-0.5h-3.4v0.5c0,1.1-1.2,2-1.2,3.5c0,1.5,1,2,1.2,3.4v0.6h3.4V109.6z"/>

    <linearGradient id="SVGID_00000175315948733653279170000005907300679479436419_" gradientUnits="userSpaceOnUse" x1="140.8295" y1="1953.8573" x2="142.4695" y2="1953.8573" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -895.4627 -57.2272)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1050.4" y="83.4" style="fill:url(#SVGID_00000175315948733653279170000005907300679479436419_);" width="16" height="2"/>
    <g>
			<defs>
				<path id="SVGID_00000134247224089860923100000006611403475761732774_" d="M1048.8,85.6c-1,0-1.8,0.8-1.8,1.8v2.1h-2.3v-2.8
					c0-1.9,1.5-3.4,3.4-3.4h2.2v2.3L1048.8,85.6z"/>
			</defs>
      <clipPath id="SVGID_00000177485417943418920870000015191331314815350966_">
				<use xlink:href="#SVGID_00000134247224089860923100000006611403475761732774_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000177485417943418920870000015191331314815350966_);">
				<g>
					<defs>
						<rect id="SVGID_00000093150734173472287090000003406547404839545251_" x="1039.6" y="78.2" width="15.6" height="16.2"/>
					</defs>
          <clipPath id="SVGID_00000133522970440198809160000013233732369604149668_">
						<use xlink:href="#SVGID_00000093150734173472287090000003406547404839545251_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000133522970440198809160000013233732369604149668_);">

							<image style="overflow:visible;enable-background:new    ;" width="33" height="34" xlink:href="data:image/png;base64,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
Ud+w7AFhKmgAAAAASUVORK5CYII=" transform="matrix(0.48 0 0 0.48 1039.3995 78.1722)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="1050.3" y="83.2" class="st4" width="0.2" height="2.4"/>

    <linearGradient id="SVGID_00000111881886574974675640000007842199050163453113_" gradientUnits="userSpaceOnUse" x1="2587.4644" y1="666.3822" x2="2587.4644" y2="668.6022" gradientTransform="matrix(-1 0 0 1 3637.719 -583.11)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.44" style="stop-color:#DAD7C5"/>
      <stop  offset="0.52" style="stop-color:#D9D6C3"/>
      <stop  offset="0.99" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1050" y="83.2" style="fill:url(#SVGID_00000111881886574974675640000007842199050163453113_);" width="0.5" height="2.4"/>
    <rect x="1049.9" y="83.4" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="83.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="84.4" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="84.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1049.9" y="85.4" class="st4" width="0.1" height="0.1"/>
    <rect x="1044.6" y="89.4" class="st4" width="2.4" height="0.2"/>

    <linearGradient id="SVGID_00000181770171441648134320000015334121318058146216_" gradientUnits="userSpaceOnUse" x1="2695.5645" y1="-329.1778" x2="2695.5645" y2="-326.9677" gradientTransform="matrix(6.123234e-17 -1 -1 -6.123234e-17 717.7318 2784.8518)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="1044.6" y="89" style="fill:url(#SVGID_00000181770171441648134320000015334121318058146216_);" width="2.4" height="0.5"/>
    <rect x="1046.7" y="89" class="st4" width="0.1" height="0.1"/>
    <rect x="1046.2" y="89" class="st4" width="0.1" height="0.1"/>
    <rect x="1045.7" y="89" class="st4" width="0.1" height="0.1"/>
    <rect x="1045.2" y="89" class="st4" width="0.1" height="0.1"/>
    <rect x="1044.7" y="89" class="st4" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000137816819694274243440000007710073146727779262_" gradientUnits="userSpaceOnUse" x1="1066.7295" y1="701.6722" x2="1068.3695" y2="701.6722" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1066.5" y="73.6" style="fill:url(#SVGID_00000137816819694274243440000007710073146727779262_);" width="2" height="152.9"/>
    <g>
			<defs>
				<path id="SVGID_00000058554341445672912520000001879182394049270146_" d="M1064.5,230.4c1,0,1.8-0.8,1.8-1.8v-2.1h2.3v2.8
					c0,1.9-1.5,3.4-3.4,3.4h-2.2v-2.4L1064.5,230.4z"/>
			</defs>
      <clipPath id="SVGID_00000013913261983359078100000013037251109206049452_">
				<use xlink:href="#SVGID_00000058554341445672912520000001879182394049270146_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000013913261983359078100000013037251109206049452_);">
				<g>
					<defs>
						<rect id="SVGID_00000047054383663729917080000009859481895066719367_" x="1058.1" y="221.5" width="15.6" height="16.2"/>
					</defs>
          <clipPath id="SVGID_00000144328262474236075750000005884006278713573251_">
						<use xlink:href="#SVGID_00000047054383663729917080000009859481895066719367_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000144328262474236075750000005884006278713573251_);">

							<image style="overflow:visible;enable-background:new    ;" width="34" height="35" xlink:href="data:image/png;base64,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" transform="matrix(0.48 0 0 0.48 1057.6395 221.2122)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="1062.8" y="230.4" class="st4" width="0.2" height="2.4"/>

    <linearGradient id="SVGID_00000023988965314280622510000013529090372176422047_" gradientUnits="userSpaceOnUse" x1="3124.5544" y1="420.2622" x2="3124.5544" y2="422.4722" gradientTransform="matrix(1 0 0 -1 -2061.51 652.9445)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.44" style="stop-color:#DAD7C5"/>
      <stop  offset="0.52" style="stop-color:#D9D6C3"/>
      <stop  offset="0.99" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1062.8" y="230.3" style="fill:url(#SVGID_00000023988965314280622510000013529090372176422047_);" width="0.5" height="2.4"/>
    <rect x="1063.3" y="232.5" class="st4" width="0.1" height="0.1"/>
    <rect x="1063.3" y="232" class="st4" width="0.1" height="0.1"/>
    <rect x="1063.3" y="231.5" class="st4" width="0.1" height="0.1"/>
    <rect x="1063.3" y="231" class="st4" width="0.1" height="0.1"/>
    <rect x="1063.3" y="230.5" class="st4" width="0.1" height="0.1"/>
    <rect x="1066.3" y="226.4" class="st4" width="2.4" height="0.2"/>

    <linearGradient id="SVGID_00000037685721054950494430000008725146866921367479_" gradientUnits="userSpaceOnUse" x1="2941.6846" y1="207.9122" x2="2941.6846" y2="210.1222" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 858.4773 -2715.0173)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="1066.3" y="226.4" style="fill:url(#SVGID_00000037685721054950494430000008725146866921367479_);" width="2.4" height="0.5"/>
    <rect x="1066.5" y="226.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1067" y="226.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1067.5" y="226.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1068" y="226.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1068.5" y="226.9" class="st4" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000005242523381498188100000014115505357452840610_" gradientUnits="userSpaceOnUse" x1="124.8995" y1="2101.9922" x2="126.5395" y2="2101.9922" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -895.4627 -57.2272)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.52" style="stop-color:#D8D6C3"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1072.3" y="67.5" style="fill:url(#SVGID_00000005242523381498188100000014115505357452840610_);" width="268.5" height="2"/>
    <g>
			<defs>
				<path id="SVGID_00000083075046423067878220000001761798651890622606_" d="M1070.5,69.7c-1,0-1.8,0.8-1.8,1.8c0,0,0,0,0,0v2.1
					h-2.3v-2.8c0-1.9,1.5-3.5,3.4-3.5c0,0,0,0,0,0h2.2v2.4H1070.5z"/>
			</defs>
      <clipPath id="SVGID_00000163781711057850885550000002250449182305669810_">
				<use xlink:href="#SVGID_00000083075046423067878220000001761798651890622606_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000163781711057850885550000002250449182305669810_);">
				<g>
					<defs>
						<rect id="SVGID_00000154385485220748680110000018015186952992989588_" x="1061.3" y="62.3" width="15.6" height="16.2"/>
					</defs>
          <clipPath id="SVGID_00000041270207116978386330000015219055315675929492_">
						<use xlink:href="#SVGID_00000154385485220748680110000018015186952992989588_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000041270207116978386330000015219055315675929492_);">

							<image style="overflow:visible;enable-background:new    ;" width="34" height="35" xlink:href="data:image/png;base64,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
rkJggg==" transform="matrix(0.48 0 0 0.48 1060.9995 61.8522)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="1072.1" y="67.3" class="st4" width="0.2" height="2.3"/>

    <linearGradient id="SVGID_00000069369954687894290170000008113450312294483337_" gradientUnits="userSpaceOnUse" x1="2565.7344" y1="650.4522" x2="2565.7344" y2="652.6722" gradientTransform="matrix(-1 0 0 1 3637.719 -583.12)">
			<stop  offset="0" style="stop-color:#DDD9CE"/>
      <stop  offset="0.44" style="stop-color:#DAD7C5"/>
      <stop  offset="0.52" style="stop-color:#D9D6C3"/>
      <stop  offset="0.99" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#969173"/>
		</linearGradient>

    <rect x="1071.7" y="67.3" style="fill:url(#SVGID_00000069369954687894290170000008113450312294483337_);" width="0.5" height="2.4"/>
    <rect x="1071.7" y="67.4" class="st4" width="0.1" height="0.1"/>
    <rect x="1071.7" y="67.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1071.7" y="68.4" class="st4" width="0.1" height="0.1"/>
    <rect x="1071.7" y="68.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1071.7" y="69.4" class="st4" width="0.1" height="0.1"/>
    <rect x="1066.3" y="73.5" class="st4" width="2.3" height="0.2"/>

    <linearGradient id="SVGID_00000141429796834045361050000014869178363818661277_" gradientUnits="userSpaceOnUse" x1="2711.4944" y1="-350.9178" x2="2711.4944" y2="-348.7078" gradientTransform="matrix(6.123234e-17 -1 -1 -6.123234e-17 717.7217 2784.8518)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="1066.3" y="73.1" style="fill:url(#SVGID_00000141429796834045361050000014869178363818661277_);" width="2.4" height="0.5"/>
    <rect x="1068.4" y="73.1" class="st4" width="0.1" height="0.1"/>
    <rect x="1067.9" y="73" class="st4" width="0.1" height="0.1"/>
    <rect x="1067.4" y="73.1" class="st4" width="0.1" height="0.1"/>
    <rect x="1066.9" y="73.1" class="st4" width="0.1" height="0.1"/>
    <rect x="1066.4" y="73" class="st4" width="0.1" height="0.1"/>
    <polygon class="st34" points="115.6,547.4 101.7,538.7 101.7,544.6 73.4,544.6 73.4,550.2 101.7,550.2 101.7,556.2 		"/>
    <polygon class="st34" points="1464.3,224.1 1449.9,215.4 1449.9,221.4 1421.6,221.4 1421.6,226.9 1449.9,226.9 1449.9,232.9 		"/>

    <linearGradient id="SVGID_00000096753023507046846020000008481573714781706647_" gradientUnits="userSpaceOnUse" x1="5792.9893" y1="-7323.5581" x2="5792.9893" y2="-7312.2778" gradientTransform="matrix(1 0 0 1 -5291.3398 7553.5195)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="432.9" y="228.5" style="fill:url(#SVGID_00000096753023507046846020000008481573714781706647_);" width="137.6" height="13.8"/>

    <linearGradient id="SVGID_00000041257864432769036100000011992265328610339773_" gradientUnits="userSpaceOnUse" x1="5561.0044" y1="-7012.8682" x2="5561.0044" y2="-7001.5781" gradientTransform="matrix(1 0 0 1 -5291.3398 7553.5195)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="135.6" y="539.2" style="fill:url(#SVGID_00000041257864432769036100000011992265328610339773_);" width="268" height="13.8"/>

    <linearGradient id="SVGID_00000142860239672498886740000011416909833511652025_" gradientUnits="userSpaceOnUse" x1="5481.5249" y1="-6985.8677" x2="5481.5249" y2="-6974.5776" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 7390.9976 -4976.2573)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="403.7" y="260.2" style="fill:url(#SVGID_00000142860239672498886740000011416909833511652025_);" width="13.8" height="490.1"/>

    <linearGradient id="SVGID_00000086691930217630281170000005666459907541226687_" gradientUnits="userSpaceOnUse" x1="5190.7749" y1="-6821.5581" x2="5190.7749" y2="-6810.2681" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 7390.9971 -4976.2676)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="568" y="166.2" style="fill:url(#SVGID_00000086691930217630281170000005666459907541226687_);" width="13.8" height="96.7"/>

    <linearGradient id="SVGID_00000160148396727082100160000015298742229357021845_" gradientUnits="userSpaceOnUse" x1="6180.2144" y1="-7418.2983" x2="6180.2144" y2="-7407.0083" gradientTransform="matrix(1 0 0 1 -5291.3398 7553.5195)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="597.9" y="133.8" style="fill:url(#SVGID_00000160148396727082100160000015298742229357021845_);" width="581.8" height="13.8"/>

    <linearGradient id="SVGID_00000074424682664389310540000001305748607809644980_" gradientUnits="userSpaceOnUse" x1="6180.2144" y1="-7271.0981" x2="6180.2144" y2="-7259.8179" gradientTransform="matrix(1 0 0 1 -5291.3398 7553.5195)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="597.9" y="281" style="fill:url(#SVGID_00000074424682664389310540000001305748607809644980_);" width="581.8" height="13.8"/>

    <linearGradient id="SVGID_00000005234238048874596730000017091348127338465421_" gradientUnits="userSpaceOnUse" x1="9449.6836" y1="-2449.7578" x2="9449.6836" y2="-2436.5776" gradientTransform="matrix(-1 0 0 1 10014.6689 2678.6199)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000005234238048874596730000017091348127338465421_);" d="M560.8,242.5h7.4c0.6,0,1-3.2,1-7.1
			s-0.5-7.1-1-7.1h-7.4V242.5z"/>
    <path class="st97" d="M565.6,228.3c0,0,2.5-0.2,2.5-2.5v2.5H565.6z"/>
    <path class="st98" d="M568.2,245c0,0-0.2-2.5-2.5-2.5h2.5V245z"/>
    <rect x="563.8" y="228.3" class="st99" width="0.8" height="14.2"/>

    <linearGradient id="SVGID_00000021841639437433619840000006583465547374724737_" gradientUnits="userSpaceOnUse" x1="9450.4297" y1="-2449.9077" x2="9450.4297" y2="-2436.8977" gradientTransform="matrix(-1 0 0 1 10014.6699 2678.6299)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="563.9" y="228.2" style="fill:url(#SVGID_00000021841639437433619840000006583465547374724737_);" width="0.7" height="14.3"/>
    <circle class="st99" cx="564.2" cy="228.6" r="0.3"/>

    <linearGradient id="SVGID_00000152263656156569427670000003964052384702311040_" gradientUnits="userSpaceOnUse" x1="106.2184" y1="2324.4858" x2="106.6484" y2="2324.4858" gradientTransform="matrix(0.94 -0.35 -0.35 -0.94 1287.1353 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000152263656156569427670000003964052384702311040_);" cx="564.2" cy="228.6" r="0.2"/>
    <circle class="st99" cx="564.2" cy="231.3" r="0.3"/>

    <linearGradient id="SVGID_00000070832942328425425490000009914006266646198678_" gradientUnits="userSpaceOnUse" x1="105.2684" y1="2321.9727" x2="105.6984" y2="2321.9727" gradientTransform="matrix(0.94 -0.35 -0.35 -0.94 1287.1353 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000070832942328425425490000009914006266646198678_);" cx="564.2" cy="231.3" r="0.2"/>
    <circle class="st99" cx="564.2" cy="234" r="0.3"/>

    <linearGradient id="SVGID_00000006689908986794075130000007348303620714146976_" gradientUnits="userSpaceOnUse" x1="104.3084" y1="2319.45" x2="104.7384" y2="2319.45" gradientTransform="matrix(0.94 -0.35 -0.35 -0.94 1287.1353 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000006689908986794075130000007348303620714146976_);" cx="564.2" cy="234" r="0.2"/>
    <circle class="st99" cx="564.2" cy="236.7" r="0.3"/>

    <linearGradient id="SVGID_00000065052263981407726940000013480679388302689210_" gradientUnits="userSpaceOnUse" x1="103.3484" y1="2316.9272" x2="103.7784" y2="2316.9272" gradientTransform="matrix(0.94 -0.35 -0.35 -0.94 1287.1353 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000065052263981407726940000013480679388302689210_);" cx="564.2" cy="236.7" r="0.2"/>
    <circle class="st99" cx="564.2" cy="239.4" r="0.3"/>

    <linearGradient id="SVGID_00000103228279697039837030000006969141140434679168_" gradientUnits="userSpaceOnUse" x1="102.3984" y1="2314.4048" x2="102.8284" y2="2314.4048" gradientTransform="matrix(0.94 -0.35 -0.35 -0.94 1287.1353 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000103228279697039837030000006969141140434679168_);" cx="564.2" cy="239.4" r="0.2"/>
    <circle class="st99" cx="564.2" cy="242.1" r="0.3"/>

    <linearGradient id="SVGID_00000148627668405824732040000007569488038646914492_" gradientUnits="userSpaceOnUse" x1="101.4384" y1="2311.8821" x2="101.8684" y2="2311.8821" gradientTransform="matrix(0.94 -0.35 -0.35 -0.94 1287.1353 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000148627668405824732040000007569488038646914492_);" cx="564.2" cy="242.1" r="0.2"/>
    <rect x="561.4" y="228.2" class="st99" width="1" height="14.2"/>

    <linearGradient id="SVGID_00000012462236935493501260000016552693043477893045_" gradientUnits="userSpaceOnUse" x1="-591.2255" y1="-1821.1578" x2="-591.2255" y2="-1807.7479" gradientTransform="matrix(-1 0 0 1 -30.441 2049.6799)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="559.3" y="228" style="fill:url(#SVGID_00000012462236935493501260000016552693043477893045_);" width="3" height="14.7"/>
    <rect x="558.9" y="229.1" class="st99" width="0.5" height="0.7"/>
    <rect x="558.9" y="232.1" class="st99" width="0.5" height="0.7"/>
    <rect x="558.9" y="235.2" class="st99" width="0.5" height="0.7"/>
    <rect x="558.9" y="238.2" class="st99" width="0.5" height="0.7"/>
    <rect x="558.9" y="241.3" class="st99" width="0.5" height="0.7"/>

    <linearGradient id="SVGID_00000152967760269620376480000013629888752042072502_" gradientUnits="userSpaceOnUse" x1="9359.3145" y1="-2253.4978" x2="9359.3145" y2="-2240.3176" gradientTransform="matrix(-1 0 0 -1 9759.7998 -1700.9255)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000152967760269620376480000013629888752042072502_);" d="M396.3,539h7.4c0.6,0,1,3.2,1,7.1
			c0,3.9-0.5,7.1-1,7.1h-7.4V539z"/>
    <path class="st97" d="M401.1,553.2c0,0,2.5,0.2,2.5,2.5v-2.5H401.1z"/>
    <path class="st98" d="M403.7,536.4c0,0-0.2,2.5-2.5,2.5h2.5V536.4z"/>
    <rect x="399.3" y="539" class="st99" width="0.8" height="14.2"/>

    <linearGradient id="SVGID_00000106137151473551666550000015832450915213439883_" gradientUnits="userSpaceOnUse" x1="9360.0596" y1="-2253.6477" x2="9360.0596" y2="-2240.6377" gradientTransform="matrix(-1 0 0 -1 9759.7998 -1700.9254)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="399.4" y="538.9" style="fill:url(#SVGID_00000106137151473551666550000015832450915213439883_);" width="0.7" height="14.3"/>
    <circle class="st99" cx="399.7" cy="552.8" r="0.3"/>

    <linearGradient id="SVGID_00000103254018973358080840000011818610922703708307_" gradientUnits="userSpaceOnUse" x1="118.7914" y1="2109.6858" x2="119.2214" y2="2109.6858" gradientTransform="matrix(0.94 0.35 -0.35 0.94 1032.2753 -1469.7162)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000103254018973358080840000011818610922703708307_);" cx="399.7" cy="552.8" r="0.2"/>
    <circle class="st99" cx="399.7" cy="550.1" r="0.3"/>

    <linearGradient id="SVGID_00000023996008473896382650000002234410862370075310_" gradientUnits="userSpaceOnUse" x1="117.8414" y1="2107.1631" x2="118.2714" y2="2107.1631" gradientTransform="matrix(0.94 0.35 -0.35 0.94 1032.2753 -1469.7162)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000023996008473896382650000002234410862370075310_);" cx="399.7" cy="550.1" r="0.2"/>
    <circle class="st99" cx="399.7" cy="547.4" r="0.3"/>

    <linearGradient id="SVGID_00000056406217936471921320000018321569549600438449_" gradientUnits="userSpaceOnUse" x1="116.8814" y1="2104.6404" x2="117.3114" y2="2104.6404" gradientTransform="matrix(0.94 0.35 -0.35 0.94 1032.2753 -1469.7162)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000056406217936471921320000018321569549600438449_);" cx="399.7" cy="547.4" r="0.2"/>
    <circle class="st99" cx="399.7" cy="544.7" r="0.3"/>

    <linearGradient id="SVGID_00000096050323398832460030000008877941665840439739_" gradientUnits="userSpaceOnUse" x1="115.9214" y1="2102.1179" x2="116.3514" y2="2102.1179" gradientTransform="matrix(0.94 0.35 -0.35 0.94 1032.2753 -1469.7162)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000096050323398832460030000008877941665840439739_);" cx="399.7" cy="544.7" r="0.2"/>
    <circle class="st99" cx="399.7" cy="542" r="0.3"/>

    <linearGradient id="SVGID_00000123423917845117632260000017824765037914509719_" gradientUnits="userSpaceOnUse" x1="114.9714" y1="2099.6047" x2="115.4014" y2="2099.6047" gradientTransform="matrix(0.94 0.35 -0.35 0.94 1032.2753 -1469.7162)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000123423917845117632260000017824765037914509719_);" cx="399.7" cy="542" r="0.2"/>
    <circle class="st99" cx="399.7" cy="539.3" r="0.3"/>

    <linearGradient id="SVGID_00000117666373570572797610000002634096187780828345_" gradientUnits="userSpaceOnUse" x1="114.0114" y1="2097.082" x2="114.4414" y2="2097.082" gradientTransform="matrix(0.94 0.35 -0.35 0.94 1032.2753 -1469.7162)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000117666373570572797610000002634096187780828345_);" cx="399.7" cy="539.3" r="0.2"/>
    <rect x="396.9" y="539" class="st99" width="1" height="14.2"/>

    <linearGradient id="SVGID_00000049207113005105310620000010083260339886061999_" gradientUnits="userSpaceOnUse" x1="-681.5855" y1="-1624.8878" x2="-681.5855" y2="-1611.4879" gradientTransform="matrix(-1 0 0 -1 -285.291 -1071.9755)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="394.8" y="538.7" style="fill:url(#SVGID_00000049207113005105310620000010083260339886061999_);" width="3" height="14.7"/>
    <rect x="394.4" y="551.7" class="st99" width="0.5" height="0.7"/>
    <rect x="394.4" y="548.6" class="st99" width="0.5" height="0.7"/>
    <rect x="394.4" y="545.6" class="st99" width="0.5" height="0.7"/>
    <rect x="394.4" y="542.5" class="st99" width="0.5" height="0.7"/>
    <rect x="394.4" y="539.5" class="st99" width="0.5" height="0.7"/>

    <linearGradient id="SVGID_00000101821079563429642800000004138501844344043672_" gradientUnits="userSpaceOnUse" x1="6160.4497" y1="-7335.3081" x2="6160.4497" y2="-7324.0278" gradientTransform="matrix(-1 0 0 1 7466.6289 7553.52)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1211" y="216.8" style="fill:url(#SVGID_00000101821079563429642800000004138501844344043672_);" width="190.4" height="13.8"/>

    <linearGradient id="SVGID_00000044864960387023812840000002311597680511829910_" gradientUnits="userSpaceOnUse" x1="9053.5146" y1="-2461.5078" x2="9053.5146" y2="-2448.3276" gradientTransform="matrix(1 0 0 1 -7839.3701 2678.6199)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000044864960387023812840000002311597680511829910_);" d="M1218.3,230.7h-7.4c-0.6,0-1-3.2-1-7.1
			s0.5-7.1,1-7.1h7.4V230.7z"/>
    <path class="st97" d="M1213.5,216.5c0,0-2.5-0.2-2.5-2.5v2.5H1213.5z"/>
    <path class="st98" d="M1211,233.3c0,0,0.2-2.5,2.5-2.5h-2.5V233.3z"/>
    <rect x="1214.5" y="216.5" class="st99" width="0.8" height="14.2"/>

    <linearGradient id="SVGID_00000096759762379757659690000010009898578885528735_" gradientUnits="userSpaceOnUse" x1="9054.2598" y1="-2461.6577" x2="9054.2598" y2="-2448.6477" gradientTransform="matrix(1 0 0 1 -7839.3701 2678.6299)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1214.5" y="216.5" style="fill:url(#SVGID_00000096759762379757659690000010009898578885528735_);" width="0.7" height="14.3"/>
    <circle class="st99" cx="1214.9" cy="216.9" r="0.3"/>

    <linearGradient id="SVGID_00000085245449720070075200000002105317160871456393_" gradientUnits="userSpaceOnUse" x1="481.2176" y1="2197.6484" x2="481.6476" y2="2197.6484" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 888.1538 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000085245449720070075200000002105317160871456393_);" cx="1214.9" cy="216.9" r="0.2"/>
    <circle class="st99" cx="1214.9" cy="219.6" r="0.3"/>

    <linearGradient id="SVGID_00000091007748920354261410000001051285324722467237_" gradientUnits="userSpaceOnUse" x1="480.2576" y1="2195.126" x2="480.6876" y2="2195.126" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 888.1538 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000091007748920354261410000001051285324722467237_);" cx="1214.9" cy="219.6" r="0.2"/>
    <circle class="st99" cx="1214.9" cy="222.3" r="0.3"/>

    <linearGradient id="SVGID_00000082331454495557852990000000142034243922001052_" gradientUnits="userSpaceOnUse" x1="479.3076" y1="2192.6125" x2="479.7276" y2="2192.6125" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 888.1538 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000082331454495557852990000000142034243922001052_);" cx="1214.9" cy="222.3" r="0.2"/>
    <circle class="st99" cx="1214.9" cy="225" r="0.3"/>

    <linearGradient id="SVGID_00000099623071962053731470000000070090347619022993_" gradientUnits="userSpaceOnUse" x1="478.3476" y1="2190.0901" x2="478.7776" y2="2190.0901" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 888.1538 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000099623071962053731470000000070090347619022993_);" cx="1214.9" cy="225" r="0.2"/>
    <circle class="st99" cx="1214.9" cy="227.7" r="0.3"/>

    <linearGradient id="SVGID_00000059287138403244303830000002954059444830185878_" gradientUnits="userSpaceOnUse" x1="477.3876" y1="2187.5674" x2="477.8176" y2="2187.5674" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 888.1538 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000059287138403244303830000002954059444830185878_);" cx="1214.9" cy="227.7" r="0.2"/>
    <circle class="st99" cx="1214.9" cy="230.4" r="0.3"/>

    <linearGradient id="SVGID_00000005956291774735821160000014805908096295675573_" gradientUnits="userSpaceOnUse" x1="476.4376" y1="2185.0449" x2="476.8576" y2="2185.0449" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 888.1538 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000005956291774735821160000014805908096295675573_);" cx="1214.9" cy="230.4" r="0.2"/>
    <rect x="1216.7" y="216.5" class="st99" width="1" height="14.2"/>

    <linearGradient id="SVGID_00000036972392428871957970000013217484363389868172_" gradientUnits="userSpaceOnUse" x1="-987.3954" y1="-1832.8978" x2="-987.3954" y2="-1819.4979" gradientTransform="matrix(1 0 0 1 2205.73 2049.6799)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1216.8" y="216.3" style="fill:url(#SVGID_00000036972392428871957970000013217484363389868172_);" width="3" height="14.7"/>
    <rect x="1219.7" y="217.3" class="st99" width="0.5" height="0.7"/>
    <rect x="1219.7" y="220.4" class="st99" width="0.5" height="0.7"/>
    <rect x="1219.7" y="223.4" class="st99" width="0.5" height="0.7"/>
    <rect x="1219.7" y="226.5" class="st99" width="0.5" height="0.7"/>
    <rect x="1219.7" y="229.5" class="st99" width="0.5" height="0.7"/>

    <linearGradient id="SVGID_00000131363345080283426340000006405648599943250308_" gradientUnits="userSpaceOnUse" x1="159.3795" y1="556.8823" x2="165.9195" y2="556.8823" gradientTransform="matrix(-1 0 0 1 1100.129 -428.61)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000131363345080283426340000006405648599943250308_);" d="M934.2,124.6h6.5v7.1
			c0,0.1-0.1,0.2-0.3,0.2h-6c-0.1,0-0.3-0.1-0.3-0.2L934.2,124.6z"/>

    <linearGradient id="SVGID_00000132795155225109943760000016934417715116396204_" gradientUnits="userSpaceOnUse" x1="933.7697" y1="725.8833" x2="941.2697" y2="725.0833" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E6E6E6"/>
      <stop  offset="0.28" style="stop-color:#666666"/>
      <stop  offset="0.74" style="stop-color:#8C8C8C"/>
      <stop  offset="0.99" style="stop-color:#B3B3B3"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000132795155225109943760000016934417715116396204_);" d="M933.9,124.8h7.3c0.1,0,0.2,0.1,0.2,0.2
			v2.5c0,0.1-0.1,0.2-0.2,0.2h-7.3c-0.1,0-0.2-0.1-0.2-0.2V125C933.7,124.9,933.8,124.8,933.9,124.8z"/>
    <path class="st129" d="M934.6,124.8h2c0.5,0,0.9,0.2,0.9,0.6v1.7c0,0.3-0.4,0.5-0.9,0.5h-2c-0.5,0-0.9-0.2-0.9-0.5v-1.7
			C933.7,125.1,934.1,124.8,934.6,124.8z"/>
    <path class="st130" d="M938.4,124.8h2c0.5,0,0.9,0.2,0.9,0.6v1.7c0,0.3-0.4,0.5-0.9,0.5h-2c-0.5,0-0.9-0.2-0.9-0.5v-1.7
			C937.5,125.1,937.9,124.8,938.4,124.8z"/>
    <path class="st131" d="M932.9,122.4h9.1l0,0v1.8c0,0.2-0.2,0.3-0.3,0.3l0,0h-8.4c-0.2,0-0.3-0.2-0.3-0.3c0,0,0,0,0,0L932.9,122.4
			L932.9,122.4z"/>
    <path :myid="nodeInfo[0].id"  style='cursor:pointer;' @click='thermometerInfo' class="st132" d="M923.2,105.6h28.5c0.3,0,0.5,0.2,0.5,0.5v15.9c0,0.3-0.2,0.5-0.5,0.5h-28.5c-0.3,0-0.5-0.2-0.5-0.5v-15.9
			C922.7,105.8,922.9,105.6,923.2,105.6z"/>
    <path :myid="nodeInfo[0].id"  style='cursor:pointer;' @click='thermometerInfo' class="st133" d="M930.8,106.9h19.5c0.3,0,0.5,0.2,0.5,0.5v13.1c0,0.3-0.2,0.5-0.5,0.5h-19.5c-0.3,0-0.5-0.2-0.5-0.5v-13.1
			C930.3,107.2,930.5,106.9,930.8,106.9z"/>
    <text transform="matrix(1 0 0 1 932.2496 113.6822)" class="st134 st135 st136">0.00</text>
    <rect x="932.2" y="115.2" class="st4" width="9.1" height="1.3"/>
    <rect x="932.2" y="117.7" class="st4" width="7.1" height="1.3"/>
    <ellipse class="st129" cx="926.6" cy="116.4" rx="1.2" ry="1"/>
    <path class="st129" d="M926.5,115.2c0.3,0,0.5,0,0.8,0.1c-0.1-0.9-0.4-1.5-0.7-1.5s-0.6,0.6-0.7,1.4
			C926.1,115.2,926.3,115.2,926.5,115.2z"/>
    <path class="st129" d="M926.5,117.6c-0.2,0-0.5,0-0.7-0.1c0.1,0.8,0.4,1.4,0.7,1.4s0.6-0.6,0.7-1.4
			C927.1,117.6,926.8,117.6,926.5,117.6z"/>
    <path class="st129" d="M925.1,116.4c0-0.3,0.1-0.5,0.3-0.7c-0.8,0.2-1.3,0.4-1.3,0.7c0,0.3,0.5,0.6,1.3,0.7
			C925.2,116.9,925.1,116.6,925.1,116.4z"/>
    <path class="st129" d="M927.7,115.6c0.2,0.2,0.3,0.5,0.3,0.7c0,0.3-0.1,0.5-0.3,0.7c0.8-0.1,1.4-0.4,1.4-0.7
			S928.6,115.8,927.7,115.6z"/>
    <circle class="st33" cx="924.8" cy="109.7" r="0.9"/>
    <circle class="st33" cx="927.8" cy="109.7" r="0.9"/>
    <path class="st137" d="M950.3,106.9h-19.5c-0.3,0-0.5,0.2-0.5,0.5c0,0,0,0,0,0v0.2h19.9v13.4h0.2c0.3,0,0.5-0.2,0.5-0.5
			c0,0,0,0,0,0v-13.1C950.9,107.2,950.6,106.9,950.3,106.9C950.3,106.9,950.3,106.9,950.3,106.9z"/>
    <text transform="matrix(1 0 0 1 926.0595 116.7523)" class="st138 st139">OK</text>

    <linearGradient id="SVGID_00000168107206474396731240000018202325709185907121_" gradientUnits="userSpaceOnUse" x1="10210.7793" y1="-2362.4978" x2="10210.7793" y2="-2356.1978" gradientTransform="matrix(0 -1 1 0 3296.8875 10343.042)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000168107206474396731240000018202325709185907121_);" d="M940.9,130.3v3.5l0,0
			c0,0.3-1.5,0.5-3.4,0.5s-3.4-0.2-3.4-0.5l0,0v-3.5H940.9z"/>
    <path class="st97" d="M934.1,132.6c0,0-0.1,1.2-1.2,1.2h1.2V132.6z"/>
    <path class="st98" d="M942.1,133.8c0,0-1.2-0.1-1.2-1.2v1.2H942.1z"/>
    <rect x="934.1" y="131.7" class="st99" width="6.8" height="0.4"/>

    <linearGradient id="SVGID_00000119103774095796064370000013241665703836428423_" gradientUnits="userSpaceOnUse" x1="10211.1543" y1="-2362.5676" x2="10211.1543" y2="-2356.3477" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 3296.8872 10343.0518)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="934.1" y="131.7" style="fill:url(#SVGID_00000119103774095796064370000013241665703836428423_);" width="6.8" height="0.3"/>
    <circle class="st99" cx="934.3" cy="131.9" r="0.1"/>

    <linearGradient id="SVGID_00000029726135597765211560000010444684336734108600_" gradientUnits="userSpaceOnUse" x1="-635.3033" y1="2507.4878" x2="-635.1033" y2="2507.4878" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000029726135597765211560000010444684336734108600_);" cx="934.3" cy="131.9" r="0.1"/>
    <circle class="st99" cx="935.6" cy="131.9" r="0.1"/>

    <linearGradient id="SVGID_00000087370590686364998660000013762971805895395217_" gradientUnits="userSpaceOnUse" x1="-635.7633" y1="2506.2827" x2="-635.5533" y2="2506.2827" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000087370590686364998660000013762971805895395217_);" cx="935.6" cy="131.9" r="0.1"/>
    <circle class="st99" cx="936.9" cy="131.9" r="0.1"/>

    <linearGradient id="SVGID_00000183222755434997659900000000147087824635203236_" gradientUnits="userSpaceOnUse" x1="-636.2233" y1="2505.0774" x2="-636.0133" y2="2505.0774" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000183222755434997659900000000147087824635203236_);" cx="936.9" cy="131.9" r="0.1"/>
    <circle class="st99" cx="938.1" cy="131.9" r="0.1"/>

    <linearGradient id="SVGID_00000072245836869462498560000011074548830430917292_" gradientUnits="userSpaceOnUse" x1="-636.6733" y1="2503.8721" x2="-636.4733" y2="2503.8721" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000072245836869462498560000011074548830430917292_);" cx="938.1" cy="131.9" r="0.1"/>
    <circle class="st99" cx="939.4" cy="131.9" r="0.1"/>

    <linearGradient id="SVGID_00000133525708075977503110000010786453115318769818_" gradientUnits="userSpaceOnUse" x1="-637.1333" y1="2502.667" x2="-636.9233" y2="2502.667" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000133525708075977503110000010786453115318769818_);" cx="939.4" cy="131.9" r="0.1"/>
    <circle class="st99" cx="940.7" cy="131.9" r="0.1"/>

    <linearGradient id="SVGID_00000080925952177351682240000013844316787397372826_" gradientUnits="userSpaceOnUse" x1="-637.5933" y1="2501.4617" x2="-637.3833" y2="2501.4617" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000080925952177351682240000013844316787397372826_);" cx="940.7" cy="131.9" r="0.1"/>
    <rect x="934.1" y="130.6" class="st99" width="6.8" height="0.5"/>

    <linearGradient id="SVGID_00000093896813431415617110000000740243298862099849_" gradientUnits="userSpaceOnUse" x1="167.7046" y1="-1733.7179" x2="167.7046" y2="-1727.3077" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 2667.9373 297.9417)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <rect x="934" y="129.5" style="fill:url(#SVGID_00000093896813431415617110000000740243298862099849_);" width="7" height="1.4"/>
    <rect x="934.5" y="129.4" class="st99" width="0.3" height="0.2"/>
    <rect x="935.9" y="129.4" class="st99" width="0.3" height="0.2"/>
    <rect x="937.4" y="129.4" class="st99" width="0.3" height="0.2"/>
    <rect x="938.8" y="129.4" class="st99" width="0.3" height="0.2"/>
    <rect x="940.3" y="129.4" class="st99" width="0.3" height="0.2"/>

    <linearGradient id="SVGID_00000093137989104628088610000001158576004241357703_" gradientUnits="userSpaceOnUse" x1="159.3795" y1="704.0822" x2="165.9195" y2="704.0822" gradientTransform="matrix(-1 0 0 1 1100.129 -428.61)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000093137989104628088610000001158576004241357703_);" d="M934.2,271.8h6.5v7.1
			c0,0.1-0.1,0.2-0.3,0.2h-6c-0.1,0-0.3-0.1-0.3-0.2L934.2,271.8z"/>

    <linearGradient id="SVGID_00000071533784823527577750000012235406846474369706_" gradientUnits="userSpaceOnUse" x1="933.7697" y1="578.6833" x2="941.2697" y2="577.8833" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E6E6E6"/>
      <stop  offset="0.28" style="stop-color:#666666"/>
      <stop  offset="0.74" style="stop-color:#8C8C8C"/>
      <stop  offset="0.99" style="stop-color:#B3B3B3"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000071533784823527577750000012235406846474369706_);" d="M933.9,272h7.3c0.1,0,0.2,0.1,0.2,0.1
			v2.5c0,0.1-0.1,0.1-0.2,0.1h-7.3c-0.1,0-0.2-0.1-0.2-0.1v-2.5C933.7,272.1,933.8,272,933.9,272z"/>
    <path class="st129" d="M934.6,272h2c0.5,0,0.9,0.2,0.9,0.6v1.7c0,0.3-0.4,0.5-0.9,0.5h-2c-0.5,0-0.9-0.2-0.9-0.5v-1.6
			C933.7,272.3,934.1,272,934.6,272z"/>
    <path class="st130" d="M938.4,272h2c0.5,0,0.9,0.2,0.9,0.6v1.7c0,0.3-0.4,0.5-0.9,0.5h-2c-0.5,0-0.9-0.2-0.9-0.5v-1.6
			C937.5,272.3,937.9,272,938.4,272z"/>
    <path class="st131" d="M932.9,269.6h9.1l0,0v1.9c0,0.2-0.2,0.3-0.3,0.3l0,0h-8.4c-0.2,0-0.3-0.2-0.3-0.3c0,0,0,0,0,0L932.9,269.6
			L932.9,269.6z"/>
    <path :myid="nodeInfo[1].id" @click='thermometerInfo' style="cursor: pointer" class="st132" d="M923.2,252.8h28.5c0.3,0,0.5,0.2,0.5,0.5v15.9c0,0.3-0.2,0.5-0.5,0.5h-28.5c-0.3,0-0.5-0.2-0.5-0.5v-15.9
			C922.7,253,922.9,252.8,923.2,252.8z"/>
    <path :myid="nodeInfo[1].id" @click='thermometerInfo' style="cursor: pointer" class="st133" d="M930.8,254.1h19.5c0.3,0,0.5,0.2,0.5,0.5v13.1c0,0.3-0.2,0.5-0.5,0.5h-19.5c-0.3,0-0.5-0.2-0.5-0.5v-13.1
			C930.3,254.4,930.5,254.1,930.8,254.1z"/>
    <text transform="matrix(1 0 0 1 932.2496 260.8823)" class="st134 st135 st136">0.00</text>
    <rect x="932.2" y="262.4" class="st4" width="9.1" height="1.3"/>
    <rect x="932.2" y="264.9" class="st4" width="7.1" height="1.3"/>
    <ellipse class="st129" cx="926.6" cy="263.6" rx="1.2" ry="1"/>
    <path class="st129" d="M926.5,262.4c0.3,0,0.5,0,0.8,0.1c-0.1-0.9-0.4-1.4-0.7-1.4s-0.6,0.6-0.7,1.4
			C926.1,262.4,926.3,262.4,926.5,262.4z"/>
    <path class="st129" d="M926.5,264.8c-0.2,0-0.5,0-0.7-0.1c0.1,0.8,0.4,1.4,0.7,1.4s0.6-0.6,0.7-1.5
			C927.1,264.8,926.8,264.8,926.5,264.8z"/>
    <path class="st129" d="M925.1,263.6c0-0.3,0.1-0.5,0.3-0.7c-0.8,0.1-1.3,0.4-1.3,0.7c0,0.3,0.5,0.6,1.3,0.7
			C925.2,264.1,925.1,263.8,925.1,263.6z"/>
    <path class="st129" d="M927.7,262.8c0.2,0.2,0.3,0.5,0.3,0.7c0,0.3-0.1,0.5-0.3,0.7c0.8-0.1,1.4-0.4,1.4-0.7
			C929.1,263.3,928.6,263,927.7,262.8z"/>
    <circle class="st33" cx="924.8" cy="256.9" r="0.9"/>
    <circle class="st33" cx="927.8" cy="256.9" r="0.9"/>
    <path class="st137" d="M950.3,254.1h-19.5c-0.3,0-0.5,0.2-0.5,0.5c0,0,0,0,0,0v0.2h19.9v13.4h0.2c0.3,0,0.5-0.2,0.5-0.5
			c0,0,0,0,0,0v-13.1C950.9,254.4,950.6,254.1,950.3,254.1C950.3,254.1,950.3,254.1,950.3,254.1z"/>
    <text transform="matrix(1 0 0 1 926.0595 263.9522)" class="st138 st139">OK</text>

    <linearGradient id="SVGID_00000030480342648558371860000016813732661583925681_" gradientUnits="userSpaceOnUse" x1="10063.5898" y1="-2362.4978" x2="10063.5898" y2="-2356.1978" gradientTransform="matrix(0 -1 1 0 3296.8875 10343.042)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000030480342648558371860000016813732661583925681_);" d="M940.9,277.4v3.5l0,0
			c0,0.3-1.5,0.5-3.4,0.5s-3.4-0.2-3.4-0.5l0,0v-3.5H940.9z"/>
    <path class="st97" d="M934.1,279.8c0,0-0.1,1.2-1.2,1.2h1.2V279.8z"/>
    <path class="st98" d="M942.1,281c0,0-1.2-0.1-1.2-1.2v1.2H942.1z"/>
    <rect x="934.1" y="278.9" class="st99" width="6.8" height="0.4"/>

    <linearGradient id="SVGID_00000057859814543052123400000015976212493295605171_" gradientUnits="userSpaceOnUse" x1="10063.9541" y1="-2362.5676" x2="10063.9541" y2="-2356.3477" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 3296.8875 10343.0518)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="934.1" y="278.9" style="fill:url(#SVGID_00000057859814543052123400000015976212493295605171_);" width="6.8" height="0.3"/>
    <circle class="st99" cx="934.3" cy="279.1" r="0.1"/>

    <linearGradient id="SVGID_00000082366480256811581790000004118143011547138724_" gradientUnits="userSpaceOnUse" x1="-497.6633" y1="2456.2803" x2="-497.4633" y2="2456.2803" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000082366480256811581790000004118143011547138724_);" cx="934.3" cy="279.1" r="0.1"/>
    <circle class="st99" cx="935.6" cy="279.1" r="0.1"/>

    <linearGradient id="SVGID_00000006687515624125243320000000776350059239061159_" gradientUnits="userSpaceOnUse" x1="-498.1234" y1="2455.075" x2="-497.9133" y2="2455.075" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000006687515624125243320000000776350059239061159_);" cx="935.6" cy="279.1" r="0.1"/>
    <circle class="st99" cx="936.9" cy="279.1" r="0.1"/>

    <linearGradient id="SVGID_00000128454701059738852560000002125605841156409730_" gradientUnits="userSpaceOnUse" x1="-498.5833" y1="2453.8699" x2="-498.3734" y2="2453.8699" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000128454701059738852560000002125605841156409730_);" cx="936.9" cy="279.1" r="0.1"/>
    <circle class="st99" cx="938.1" cy="279.1" r="0.1"/>

    <linearGradient id="SVGID_00000072999248629813475010000016016793351460714906_" gradientUnits="userSpaceOnUse" x1="-499.0333" y1="2452.6646" x2="-498.8333" y2="2452.6646" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000072999248629813475010000016016793351460714906_);" cx="938.1" cy="279.1" r="0.1"/>
    <circle class="st99" cx="939.4" cy="279.1" r="0.1"/>

    <linearGradient id="SVGID_00000067937373888578220040000009333937436870635688_" gradientUnits="userSpaceOnUse" x1="-499.4933" y1="2451.4592" x2="-499.2933" y2="2451.4592" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000067937373888578220040000009333937436870635688_);" cx="939.4" cy="279.1" r="0.1"/>
    <circle class="st99" cx="940.7" cy="279.1" r="0.1"/>

    <linearGradient id="SVGID_00000047029824549203294450000009203320065294733495_" gradientUnits="userSpaceOnUse" x1="-499.9533" y1="2450.2539" x2="-499.7433" y2="2450.2539" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 3065.678 1615.5179)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000047029824549203294450000009203320065294733495_);" cx="940.7" cy="279.1" r="0.1"/>
    <rect x="934.1" y="277.8" class="st99" width="6.8" height="0.5"/>

    <linearGradient id="SVGID_00000040564121341544056750000002614966014248427136_" gradientUnits="userSpaceOnUse" x1="20.5045" y1="-1733.7179" x2="20.5045" y2="-1727.3077" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 2667.9373 297.9417)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <rect x="934" y="276.7" style="fill:url(#SVGID_00000040564121341544056750000002614966014248427136_);" width="7" height="1.4"/>
    <rect x="934.5" y="276.6" class="st99" width="0.4" height="0.2"/>
    <rect x="935.9" y="276.6" class="st99" width="0.4" height="0.2"/>
    <rect x="937.4" y="276.6" class="st99" width="0.4" height="0.2"/>
    <rect x="938.8" y="276.6" class="st99" width="0.4" height="0.2"/>
    <rect x="940.3" y="276.6" class="st99" width="0.4" height="0.2"/>

    <linearGradient id="SVGID_00000079473244284005739600000009705357811525251511_" gradientUnits="userSpaceOnUse" x1="740.3195" y1="745.2322" x2="741.4595" y2="745.2322" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="740.3" y="101" style="fill:url(#SVGID_00000079473244284005739600000009705357811525251511_);" width="1.1" height="10.9"/>
    <g>
			<defs>
				<rect id="SVGID_00000048479537612458641210000003876913089195283106_" x="740.3" y="105" width="1.1" height="6.9"/>
			</defs>
      <clipPath id="SVGID_00000063591788319681209180000006169286501023036550_">
				<use xlink:href="#SVGID_00000048479537612458641210000003876913089195283106_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000063591788319681209180000006169286501023036550_);">

					<linearGradient id="SVGID_00000088120310568097387490000011256769829942857404_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="747.2465" x2="741.4695" y2="747.2465" gradientTransform="matrix(1 0 0 -1 -3.353583e-02 857.1281)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
            <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
            <stop  offset="0.38" style="stop-color:#808080"/>
            <stop  offset="0.94" style="stop-color:#CCCCCC"/>
            <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000088120310568097387490000011256769829942857404_);" points="740.3,109.8 740.3,109.8
					741.4,110 741.4,110 				"/>

        <linearGradient id="SVGID_00000115486414563971791610000007140196695032119986_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="747.0541" x2="741.4695" y2="747.0541" gradientTransform="matrix(1 0 0 -1 -3.451205e-02 857.1269)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000115486414563971791610000007140196695032119986_);" points="740.3,110 740.3,110
					741.4,110.1 741.4,110.2 				"/>

        <linearGradient id="SVGID_00000049927579082691791940000000472211863498250153_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="746.8618" x2="741.4695" y2="746.8618" gradientTransform="matrix(1 0 0 -1 -3.536704e-02 857.1258)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000049927579082691791940000000472211863498250153_);" points="740.3,110.2 740.3,110.1
					741.4,110.3 741.4,110.4 				"/>

        <linearGradient id="SVGID_00000014601923885745042790000005980934100533975741_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="746.6678" x2="741.4695" y2="746.6678" gradientTransform="matrix(1 0 0 -1 -3.634327e-02 857.1246)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000014601923885745042790000005980934100533975741_);" points="740.3,110.4 740.3,110.3
					741.4,110.5 741.4,110.6 				"/>

        <linearGradient id="SVGID_00000160156927013355314040000002249511476445696431_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="746.4771" x2="741.4695" y2="746.4771" gradientTransform="matrix(1 0 0 -1 -2.744585e-02 857.1252)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000160156927013355314040000002249511476445696431_);" points="740.3,110.6 740.3,110.5
					741.4,110.7 741.4,110.8 				"/>

        <linearGradient id="SVGID_00000085221418139025805020000005043341798430158527_" gradientUnits="userSpaceOnUse" x1="740.3094" y1="746.2848" x2="741.4695" y2="746.2848" gradientTransform="matrix(1 0 0 -1 -2.837190e-02 857.1241)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000085221418139025805020000005043341798430158527_);" points="740.3,110.8 740.3,110.7
					741.4,110.9 741.4,111 				"/>

        <linearGradient id="SVGID_00000031925602462584575690000016285513140685577870_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="746.0925" x2="741.4695" y2="746.0925" gradientTransform="matrix(1 0 0 -1 -2.934813e-02 857.123)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000031925602462584575690000016285513140685577870_);" points="740.3,111 740.3,110.9
					741.4,111.1 741.4,111.2 				"/>

        <linearGradient id="SVGID_00000070079577279275879770000004306894691134291129_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="745.8984" x2="741.4695" y2="745.8984" gradientTransform="matrix(1 0 0 -1 -2.025438e-02 857.1319)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000070079577279275879770000004306894691134291129_);" points="740.3,111.2 740.3,111.1
					741.5,111.3 741.4,111.4 				"/>

        <linearGradient id="SVGID_00000116951305681147978340000017573054486344529032_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="745.7061" x2="741.4695" y2="745.7061" gradientTransform="matrix(1 0 0 -1 -2.123061e-02 857.1307)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000116951305681147978340000017573054486344529032_);" points="740.3,111.4 740.3,111.3
					741.5,111.5 741.4,111.5 				"/>

        <linearGradient id="SVGID_00000094578833037576752640000010629387116034042018_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="745.5137" x2="741.4695" y2="745.5137" gradientTransform="matrix(1 0 0 -1 -2.214663e-02 857.1296)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000094578833037576752640000010629387116034042018_);" points="740.3,111.5 740.3,111.5
					741.5,111.7 741.4,111.7 				"/>

        <linearGradient id="SVGID_00000039815629711261825670000001172019708589370289_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="745.3214" x2="741.4695" y2="745.3214" gradientTransform="matrix(1 0 0 -1 -2.312286e-02 857.1285)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000039815629711261825670000001172019708589370289_);" points="740.3,111.7 740.3,111.7
					741.5,111.9 741.4,111.9 				"/>
			</g>
		</g>

    <linearGradient id="SVGID_00000062873585403380293560000009007843272925425793_" gradientUnits="userSpaceOnUse" x1="722.6995" y1="736.3122" x2="758.9895" y2="736.3122" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000062873585403380293560000009007843272925425793_);" points="759,117.8 756.2,118.9
			725.6,118.9 722.7,117.8 722.7,111.9 759,111.9 		"/>
    <rect x="759" y="112.7" class="st174" width="2.2" height="4.3"/>

    <linearGradient id="SVGID_00000011722433330799810170000004842089827667789444_" gradientUnits="userSpaceOnUse" x1="761.1395" y1="741.8422" x2="764.9796" y2="741.8422" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="761.1" y="101.9" style="fill:url(#SVGID_00000011722433330799810170000004842089827667789444_);" width="3.8" height="15.8"/>
    <polygon class="st34" points="761.9,107.9 744.1,105.6 744.1,101.9 761.9,101.9 		"/>
    <polygon class="st176" points="746.3,105.9 744.1,105.6 744.1,101.9 745.5,101.9 		"/>

    <linearGradient id="SVGID_00000122721841465098467920000002542200103467343001_" gradientUnits="userSpaceOnUse" x1="737.7695" y1="747.3022" x2="744.0695" y2="747.3022" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="737.8" y="101.9" style="fill:url(#SVGID_00000122721841465098467920000002542200103467343001_);" width="6.3" height="4.9"/>
    <path class="st33" d="M740.9,102.4c-4.1,0-7.9-0.1-10.8-0.3c-1.4-0.1-2.5-0.2-3.3-0.3c-1-0.1-1.7-0.3-1.7-0.9s0.7-0.8,1.7-0.9
			c0.8-0.1,1.9-0.2,3.3-0.3c2.9-0.2,6.7-0.3,10.8-0.3s7.9,0.1,10.8,0.3c1.4,0.1,2.5,0.2,3.3,0.3c1,0.1,1.7,0.3,1.7,0.9
			s-0.7,0.8-1.7,0.9c-0.8,0.1-1.9,0.2-3.3,0.3C748.8,102.3,745,102.4,740.9,102.4z M728.6,100.9c2.4,0.2,6.6,0.4,12.4,0.4
			s9.9-0.2,12.4-0.4c-2.4-0.2-6.6-0.4-12.4-0.4S731,100.7,728.6,100.9z"/>
    <rect x="739.9" y="100.9" class="st33" width="2.2" height="0.3"/>
    <polygon class="st33" points="742.1,101.2 742.1,100.9 748,100.2 748,100.5 		"/>

    <rect x="735" y="95.9" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 600.0674 830.3701)" class="st33" width="0.3" height="9.9"/>

    <rect x="741.5" y="100.6" transform="matrix(0.5547 -0.8321 0.8321 0.5547 245.8456 662.3063)" class="st33" width="0.3" height="1.7"/>

    <linearGradient id="SVGID_00000141449237740882548530000006998461552001376136_" gradientUnits="userSpaceOnUse" x1="760.9796" y1="738.6172" x2="765.1395" y2="738.6172" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="761" y="112.7" style="fill:url(#SVGID_00000141449237740882548530000006998461552001376136_);" width="4.2" height="0.8"/>

    <linearGradient id="SVGID_00000000929146389073663800000003449096531427825290_" gradientUnits="userSpaceOnUse" x1="761.1395" y1="738.1572" x2="764.9796" y2="738.1572" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#D88B2E"/>
      <stop  offset="5.000000e-02" style="stop-color:#EF9F35"/>
      <stop  offset="0.38" style="stop-color:#D38529"/>
      <stop  offset="0.94" style="stop-color:#EF9F35"/>
      <stop  offset="1" style="stop-color:#DB8B2C"/>
		</linearGradient>

    <rect x="761.1" y="113.5" style="fill:url(#SVGID_00000000929146389073663800000003449096531427825290_);" width="3.8" height="0.2"/>

    <linearGradient id="SVGID_00000158717807905393682460000014378870619109641405_" gradientUnits="userSpaceOnUse" x1="761.1395" y1="734.6272" x2="764.9796" y2="734.6272" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#D88B2E"/>
      <stop  offset="5.000000e-02" style="stop-color:#EF9F35"/>
      <stop  offset="0.38" style="stop-color:#D38529"/>
      <stop  offset="0.94" style="stop-color:#EF9F35"/>
      <stop  offset="1" style="stop-color:#DB8B2C"/>
		</linearGradient>

    <rect x="761.1" y="117" style="fill:url(#SVGID_00000158717807905393682460000014378870619109641405_);" width="3.8" height="0.2"/>

    <linearGradient id="SVGID_00000057148685210766193450000008597702145472098957_" gradientUnits="userSpaceOnUse" x1="760.9796" y1="735.0872" x2="765.1395" y2="735.0872" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="761" y="116.2" style="fill:url(#SVGID_00000057148685210766193450000008597702145472098957_);" width="4.2" height="0.8"/>

    <linearGradient id="SVGID_00000107584508386758821800000009075453317422856118_" gradientUnits="userSpaceOnUse" x1="722.6995" y1="733.3922" x2="758.9895" y2="733.3922" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#D88B2E"/>
      <stop  offset="5.000000e-02" style="stop-color:#EF9F35"/>
      <stop  offset="0.38" style="stop-color:#D38529"/>
      <stop  offset="0.94" style="stop-color:#EF9F35"/>
      <stop  offset="1" style="stop-color:#DB8B2C"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000107584508386758821800000009075453317422856118_);" points="759,117.8 756.2,118.9
			725.6,118.9 722.7,117.8 		"/>
    <path class="st34" d="M760.3,162.5h-3c-0.1,0-0.2-0.1-0.2-0.2c0,0,0,0,0,0v-10.8l3.5,1v9.8C760.5,162.5,760.4,162.5,760.3,162.5z"
    />
    <rect x="756.2" y="152.4" class="st174" width="0.8" height="2.8"/>
    <path class="st34" d="M721.6,162.3h3.1c0.1,0,0.2-0.1,0.2-0.2c0,0,0,0,0,0v-10.8l-3.5,1v9.8C721.3,162.2,721.4,162.3,721.6,162.3
			C721.6,162.3,721.6,162.3,721.6,162.3z"/>
    <rect x="724.8" y="152.2" class="st174" width="0.8" height="2.8"/>

    <linearGradient id="SVGID_00000096744782029769072980000004453576649274464640_" gradientUnits="userSpaceOnUse" x1="740.3195" y1="598.1522" x2="741.4595" y2="598.1522" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="740.3" y="248.1" style="fill:url(#SVGID_00000096744782029769072980000004453576649274464640_);" width="1.1" height="10.9"/>
    <g>
			<defs>
				<rect id="SVGID_00000114766823547022982410000011139664026862365116_" x="740.3" y="252.1" width="1.1" height="6.9"/>
			</defs>
      <clipPath id="SVGID_00000101782575737811194710000007676889647999313559_">
				<use xlink:href="#SVGID_00000114766823547022982410000011139664026862365116_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000101782575737811194710000007676889647999313559_);">

					<linearGradient id="SVGID_00000108993596497953181020000016525762790862665619_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="600.1768" x2="741.4695" y2="600.1768" gradientTransform="matrix(1 0 0 -1 -3.132474e-02 857.1206)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
            <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
            <stop  offset="0.38" style="stop-color:#808080"/>
            <stop  offset="0.94" style="stop-color:#CCCCCC"/>
            <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000108993596497953181020000016525762790862665619_);" points="740.3,256.9 740.3,256.8
					741.4,257 741.4,257.1 				"/>

        <linearGradient id="SVGID_00000183938681238448195910000009923577210707028870_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="599.9844" x2="741.4695" y2="599.9844" gradientTransform="matrix(1 0 0 -1 -3.227086e-02 857.1195)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000183938681238448195910000009923577210707028870_);" points="740.3,257.1 740.3,257
					741.4,257.2 741.4,257.3 				"/>

        <linearGradient id="SVGID_00000052081004272997541270000006820375194169380498_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="599.7905" x2="741.4695" y2="599.7905" gradientTransform="matrix(1 0 0 -1 -3.322702e-02 857.1284)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000052081004272997541270000006820375194169380498_);" points="740.3,257.3 740.3,257.2
					741.5,257.4 741.4,257.5 				"/>

        <linearGradient id="SVGID_00000140696791684229994750000000603211414183710344_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="599.5981" x2="741.4695" y2="599.5981" gradientTransform="matrix(1 0 0 -1 -3.417314e-02 857.1273)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000140696791684229994750000000603211414183710344_);" points="740.3,257.5 740.3,257.4
					741.4,257.6 741.4,257.6 				"/>

        <linearGradient id="SVGID_00000147913799412308031510000005423874448278573466_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="599.4058" x2="741.4695" y2="599.4058" gradientTransform="matrix(1 0 0 -1 -3.514937e-02 857.1262)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000147913799412308031510000005423874448278573466_);" points="740.3,257.6 740.3,257.6
					741.4,257.8 741.4,257.8 				"/>

        <linearGradient id="SVGID_00000090999635434840481610000000290200246582546097_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="599.2134" x2="741.4695" y2="599.2134" gradientTransform="matrix(1 0 0 -1 -3.606497e-02 857.1251)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000090999635434840481610000000290200246582546097_);" points="740.3,257.8 740.3,257.8
					741.4,258 741.4,258 				"/>

        <linearGradient id="SVGID_00000045604330453363035820000014938069657652400801_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="599.0211" x2="741.4695" y2="599.0211" gradientTransform="matrix(1 0 0 -1 -3.701110e-02 857.124)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000045604330453363035820000014938069657652400801_);" points="740.3,258 740.3,258
					741.4,258.2 741.4,258.2 				"/>

        <linearGradient id="SVGID_00000173856040019855153380000009318665683478882485_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="598.8271" x2="741.4695" y2="598.8271" gradientTransform="matrix(1 0 0 -1 -2.797797e-02 857.1228)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000173856040019855153380000009318665683478882485_);" points="740.3,258.2 740.3,258.2
					741.5,258.4 741.4,258.4 				"/>

        <linearGradient id="SVGID_00000144323292099080315360000005942250661594921136_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="598.6348" x2="741.4695" y2="598.6348" gradientTransform="matrix(1 0 0 -1 -2.892410e-02 857.1217)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000144323292099080315360000005942250661594921136_);" points="740.3,258.4 740.3,258.4
					741.5,258.6 741.4,258.6 				"/>

        <linearGradient id="SVGID_00000078026171073398451050000016250660248560741032_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="598.4424" x2="741.4695" y2="598.4424" gradientTransform="matrix(1 0 0 -1 -2.983970e-02 857.1205)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000078026171073398451050000016250660248560741032_);" points="740.3,258.6 740.3,258.6
					741.5,258.7 741.4,258.8 				"/>

        <linearGradient id="SVGID_00000047751030163564861900000013758124091134385559_" gradientUnits="userSpaceOnUse" x1="740.3095" y1="598.2501" x2="741.4695" y2="598.2501" gradientTransform="matrix(1 0 0 -1 -3.078583e-02 857.1194)">
					<stop  offset="0" style="stop-color:#B3B3B3"/>
          <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
          <stop  offset="0.38" style="stop-color:#808080"/>
          <stop  offset="0.94" style="stop-color:#CCCCCC"/>
          <stop  offset="1" style="stop-color:#999999"/>
				</linearGradient>
        <polygon style="fill:url(#SVGID_00000047751030163564861900000013758124091134385559_);" points="740.3,258.8 740.3,258.7
					741.5,258.9 741.4,259 				"/>
			</g>
		</g>

    <linearGradient id="SVGID_00000141439813447099343400000009094728954212341394_" gradientUnits="userSpaceOnUse" x1="722.6995" y1="589.2422" x2="758.9895" y2="589.2422" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000141439813447099343400000009094728954212341394_);" points="759,264.8 756.2,265.9
			725.6,265.9 722.7,264.8 722.7,259 759,259 		"/>
    <rect x="759" y="259.8" class="st174" width="2.2" height="4.3"/>

    <linearGradient id="SVGID_00000137829957768434765070000009732599647568546750_" gradientUnits="userSpaceOnUse" x1="761.1395" y1="594.7722" x2="764.9796" y2="594.7722" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="761.1" y="249" style="fill:url(#SVGID_00000137829957768434765070000009732599647568546750_);" width="3.8" height="15.8"/>
    <polygon class="st34" points="761.9,255 744.1,252.7 744.1,249 761.9,249 		"/>
    <polygon class="st176" points="746.3,253 744.1,252.7 744.1,249 745.5,249 		"/>

    <linearGradient id="SVGID_00000003805113473297614890000006931633174657956483_" gradientUnits="userSpaceOnUse" x1="737.7695" y1="600.2322" x2="744.0695" y2="600.2322" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="737.8" y="249" style="fill:url(#SVGID_00000003805113473297614890000006931633174657956483_);" width="6.3" height="4.9"/>
    <path class="st33" d="M740.9,249.5c-4.1,0-7.9-0.1-10.8-0.3c-1.4-0.1-2.5-0.2-3.3-0.3c-1-0.1-1.7-0.3-1.7-0.9s0.7-0.8,1.7-0.9
			c0.8-0.1,1.9-0.2,3.3-0.3c2.9-0.2,6.7-0.3,10.8-0.3s7.9,0.1,10.8,0.3c1.4,0.1,2.5,0.2,3.3,0.3c1,0.1,1.7,0.3,1.7,0.9
			s-0.7,0.8-1.7,0.9c-0.8,0.1-1.9,0.2-3.3,0.3C748.8,249.4,745,249.5,740.9,249.5z M728.6,248c2.4,0.2,6.6,0.4,12.4,0.4
			s9.9-0.2,12.4-0.4c-2.4-0.2-6.6-0.4-12.4-0.4S731,247.8,728.6,248z"/>
    <rect x="739.9" y="247.9" class="st33" width="2.2" height="0.3"/>
    <polygon class="st33" points="742.1,248.2 742.1,247.9 748,247.2 748,247.6 		"/>

    <rect x="735" y="242.9" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 453.1698 970.5698)" class="st33" width="0.3" height="9.9"/>

    <rect x="741.5" y="247.7" transform="matrix(0.5547 -0.8321 0.8321 0.5547 123.4761 727.7963)" class="st33" width="0.3" height="1.7"/>

    <linearGradient id="SVGID_00000095323869947798047680000005510905799597662354_" gradientUnits="userSpaceOnUse" x1="760.9796" y1="591.5472" x2="765.1395" y2="591.5472" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="761" y="259.8" style="fill:url(#SVGID_00000095323869947798047680000005510905799597662354_);" width="4.2" height="0.8"/>

    <linearGradient id="SVGID_00000013871319949836821330000003582879112001884833_" gradientUnits="userSpaceOnUse" x1="761.1395" y1="591.0872" x2="764.9796" y2="591.0872" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#D88B2E"/>
      <stop  offset="5.000000e-02" style="stop-color:#EF9F35"/>
      <stop  offset="0.38" style="stop-color:#D38529"/>
      <stop  offset="0.94" style="stop-color:#EF9F35"/>
      <stop  offset="1" style="stop-color:#DB8B2C"/>
		</linearGradient>

    <rect x="761.1" y="260.5" style="fill:url(#SVGID_00000013871319949836821330000003582879112001884833_);" width="3.8" height="0.1"/>

    <linearGradient id="SVGID_00000080920555395352252250000005358814707987036051_" gradientUnits="userSpaceOnUse" x1="761.1395" y1="587.5573" x2="764.9796" y2="587.5573" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#D88B2E"/>
      <stop  offset="5.000000e-02" style="stop-color:#EF9F35"/>
      <stop  offset="0.38" style="stop-color:#D38529"/>
      <stop  offset="0.94" style="stop-color:#EF9F35"/>
      <stop  offset="1" style="stop-color:#DB8B2C"/>
		</linearGradient>

    <rect x="761.1" y="264.1" style="fill:url(#SVGID_00000080920555395352252250000005358814707987036051_);" width="3.8" height="0.1"/>

    <linearGradient id="SVGID_00000076601428039311964210000003307756804315446971_" gradientUnits="userSpaceOnUse" x1="760.9796" y1="588.0072" x2="765.1395" y2="588.0072" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>

    <rect x="761" y="263.3" style="fill:url(#SVGID_00000076601428039311964210000003307756804315446971_);" width="4.2" height="0.8"/>

    <linearGradient id="SVGID_00000083796503773755951980000002654004030719481786_" gradientUnits="userSpaceOnUse" x1="722.6995" y1="586.3222" x2="758.9895" y2="586.3222" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#D88B2E"/>
      <stop  offset="5.000000e-02" style="stop-color:#EF9F35"/>
      <stop  offset="0.38" style="stop-color:#D38529"/>
      <stop  offset="0.94" style="stop-color:#EF9F35"/>
      <stop  offset="1" style="stop-color:#DB8B2C"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000083796503773755951980000002654004030719481786_);" points="759,264.8 756.2,265.9
			725.6,265.9 722.7,264.8 		"/>
    <path class="st34" d="M760.3,309.6h-3c-0.1,0-0.2-0.1-0.2-0.2c0,0,0,0,0,0v-10.8l3.5,1v9.8C760.5,309.5,760.4,309.6,760.3,309.6z"
    />
    <rect x="756.2" y="299.5" class="st174" width="0.8" height="2.8"/>
    <path class="st34" d="M721.6,309.3h3.1c0.1,0,0.2-0.1,0.2-0.2c0,0,0,0,0,0v-10.8l-3.5,1v9.8C721.3,309.3,721.4,309.3,721.6,309.3z
			"/>
    <rect x="724.8" y="299.2" class="st174" width="0.8" height="2.8"/>
    <g>
			<defs>
				<path id="SVGID_00000131334750709591013130000015461104264291150525_" d="M426,242.3c-5.4,0-8.3,3.2-8.3,8.5v11.1h-13.9v-15
					c0-10.1,8.2-18.3,18.3-18.3h11.8v13.7H426z"/>
			</defs>
      <clipPath id="SVGID_00000088103999590033279850000001968541786898534827_">
				<use xlink:href="#SVGID_00000131334750709591013130000015461104264291150525_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000088103999590033279850000001968541786898534827_);">
				<g>
					<defs>
						<rect id="SVGID_00000065064508503692557900000005419275037109636523_" x="398.7" y="223.5" width="40.1" height="43.4"/>
					</defs>
          <clipPath id="SVGID_00000003085244833049173100000006869039247074351290_">
						<use xlink:href="#SVGID_00000065064508503692557900000005419275037109636523_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000003085244833049173100000006869039247074351290_);">

							<image style="overflow:visible;enable-background:new    ;" width="84" height="92" xlink:href="data:image/png;base64,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
z8JJvgAAAABJRU5ErkJggg==" transform="matrix(0.48 0 0 0.48 398.5995 223.1322)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="403.5" y="260.8" class="st206" width="14.1" height="1"/>

    <linearGradient id="SVGID_00000067206787400640666460000017485159397232366005_" gradientUnits="userSpaceOnUse" x1="2412.0845" y1="-8232.5771" x2="2412.0845" y2="-8219.2676" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 8636.3174 -2151.8774)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="403.2" y="258.7" style="fill:url(#SVGID_00000067206787400640666460000017485159397232366005_);" width="14.6" height="3"/>
    <rect x="416.1" y="258.4" class="st206" width="0.7" height="0.5"/>
    <rect x="413.1" y="258.4" class="st206" width="0.7" height="0.5"/>
    <rect x="410" y="258.4" class="st206" width="0.7" height="0.5"/>
    <rect x="407" y="258.4" class="st206" width="0.7" height="0.5"/>
    <rect x="404" y="258.4" class="st206" width="0.7" height="0.5"/>
    <rect x="433.9" y="228.3" class="st206" width="1" height="14.1"/>

    <linearGradient id="SVGID_00000109723970630477117540000015525773394915382439_" gradientUnits="userSpaceOnUse" x1="2308.5645" y1="-7686.4478" x2="2308.5645" y2="-7673.1382" gradientTransform="matrix(1 0 0 -1 -1875.28 -7444.2856)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="431.8" y="228" style="fill:url(#SVGID_00000109723970630477117540000015525773394915382439_);" width="3" height="14.6"/>
    <rect x="431.4" y="229.1" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="232.1" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="235.1" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="238.2" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="241.2" class="st206" width="0.5" height="0.7"/>
    <g>
			<defs>
				<path id="SVGID_00000145041401684309174430000012764310708367207613_" d="M590.3,147.6c-5.4,0-8.4,3.2-8.4,8.5v11.1H568v-15
					c0-10.1,8.2-18.4,18.3-18.4c0,0,0,0,0,0h11.8v13.8H590.3z"/>
			</defs>
      <clipPath id="SVGID_00000129182086005301106030000008282025700771060403_">
				<use xlink:href="#SVGID_00000145041401684309174430000012764310708367207613_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000129182086005301106030000008282025700771060403_);">
				<g>
					<defs>
						<rect id="SVGID_00000108994723334128561210000017855855844590994612_" x="563" y="128.8" width="40.1" height="43.4"/>
					</defs>
          <clipPath id="SVGID_00000143592082256793087400000013725799184513979800_">
						<use xlink:href="#SVGID_00000108994723334128561210000017855855844590994612_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000143592082256793087400000013725799184513979800_);">

							<image style="overflow:visible;enable-background:new    ;" width="85" height="91" xlink:href="data:image/png;base64,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" transform="matrix(0.48 0 0 0.48 562.7595 128.5722)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="567.7" y="166.2" class="st206" width="14.2" height="1"/>

    <linearGradient id="SVGID_00000093156232450793275030000017966766454624241547_" gradientUnits="userSpaceOnUse" x1="2317.4045" y1="-8068.3276" x2="2317.4045" y2="-8055.0181" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 8636.3174 -2151.8772)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="567.5" y="164" style="fill:url(#SVGID_00000093156232450793275030000017966766454624241547_);" width="14.6" height="3"/>
    <rect x="580.4" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="577.3" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="574.3" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="571.3" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="568.2" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="598.2" y="133.6" class="st206" width="1" height="14.2"/>

    <linearGradient id="SVGID_00000116233506634548997440000014328458374112556218_" gradientUnits="userSpaceOnUse" x1="2472.8145" y1="-7591.7681" x2="2472.8145" y2="-7578.4575" gradientTransform="matrix(1 0 0 -1 -1875.28 -7444.2856)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="596" y="133.4" style="fill:url(#SVGID_00000116233506634548997440000014328458374112556218_);" width="3" height="14.6"/>
    <rect x="595.7" y="134.4" class="st206" width="0.5" height="0.7"/>
    <rect x="595.7" y="137.4" class="st206" width="0.5" height="0.7"/>
    <rect x="595.7" y="140.5" class="st206" width="0.5" height="0.7"/>
    <rect x="595.7" y="143.5" class="st206" width="0.5" height="0.7"/>
    <rect x="595.7" y="146.5" class="st206" width="0.5" height="0.7"/>
    <circle style="cursor:pointer;" @click='editInfo' :myid="nodeInfo[5].id" class="st132" cx="270.9" cy="523.2" r="11"/>
    <circle style="cursor:pointer;" @click='editInfo' :myid="nodeInfo[5].id" class="st213" cx="270.9" cy="523.2" r="9.5"/>
    <path class="st214" d="M261.7,523.7c0-5.3,4.3-9.5,9.5-9.5c3,0,5.8,1.4,7.6,3.8c-2.9-4.4-8.8-5.6-13.2-2.7s-5.6,8.8-2.7,13.2
			c0.1,0.2,0.2,0.3,0.3,0.5C262.3,527.3,261.7,525.5,261.7,523.7z"/>
    <circle class="st134" cx="270.8" cy="523.1" r="0.9"/>
    <path class="st134" d="M271.3,522.7h-1l0.3-5.5c0-0.1,0.1-0.2,0.2-0.2l0,0c0.1,0,0.2,0.1,0.2,0.2L271.3,522.7z"/>
    <path class="st215" d="M262.9,524.9l0.9-0.2c-0.6-2.8,0.5-5.7,2.8-7.4l-0.5-0.7c-1.5,1.1-2.5,2.7-3,4.4
			C262.7,522.4,262.7,523.7,262.9,524.9z"/>
    <path class="st34" d="M266.4,516.4l0.5,0.8c1-0.6,2.1-1,3.2-1.1c1.6-0.2,3.3,0.2,4.7,1.1l0.5-0.8
			C272.6,514.7,269.2,514.7,266.4,516.4L266.4,516.4z"/>
    <path class="st216" d="M275.6,516.5l-0.6,0.7c2.3,1.7,3.4,4.6,2.8,7.4l0.9,0.2C279.3,521.7,278.1,518.5,275.6,516.5z"/>
    <rect x="266.6" y="528" class="st215" width="3.4" height="1.2"/>
    <rect x="271.7" y="528" class="st217" width="3.4" height="1.2"/>
    <path class="st132" d="M263.6,532.7h14.7c0.8,0,1.4,0.6,1.4,1.4l0,0c0,0.8-0.6,1.4-1.4,1.4h-14.7c-0.8,0-1.4-0.6-1.4-1.4l0,0
			C262.2,533.3,262.8,532.7,263.6,532.7z"/>

    <linearGradient id="SVGID_00000000904053625255108600000005220115684497936519_" gradientUnits="userSpaceOnUse" x1="269.0495" y1="314.3772" x2="272.7595" y2="314.3772" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="269" y="535.5" style="fill:url(#SVGID_00000000904053625255108600000005220115684497936519_);" width="3.7" height="3.7"/>

    <linearGradient id="SVGID_00000182524363992596515470000011183535025763397011_" gradientUnits="userSpaceOnUse" x1="1442.2495" y1="230.6122" x2="1442.2495" y2="227.0822" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="1.000000e-02" style="stop-color:#6B747D"/>
      <stop  offset="0.46" style="stop-color:#70787A"/>
      <stop  offset="0.51" style="stop-color:#9AB9BB"/>
      <stop  offset="0.95" style="stop-color:#A0B8BC"/>
      <stop  offset="1" style="stop-color:#747C7F"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000182524363992596515470000011183535025763397011_);" d="M313.9,513.5h-1
			c-0.2,0.7-0.3,1.4-0.2,2.2c0,0.8,0.2,1.5,0.5,2.2c0.1,0,1,0.1,1,0.1L313.9,513.5z"/>

    <linearGradient id="SVGID_00000133493800897434130640000012984483953827951769_" gradientUnits="userSpaceOnUse" x1="1424.1545" y1="230.3722" x2="1424.1545" y2="227.4322" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="1.000000e-02" style="stop-color:#6B747D"/>
      <stop  offset="0.28" style="stop-color:#70787A"/>
      <stop  offset="0.33" style="stop-color:#9AB9BB"/>
      <stop  offset="0.95" style="stop-color:#A0B8BC"/>
      <stop  offset="1" style="stop-color:#747C7F"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000133493800897434130640000012984483953827951769_);" d="M331.9,513.6h-1l0.1,2l-0.3,2.5l1-0.1
			c0.3-0.8,0.4-1.6,0.4-2.4C332.2,514.8,332.1,514.2,331.9,513.6z"/>

    <linearGradient id="SVGID_00000119077120756549830250000010307717666063320463_" gradientUnits="userSpaceOnUse" x1="1433.2495" y1="231.6422" x2="1433.2495" y2="227.0622" gradientTransform="matrix(-1 0 0 -1 1755.629 744.7944)">
			<stop  offset="0" style="stop-color:#F7674F"/>
      <stop  offset="0.32" style="stop-color:#FF5237"/>
      <stop  offset="0.43" style="stop-color:#FF6D48"/>
      <stop  offset="0.58" style="stop-color:#FD5936"/>
      <stop  offset="0.81" style="stop-color:#D94B37"/>
      <stop  offset="1" style="stop-color:#C04138"/>
		</linearGradient>

    <rect x="315" y="512.4" style="fill:url(#SVGID_00000119077120756549830250000010307717666063320463_);" width="14.8" height="6"/>

    <linearGradient id="SVGID_00000129922217327267377720000012425525055513589688_" gradientUnits="userSpaceOnUse" x1="1433.1876" y1="231.1124" x2="1433.2577" y2="226.8223" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#F7674F"/>
      <stop  offset="0.32" style="stop-color:#FF5237"/>
      <stop  offset="0.43" style="stop-color:#FF6D48"/>
      <stop  offset="0.58" style="stop-color:#FD5936"/>
      <stop  offset="0.81" style="stop-color:#D94B37"/>
      <stop  offset="1" style="stop-color:#C04138"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000129922217327267377720000012425525055513589688_);" d="M314.1,513.3h16.6
			c0.3,0.7,0.4,1.5,0.3,2.3c0,1-0.2,2-0.5,2.9h-16.3c-0.3-0.9-0.4-1.8-0.5-2.8C313.7,514.9,313.8,514,314.1,513.3z"/>

    <linearGradient id="SVGID_00000043435980624751465950000018072975385481049480_" gradientUnits="userSpaceOnUse" x1="1428.8995" y1="217.4872" x2="1430.8695" y2="217.4872" gradientTransform="matrix(-1 0 0 -1 1755.629 744.7844)">
			<stop  offset="0" style="stop-color:#F25039"/>
      <stop  offset="1" style="stop-color:#F74A39"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000043435980624751465950000018072975385481049480_);" d="M326.4,528.6h-1.3
			c-0.2,0-0.3-0.2-0.3-0.3v-2c0-0.2,0.2-0.3,0.3-0.3h1.3c0.2,0,0.3,0.2,0.3,0.3v2C326.7,528.5,326.6,528.6,326.4,528.6z"/>

    <linearGradient id="SVGID_00000021101949035928303280000011310654576832681877_" gradientUnits="userSpaceOnUse" x1="1436.2896" y1="217.1272" x2="1437.4895" y2="217.1272" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7845)">
			<stop  offset="0" style="stop-color:#B12C1B"/>
      <stop  offset="1" style="stop-color:#BA3828"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000021101949035928303280000011310654576832681877_);" d="M319,528.6h-0.5c-0.2,0-0.3-0.1-0.3-0.3
			V527c0-0.2,0.1-0.3,0.3-0.3h0.5c0.2,0,0.3,0.1,0.3,0.3v1.3C319.3,528.5,319.2,528.6,319,528.6z"/>

    <linearGradient id="SVGID_00000059285403213773915970000007987315749630856632_" gradientUnits="userSpaceOnUse" x1="1435.7996" y1="218.8172" x2="1437.8895" y2="218.8172" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7845)">
			<stop  offset="0" style="stop-color:#A83B27"/>
      <stop  offset="0.14" style="stop-color:#AD3B27"/>
      <stop  offset="1" style="stop-color:#C63B26"/>
		</linearGradient>

    <rect x="317.7" y="525" style="fill:url(#SVGID_00000059285403213773915970000007987315749630856632_);" width="2.1" height="1.9"/>

    <linearGradient id="SVGID_00000006690267977106070150000011330477434007742655_" gradientUnits="userSpaceOnUse" x1="1431.4395" y1="206.6622" x2="1434.9296" y2="206.6622" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7945)">
			<stop  offset="0" style="stop-color:#707D85"/>
      <stop  offset="0.1" style="stop-color:#AFC0C7"/>
      <stop  offset="0.23" style="stop-color:#7C8685"/>
      <stop  offset="0.39" style="stop-color:#BFD6E6"/>
      <stop  offset="0.55" style="stop-color:#96A7B7"/>
      <stop  offset="0.66" style="stop-color:#A3BBC7"/>
      <stop  offset="0.78" style="stop-color:#7B8F9A"/>
      <stop  offset="0.85" style="stop-color:#D1DDE0"/>
      <stop  offset="0.88" style="stop-color:#F7FFFF"/>
      <stop  offset="0.93" style="stop-color:#BAC0C0"/>
      <stop  offset="0.98" style="stop-color:#7C807F"/>
      <stop  offset="1" style="stop-color:#636766"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000006690267977106070150000011330477434007742655_);" d="M322.9,539.9h-1.1
			c-0.6,0-1.1-0.5-1.1-1.1l0,0v-2.5l0,0h3.5l0,0v2.4C324.2,539.4,323.6,539.9,322.9,539.9C322.9,539.9,322.9,539.9,322.9,539.9z"/>
    <path class="st227" d="M325.4,534.3v1.3l-1.4,0.8c-0.8,0.3-1.7,0.4-2.6,0.2c-0.7-0.2-1.4-0.5-2-1v-1.2l0.6-0.5h4.8L325.4,534.3z"
    />

    <linearGradient id="SVGID_00000117656204372683933030000016032611764587409080_" gradientUnits="userSpaceOnUse" x1="1429.8795" y1="217.1172" x2="1436.5494" y2="217.1172" gradientTransform="matrix(-1 0 0 -1 1755.629 744.7844)">
			<stop  offset="0" style="stop-color:#F56E51"/>
      <stop  offset="9.000000e-02" style="stop-color:#F07553"/>
      <stop  offset="0.14" style="stop-color:#E74926"/>
      <stop  offset="0.19" style="stop-color:#FF4B32"/>
      <stop  offset="0.7" style="stop-color:#FC4A2E"/>
      <stop  offset="0.75" style="stop-color:#DB5941"/>
      <stop  offset="0.81" style="stop-color:#BF4D33"/>
      <stop  offset="1" style="stop-color:#CF4032"/>
		</linearGradient>

    <rect x="319.1" y="525.9" style="fill:url(#SVGID_00000117656204372683933030000016032611764587409080_);" width="6.7" height="3.5"/>
    <path class="st229" d="M325.7,529.4c0.4,0,1,1.5,1,1.5h-8.4c0.1-0.6,0.4-1.1,0.8-1.5H325.7z"/>

    <linearGradient id="SVGID_00000065778098637480270600000007460388551377706127_" gradientUnits="userSpaceOnUse" x1="1430.8695" y1="210.7922" x2="1435.5795" y2="210.7922" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7944)">
			<stop  offset="0" style="stop-color:#707D85"/>
      <stop  offset="0.1" style="stop-color:#AFC0C7"/>
      <stop  offset="0.23" style="stop-color:#7C8685"/>
      <stop  offset="0.39" style="stop-color:#BFD6E6"/>
      <stop  offset="0.55" style="stop-color:#96A7B7"/>
      <stop  offset="0.66" style="stop-color:#A3BBC7"/>
      <stop  offset="0.78" style="stop-color:#7B8F9A"/>
      <stop  offset="0.85" style="stop-color:#D1DDE0"/>
      <stop  offset="0.88" style="stop-color:#F7FFFF"/>
      <stop  offset="0.93" style="stop-color:#BAC0C0"/>
      <stop  offset="0.98" style="stop-color:#7C807F"/>
      <stop  offset="1" style="stop-color:#636766"/>
		</linearGradient>

    <rect x="320.1" y="533.7" style="fill:url(#SVGID_00000065778098637480270600000007460388551377706127_);" width="4.7" height="0.6"/>

    <linearGradient id="SVGID_00000178197587627881673280000010741616993511354253_" gradientUnits="userSpaceOnUse" x1="1430.8894" y1="210.4922" x2="1435.6195" y2="210.4922" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#707D85"/>
      <stop  offset="0.1" style="stop-color:#AFC0C7"/>
      <stop  offset="0.23" style="stop-color:#7C8685"/>
      <stop  offset="0.39" style="stop-color:#BFD6E6"/>
      <stop  offset="0.55" style="stop-color:#96A7B7"/>
      <stop  offset="0.66" style="stop-color:#A3BBC7"/>
      <stop  offset="0.78" style="stop-color:#7B8F9A"/>
      <stop  offset="0.85" style="stop-color:#D1DDE0"/>
      <stop  offset="0.88" style="stop-color:#F7FFFF"/>
      <stop  offset="0.93" style="stop-color:#BAC0C0"/>
      <stop  offset="0.98" style="stop-color:#7C807F"/>
      <stop  offset="1" style="stop-color:#636766"/>
		</linearGradient>

    <ellipse style="fill:url(#SVGID_00000178197587627881673280000010741616993511354253_);" cx="322.4" cy="534.3" rx="2.4" ry="0.6"/>
    <path class="st232" d="M322.4,536.8c0.9,0,1.7-0.2,1.7-0.4c0,0,0,0,0,0C324.2,536.7,323.4,536.8,322.4,536.8
			c-1,0.1-1.8-0.1-1.8-0.3l0,0C320.8,536.6,321.5,536.8,322.4,536.8z"/>
    <path class="st233" d="M325.4,534.3v1.3c0,0-0.8,0.9-1.4,0.8v-1.4C324.3,534.6,324.8,534.3,325.4,534.3z"/>
    <path class="st234" d="M320.8,535.1c-0.4-0.4-0.9-0.7-1.5-0.7v1.2c0.3,0.5,0.9,0.9,1.5,0.9V535.1z"/>
    <path class="st235" d="M324,535c-1.1-0.2-2.1-0.2-3.2,0.1v1.4c1,0.3,2.1,0.3,3.1-0.1L324,535z"/>

    <linearGradient id="SVGID_00000139276508045709259990000008307194153154800297_" gradientUnits="userSpaceOnUse" x1="1428.6796" y1="213.0322" x2="1437.6096" y2="213.0322" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#FF5D2A"/>
      <stop  offset="0.17" style="stop-color:#FF613A"/>
      <stop  offset="0.22" style="stop-color:#EE5744"/>
      <stop  offset="0.25" style="stop-color:#FF5A36"/>
      <stop  offset="0.7" style="stop-color:#FE5E3A"/>
      <stop  offset="0.73" style="stop-color:#FB5932"/>
      <stop  offset="0.79" style="stop-color:#FE603B"/>
      <stop  offset="1" style="stop-color:#FF5F39"/>
		</linearGradient>
    <path @click="editInfo" :myid="nodeInfo[15].id" style="cursor:pointer;fill:url(#SVGID_00000139276508045709259990000008307194153154800297_);" d="M325.5,533.7h-6.2
			c-0.7,0-1.3-0.6-1.3-1.3v-0.6c0-1.1,0.9-2,2-2h4.9c1.1,0,2,0.9,2,2v0.4C327,533,326.3,533.7,325.5,533.7L325.5,533.7L325.5,533.7z
			"/>

    <linearGradient id="SVGID_00000076577442836953155280000009789180098642655669_" gradientUnits="userSpaceOnUse" x1="1425.8495" y1="225.2722" x2="1440.4294" y2="225.2722" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#C8D9E3"/>
      <stop  offset="0.51" style="stop-color:#AEC0C4"/>
      <stop  offset="1" style="stop-color:#98ACAB"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000076577442836953155280000009789180098642655669_);" cx="322.5" cy="519.5" r="7.3"/>

    <linearGradient id="SVGID_00000106136064511952510010000012538317124965956515_" gradientUnits="userSpaceOnUse" x1="1426.2996" y1="225.2722" x2="1439.9795" y2="225.2722" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#D6E8F4"/>
      <stop  offset="1" style="stop-color:#D1E3EF"/>
		</linearGradient>
    <circle @click="editInfo" :myid="nodeInfo[15].id" style="cursor:pointer;fill:url(#SVGID_00000106136064511952510010000012538317124965956515_);" cx="322.5" cy="519.5" r="6.8"/>

    <linearGradient id="SVGID_00000004520622337701518570000009270617279659253173_" gradientUnits="userSpaceOnUse" x1="1427.5396" y1="225.3322" x2="1438.8595" y2="225.3322" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#9FAFBC"/>
      <stop  offset="0.49" style="stop-color:#BBC9D4"/>
      <stop  offset="1" style="stop-color:#D4E1E9"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000004520622337701518570000009270617279659253173_);" cx="322.4" cy="519.5" r="5.7"/>

    <linearGradient id="SVGID_00000062155036988668453880000014037481611861555850_" gradientUnits="userSpaceOnUse" x1="1428.2195" y1="225.3322" x2="1438.1694" y2="225.3322" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#D1E1EE"/>
      <stop  offset="1" style="stop-color:#CCDEEC"/>
		</linearGradient>
    <circle  style="cursor:pointer;fill:url(#SVGID_00000062155036988668453880000014037481611861555850_);" cx="322.4" cy="519.5" r="5"/>

    <linearGradient id="SVGID_00000066485376641446146080000010059906155210667669_" gradientUnits="userSpaceOnUse" x1="1429.1895" y1="225.3322" x2="1437.1995" y2="225.3322" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#2F3D3D"/>
      <stop  offset="0.65" style="stop-color:#647476"/>
      <stop  offset="1" style="stop-color:#7B8D8F"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000066485376641446146080000010059906155210667669_);" cx="322.4" cy="519.5" r="4"/>

    <linearGradient id="SVGID_00000132796433898943288050000011524217787400690873_" gradientUnits="userSpaceOnUse" x1="1429.3894" y1="225.3322" x2="1436.9995" y2="225.3322" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#5C6668"/>
      <stop  offset="0.65" style="stop-color:#949494"/>
      <stop  offset="1" style="stop-color:#ADA9A8"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000132796433898943288050000011524217787400690873_);" cx="322.4" cy="519.5" r="3.8"/>

    <linearGradient id="SVGID_00000110443246731189097230000016954488949177627784_" gradientUnits="userSpaceOnUse" x1="1430.0995" y1="225.2922" x2="1436.3295" y2="225.2922" gradientTransform="matrix(-1 0 0 -1 1755.629 744.7945)">
			<stop  offset="0" style="stop-color:#189D40"/>
      <stop  offset="0.67" style="stop-color:#28DB5D"/>
      <stop  offset="1" style="stop-color:#2EF469"/>
		</linearGradient>

    <rect x="319.3" y="517.5" style="fill:url(#SVGID_00000110443246731189097230000016954488949177627784_);" width="6.2" height="4.1"/>
    <text transform="matrix(1 0 0 1 319.8595 519.6423)" class="st244 st245 st246">0.000</text>
    <text transform="matrix(1 0 0 1 321.8495 521.3322)" class="st244 st245 st247">MpR</text>
    <circle class="st132" cx="1235.3" cy="201" r="11"/>
    <circle :myid='nodeInfo[5].id' @click="editInfo" style="cursor: pointer" class="st213" cx="1235.3" cy="201" r="9.5"/>
    <path class="st214" d="M1226.1,201.5c0-5.3,4.3-9.5,9.5-9.5c3,0,5.8,1.4,7.6,3.8c-3-4.3-9-5.3-13.3-2.3s-5.3,9-2.3,13.3l0,0
			C1226.7,205.2,1226.1,203.3,1226.1,201.5z"/>
    <circle class="st134" cx="1235.3" cy="201" r="0.9"/>
    <path class="st134" d="M1235.7,200.5h-1l0.3-5.6c0-0.1,0.1-0.2,0.2-0.2l0,0c0.1,0,0.2,0.1,0.2,0.2L1235.7,200.5z"/>
    <path class="st215" d="M1227.3,202.8l0.9-0.2c-0.6-2.8,0.5-5.7,2.8-7.4l-0.5-0.7C1228,196.4,1226.7,199.6,1227.3,202.8z"/>
    <path class="st34" d="M1230.9,194.3l0.5,0.8c2.4-1.5,5.5-1.5,7.9,0l0.5-0.8C1237,192.6,1233.6,192.6,1230.9,194.3z"/>
    <path class="st216" d="M1240,194.4l-0.5,0.7c2.3,1.7,3.4,4.6,2.8,7.4l0.9,0.2C1243.7,199.5,1242.5,196.3,1240,194.4z"/>
    <rect x="1231" y="205.8" class="st215" width="3.4" height="1.2"/>
    <rect x="1236.1" y="205.8" class="st217" width="3.4" height="1.2"/>
    <path class="st132" d="M1228,210.5h14.7c0.8,0,1.4,0.6,1.4,1.4l0,0c0,0.8-0.6,1.4-1.4,1.4H1228c-0.8,0-1.4-0.6-1.4-1.4l0,0
			C1226.6,211.1,1227.2,210.5,1228,210.5z"/>

    <linearGradient id="SVGID_00000000939103740185319100000001857961221752636068_" gradientUnits="userSpaceOnUse" x1="1233.4595" y1="636.5572" x2="1237.1694" y2="636.5572" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1233.5" y="213.3" style="fill:url(#SVGID_00000000939103740185319100000001857961221752636068_);" width="3.7" height="3.7"/>

    <linearGradient id="SVGID_00000164493437130871338380000002232741940269311151_" gradientUnits="userSpaceOnUse" x1="477.8398" y1="552.7922" x2="477.8398" y2="549.2622" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="1.000000e-02" style="stop-color:#6B747D"/>
      <stop  offset="0.46" style="stop-color:#70787A"/>
      <stop  offset="0.51" style="stop-color:#9AB9BB"/>
      <stop  offset="0.95" style="stop-color:#A0B8BC"/>
      <stop  offset="1" style="stop-color:#747C7F"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000164493437130871338380000002232741940269311151_);" d="M1278.3,191.3h-1
			c-0.2,0.7-0.3,1.4-0.2,2.2c0,0.8,0.2,1.5,0.5,2.2c0.1,0,1,0.1,1,0.1L1278.3,191.3z"/>

    <linearGradient id="SVGID_00000034788212466830346620000015350547355132625037_" gradientUnits="userSpaceOnUse" x1="459.7445" y1="552.5623" x2="459.7445" y2="549.6122" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="1.000000e-02" style="stop-color:#6B747D"/>
      <stop  offset="0.28" style="stop-color:#70787A"/>
      <stop  offset="0.33" style="stop-color:#9AB9BB"/>
      <stop  offset="0.95" style="stop-color:#A0B8BC"/>
      <stop  offset="1" style="stop-color:#747C7F"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000034788212466830346620000015350547355132625037_);" d="M1296.3,191.4h-1l0.2,2l-0.3,2.5l1-0.1
			c0.3-0.8,0.4-1.6,0.4-2.4C1296.6,192.7,1296.5,192,1296.3,191.4z"/>

    <linearGradient id="SVGID_00000002374021331409686860000011883984872068959640_" gradientUnits="userSpaceOnUse" x1="468.8495" y1="553.8222" x2="468.8495" y2="549.2522" gradientTransform="matrix(-1 0 0 -1 1755.6389 744.7844)">
			<stop  offset="0" style="stop-color:#F7674F"/>
      <stop  offset="0.32" style="stop-color:#FF5237"/>
      <stop  offset="0.43" style="stop-color:#FF6D48"/>
      <stop  offset="0.58" style="stop-color:#FD5936"/>
      <stop  offset="0.81" style="stop-color:#D94B37"/>
      <stop  offset="1" style="stop-color:#C04138"/>
		</linearGradient>

    <rect x="1279.4" y="190.2" style="fill:url(#SVGID_00000002374021331409686860000011883984872068959640_);" width="14.8" height="6"/>

    <linearGradient id="SVGID_00000042726891063620018520000007302271453928699070_" gradientUnits="userSpaceOnUse" x1="468.7838" y1="553.2923" x2="468.8438" y2="549.0123" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#F7674F"/>
      <stop  offset="0.32" style="stop-color:#FF5237"/>
      <stop  offset="0.43" style="stop-color:#FF6D48"/>
      <stop  offset="0.58" style="stop-color:#FD5936"/>
      <stop  offset="0.81" style="stop-color:#D94B37"/>
      <stop  offset="1" style="stop-color:#C04138"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000042726891063620018520000007302271453928699070_);" d="M1278.5,191h16.6
			c0.3,0.7,0.4,1.5,0.3,2.3c0,1-0.2,2-0.5,2.9h-16.3c-0.3-0.9-0.4-1.8-0.5-2.8C1278.1,192.6,1278.2,191.8,1278.5,191z"/>

    <linearGradient id="SVGID_00000019672121953290874950000006986996395863689911_" gradientUnits="userSpaceOnUse" x1="464.4895" y1="539.6772" x2="466.4595" y2="539.6772" gradientTransform="matrix(-1 0 0 -1 1755.6389 744.7844)">
			<stop  offset="0" style="stop-color:#F25039"/>
      <stop  offset="1" style="stop-color:#F74A39"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000019672121953290874950000006986996395863689911_);" d="M1290.8,206.4h-1.3
			c-0.2,0-0.3-0.2-0.3-0.3v-2c0-0.2,0.2-0.3,0.3-0.3h1.3c0.2,0,0.3,0.2,0.3,0.3v2C1291.1,206.3,1291,206.4,1290.8,206.4z"/>

    <linearGradient id="SVGID_00000047057938158373766440000007848740103579670453_" gradientUnits="userSpaceOnUse" x1="471.8795" y1="539.3172" x2="473.0895" y2="539.3172" gradientTransform="matrix(-1 0 0 -1 1755.6289 744.7844)">
			<stop  offset="0" style="stop-color:#B12C1B"/>
      <stop  offset="1" style="stop-color:#BA3828"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000047057938158373766440000007848740103579670453_);" d="M1283.4,206.4h-0.5
			c-0.2,0-0.3-0.1-0.3-0.3v-1.3c0-0.2,0.1-0.3,0.3-0.3h0.5c0.2,0,0.3,0.1,0.3,0.3v1.3C1283.7,206.3,1283.6,206.4,1283.4,206.4z"/>

    <linearGradient id="SVGID_00000160156734393671178840000015300345490961506961_" gradientUnits="userSpaceOnUse" x1="471.3895" y1="540.9973" x2="473.4795" y2="540.9973" gradientTransform="matrix(-1 0 0 -1 1755.629 744.7844)">
			<stop  offset="0" style="stop-color:#A83B27"/>
      <stop  offset="0.14" style="stop-color:#AD3B27"/>
      <stop  offset="1" style="stop-color:#C63B26"/>
		</linearGradient>

    <rect x="1282.1" y="202.8" style="fill:url(#SVGID_00000160156734393671178840000015300345490961506961_);" width="2.1" height="1.9"/>

    <linearGradient id="SVGID_00000047783039224779980280000005732301962442840724_" gradientUnits="userSpaceOnUse" x1="467.0295" y1="528.8672" x2="470.5195" y2="528.8672" gradientTransform="matrix(-1 0 0 -1 1755.6392 744.7844)">
			<stop  offset="0" style="stop-color:#707D85"/>
      <stop  offset="0.1" style="stop-color:#AFC0C7"/>
      <stop  offset="0.23" style="stop-color:#7C8685"/>
      <stop  offset="0.39" style="stop-color:#BFD6E6"/>
      <stop  offset="0.55" style="stop-color:#96A7B7"/>
      <stop  offset="0.66" style="stop-color:#A3BBC7"/>
      <stop  offset="0.78" style="stop-color:#7B8F9A"/>
      <stop  offset="0.85" style="stop-color:#D1DDE0"/>
      <stop  offset="0.88" style="stop-color:#F7FFFF"/>
      <stop  offset="0.93" style="stop-color:#BAC0C0"/>
      <stop  offset="0.98" style="stop-color:#7C807F"/>
      <stop  offset="1" style="stop-color:#636766"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000047783039224779980280000005732301962442840724_);" d="M1287.3,217.7h-1.1
			c-0.6,0-1.1-0.5-1.1-1.1v0v-2.5l0,0h3.5l0,0v2.4C1288.6,217.2,1288.1,217.7,1287.3,217.7L1287.3,217.7L1287.3,217.7z"/>
    <path class="st227" d="M1289.8,212.1v1.3l-1.4,0.8c-0.8,0.3-1.7,0.4-2.6,0.2c-0.7-0.2-1.4-0.5-2-1v-1.2l0.6-0.5h4.8L1289.8,212.1z
			"/>

    <linearGradient id="SVGID_00000003788223570187496030000011860348417637019319_" gradientUnits="userSpaceOnUse" x1="465.4796" y1="539.3073" x2="472.1396" y2="539.3073" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7845)">
			<stop  offset="0" style="stop-color:#F56E51"/>
      <stop  offset="9.000000e-02" style="stop-color:#F07553"/>
      <stop  offset="0.14" style="stop-color:#E74926"/>
      <stop  offset="0.19" style="stop-color:#FF4B32"/>
      <stop  offset="0.7" style="stop-color:#FC4A2E"/>
      <stop  offset="0.75" style="stop-color:#DB5941"/>
      <stop  offset="0.81" style="stop-color:#BF4D33"/>
      <stop  offset="1" style="stop-color:#CF4032"/>
		</linearGradient>

    <rect x="1283.5" y="203.7" style="fill:url(#SVGID_00000003788223570187496030000011860348417637019319_);" width="6.7" height="3.5"/>
    <path class="st229" d="M1290.2,207.3c0.3,0,1,1.4,1,1.4h-8.4c0.1-0.6,0.4-1.1,0.8-1.4H1290.2z"/>

    <linearGradient id="SVGID_00000165915527259122737010000008661734986096057246_" gradientUnits="userSpaceOnUse" x1="466.4595" y1="532.9722" x2="471.1695" y2="532.9722" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#707D85"/>
      <stop  offset="0.1" style="stop-color:#AFC0C7"/>
      <stop  offset="0.23" style="stop-color:#7C8685"/>
      <stop  offset="0.39" style="stop-color:#BFD6E6"/>
      <stop  offset="0.55" style="stop-color:#96A7B7"/>
      <stop  offset="0.66" style="stop-color:#A3BBC7"/>
      <stop  offset="0.78" style="stop-color:#7B8F9A"/>
      <stop  offset="0.85" style="stop-color:#D1DDE0"/>
      <stop  offset="0.88" style="stop-color:#F7FFFF"/>
      <stop  offset="0.93" style="stop-color:#BAC0C0"/>
      <stop  offset="0.98" style="stop-color:#7C807F"/>
      <stop  offset="1" style="stop-color:#636766"/>
		</linearGradient>

    <rect x="1284.5" y="211.5" style="fill:url(#SVGID_00000165915527259122737010000008661734986096057246_);" width="4.7" height="0.6"/>

    <linearGradient id="SVGID_00000162351267809414273660000001116057974983356298_" gradientUnits="userSpaceOnUse" x1="466.4896" y1="532.6823" x2="471.2095" y2="532.6823" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#707D85"/>
      <stop  offset="0.1" style="stop-color:#AFC0C7"/>
      <stop  offset="0.23" style="stop-color:#7C8685"/>
      <stop  offset="0.39" style="stop-color:#BFD6E6"/>
      <stop  offset="0.55" style="stop-color:#96A7B7"/>
      <stop  offset="0.66" style="stop-color:#A3BBC7"/>
      <stop  offset="0.78" style="stop-color:#7B8F9A"/>
      <stop  offset="0.85" style="stop-color:#D1DDE0"/>
      <stop  offset="0.88" style="stop-color:#F7FFFF"/>
      <stop  offset="0.93" style="stop-color:#BAC0C0"/>
      <stop  offset="0.98" style="stop-color:#7C807F"/>
      <stop  offset="1" style="stop-color:#636766"/>
		</linearGradient>

    <ellipse style="fill:url(#SVGID_00000162351267809414273660000001116057974983356298_);" cx="1286.8" cy="212.1" rx="2.4" ry="0.6"/>
    <path class="st232" d="M1286.9,214.6c0.9,0,1.7-0.2,1.7-0.4l0,0C1288.6,214.4,1287.8,214.6,1286.9,214.6c-1,0-1.8-0.1-1.8-0.4l0,0
			C1285.2,214.4,1286,214.6,1286.9,214.6z"/>
    <path class="st233" d="M1289.8,212.1v1.3c0,0-0.8,0.9-1.4,0.8v-1.4C1288.7,212.4,1289.2,212.1,1289.8,212.1z"/>
    <path class="st234" d="M1285.3,212.9c-0.4-0.4-0.9-0.7-1.5-0.7v1.2c0.3,0.5,0.9,0.8,1.5,0.9V212.9z"/>
    <path class="st235" d="M1288.4,212.8c-1.1-0.2-2.1-0.2-3.2,0.1v1.4c1,0.3,2.1,0.3,3.1-0.1L1288.4,212.8z"/>

    <linearGradient id="SVGID_00000036959202333602545750000011554181568706107272_" gradientUnits="userSpaceOnUse" x1="464.2695" y1="535.2122" x2="473.1995" y2="535.2122" gradientTransform="matrix(-1 0 0 -1 1755.6289 744.7944)">
			<stop  offset="0" style="stop-color:#FF5D2A"/>
      <stop  offset="0.17" style="stop-color:#FF613A"/>
      <stop  offset="0.22" style="stop-color:#EE5744"/>
      <stop  offset="0.25" style="stop-color:#FF5A36"/>
      <stop  offset="0.7" style="stop-color:#FE5E3A"/>
      <stop  offset="0.73" style="stop-color:#FB5932"/>
      <stop  offset="0.79" style="stop-color:#FE603B"/>
      <stop  offset="1" style="stop-color:#FF5F39"/>
		</linearGradient>
    <path :myid='nodeInfo[15].id' @click='editInfo' style="cursor:pointer;fill:url(#SVGID_00000036959202333602545750000011554181568706107272_);" d="M1289.9,211.5h-6.2
			c-0.7,0-1.3-0.6-1.3-1.3c0,0,0,0,0,0v-0.6c0-1.1,0.9-2,2-2h4.9c1.1,0,2,0.9,2,2v0.5C1291.3,210.9,1290.7,211.5,1289.9,211.5z"/>

    <linearGradient id="SVGID_00000027604838645494694010000012553367754623685273_" gradientUnits="userSpaceOnUse" x1="461.4395" y1="547.4522" x2="476.0196" y2="547.4522" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#C8D9E3"/>
      <stop  offset="0.51" style="stop-color:#AEC0C4"/>
      <stop  offset="1" style="stop-color:#98ACAB"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000027604838645494694010000012553367754623685273_);" cx="1286.9" cy="197.3" r="7.3"/>

    <linearGradient id="SVGID_00000009592249405198582790000013025765426635169709_" gradientUnits="userSpaceOnUse" x1="461.8896" y1="547.4522" x2="475.5695" y2="547.4522" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#D6E8F4"/>
      <stop  offset="1" style="stop-color:#D1E3EF"/>
		</linearGradient>
    <circle :myid='nodeInfo[15].id' @click='editInfo' style="cursor:pointer;fill:url(#SVGID_00000009592249405198582790000013025765426635169709_);" cx="1286.9" cy="197.3" r="6.8"/>

    <linearGradient id="SVGID_00000054230918844488650140000005561816355116534428_" gradientUnits="userSpaceOnUse" x1="463.1295" y1="547.5122" x2="474.4495" y2="547.5122" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#9FAFBC"/>
      <stop  offset="0.49" style="stop-color:#BBC9D4"/>
      <stop  offset="1" style="stop-color:#D4E1E9"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000054230918844488650140000005561816355116534428_);" cx="1286.8" cy="197.3" r="5.7"/>

    <linearGradient id="SVGID_00000099658159074414521760000011656633411550865076_" gradientUnits="userSpaceOnUse" x1="463.8095" y1="547.5122" x2="473.7695" y2="547.5122" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#D1E1EE"/>
      <stop  offset="1" style="stop-color:#CCDEEC"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000099658159074414521760000011656633411550865076_);" cx="1286.8" cy="197.3" r="5"/>

    <linearGradient id="SVGID_00000087413275692539346960000017804048202241894273_" gradientUnits="userSpaceOnUse" x1="464.7895" y1="547.5122" x2="472.7895" y2="547.5122" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#2F3D3D"/>
      <stop  offset="0.65" style="stop-color:#647476"/>
      <stop  offset="1" style="stop-color:#7B8D8F"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000087413275692539346960000017804048202241894273_);" cx="1286.8" cy="197.3" r="4"/>

    <linearGradient id="SVGID_00000085950706979757843890000005686214535639600295_" gradientUnits="userSpaceOnUse" x1="464.9796" y1="547.5122" x2="472.5895" y2="547.5122" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#5C6668"/>
      <stop  offset="0.65" style="stop-color:#949494"/>
      <stop  offset="1" style="stop-color:#ADA9A8"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000085950706979757843890000005686214535639600295_);" cx="1286.8" cy="197.3" r="3.8"/>

    <linearGradient id="SVGID_00000137844924833077810850000016622068308071772593_" gradientUnits="userSpaceOnUse" x1="465.6895" y1="547.4722" x2="471.9295" y2="547.4722" gradientTransform="matrix(-1 0 0 -1 1755.639 744.7844)">
			<stop  offset="0" style="stop-color:#189D40"/>
      <stop  offset="0.67" style="stop-color:#28DB5D"/>
      <stop  offset="1" style="stop-color:#2EF469"/>
		</linearGradient>

    <rect x="1283.7" y="195.3" style="fill:url(#SVGID_00000137844924833077810850000016622068308071772593_);" width="6.2" height="4.1"/>
    <text transform="matrix(1 0 0 1 1284.2694 197.4522)" class="st244 st245 st246">0.000</text>
    <text transform="matrix(1 0 0 1 1286.2495 199.1522)" class="st244 st245 st247">MpR</text>

    <linearGradient id="SVGID_00000150066944844325789750000004540080752131991482_" gradientUnits="userSpaceOnUse" x1="5789.6494" y1="-7046.7378" x2="5789.6494" y2="-7035.4478" gradientTransform="matrix(1 0 0 1 -5291.3398 7553.5195)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="426.2" y="505.3" style="fill:url(#SVGID_00000150066944844325789750000004540080752131991482_);" width="144.2" height="13.8"/>
    <rect x="568.3" y="505.3" class="st99" width="0.8" height="13.8"/>

    <linearGradient id="SVGID_00000125589202314960855840000001302026180391369346_" gradientUnits="userSpaceOnUse" x1="9948.8145" y1="-2172.8977" x2="9948.8145" y2="-2160.2478" gradientTransform="matrix(1 0 0 1 -9380.1504 2678.6299)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="568.3" y="505.2" style="fill:url(#SVGID_00000125589202314960855840000001302026180391369346_);" width="0.7" height="13.9"/>
    <circle class="st99" cx="568.7" cy="505.7" r="0.2"/>

    <linearGradient id="SVGID_00000016033343776375895730000006509473667862802600_" gradientUnits="userSpaceOnUse" x1="-457.5924" y1="2239.0505" x2="-457.1724" y2="2239.0505" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000016033343776375895730000006509473667862802600_);" cx="568.7" cy="505.7" r="0.2"/>
    <circle class="st99" cx="568.7" cy="508.3" r="0.2"/>

    <linearGradient id="SVGID_00000088094403468195279570000010411401537218336921_" gradientUnits="userSpaceOnUse" x1="-458.5224" y1="2236.6028" x2="-458.1124" y2="2236.6028" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000088094403468195279570000010411401537218336921_);" cx="568.7" cy="508.3" r="0.2"/>
    <circle class="st99" cx="568.7" cy="510.9" r="0.2"/>

    <linearGradient id="SVGID_00000139255833417957655170000014532967441387686540_" gradientUnits="userSpaceOnUse" x1="-459.4524" y1="2234.1455" x2="-459.0424" y2="2234.1455" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000139255833417957655170000014532967441387686540_);" cx="568.7" cy="510.9" r="0.2"/>
    <circle class="st99" cx="568.7" cy="513.5" r="0.2"/>

    <linearGradient id="SVGID_00000144327092817472020140000006675343951495539362_" gradientUnits="userSpaceOnUse" x1="-460.3824" y1="2231.6978" x2="-459.9724" y2="2231.6978" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000144327092817472020140000006675343951495539362_);" cx="568.7" cy="513.5" r="0.2"/>
    <circle class="st99" cx="568.7" cy="516.1" r="0.2"/>

    <linearGradient id="SVGID_00000114031167007154124130000012646735893648621988_" gradientUnits="userSpaceOnUse" x1="-461.3124" y1="2229.2498" x2="-460.9024" y2="2229.2498" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000114031167007154124130000012646735893648621988_);" cx="568.7" cy="516.1" r="0.2"/>
    <circle class="st99" cx="568.7" cy="518.8" r="0.2"/>

    <linearGradient id="SVGID_00000167362671666835955640000006820839714342656160_" gradientUnits="userSpaceOnUse" x1="-462.2424" y1="2226.7925" x2="-461.8324" y2="2226.7925" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000167362671666835955640000006820839714342656160_);" cx="568.7" cy="518.8" r="0.2"/>
    <rect x="570.4" y="505.3" class="st99" width="1" height="13.9"/>

    <linearGradient id="SVGID_00000143617891367829938380000004504611549850402182_" gradientUnits="userSpaceOnUse" x1="-92.9405" y1="-1544.1378" x2="-92.9405" y2="-1531.1078" gradientTransform="matrix(1 0 0 1 664.95 2049.6799)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="570.6" y="505" style="fill:url(#SVGID_00000143617891367829938380000004504611549850402182_);" width="2.9" height="14.3"/>
    <rect x="573.4" y="506" class="st99" width="0.5" height="0.7"/>
    <rect x="573.4" y="509" class="st99" width="0.5" height="0.7"/>
    <rect x="573.4" y="512" class="st99" width="0.5" height="0.7"/>
    <rect x="573.4" y="515" class="st99" width="0.5" height="0.7"/>
    <rect x="573.4" y="517.9" class="st99" width="0.5" height="0.7"/>

    <linearGradient id="SVGID_00000164515006021824939470000008463082613174042272_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="361.4072" x2="498.8895" y2="361.4072" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="497.7" y="486.8" style="fill:url(#SVGID_00000164515006021824939470000008463082613174042272_);" width="1.1" height="6.9"/>

    <linearGradient id="SVGID_00000171711463191428836170000005490971817759588790_" gradientUnits="userSpaceOnUse" x1="497.1595" y1="360.8422" x2="499.4695" y2="360.8422" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="497.2" y="490.5" style="fill:url(#SVGID_00000171711463191428836170000005490971817759588790_);" width="2.3" height="0.8"/>
    <rect x="497.3" y="491.3" class="st33" width="0.2" height="2.5"/>
    <rect x="499.1" y="491.3" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M498.2,488.4c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1s0.9-1,2.1-1.1
			c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4c1.2,0.2,2.1,0.4,2.1,1.1
			s-0.9,0.9-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C508.1,488.3,503.3,488.4,498.2,488.4z M482.7,486.5c3.1,0.3,8.3,0.5,15.5,0.5
			s12.4-0.2,15.5-0.5c-3.1-0.3-8.3-0.5-15.5-0.5S485.8,486.3,482.7,486.5L482.7,486.5z"/>
    <rect x="497" y="486.4" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="499.7,486.8 499.6,486.5 507,485.6 507.1,486 		"/>

    <rect x="490.8" y="480.2" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 -17.7702 954.0282)" class="st34" width="0.4" height="12.3"/>

    <rect x="499" y="486.2" transform="matrix(0.5547 -0.8321 0.8321 0.5547 -183.1023 632.3)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000062155470144710962010000008807398578751911808_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="365.3905" x2="498.8995" y2="365.3905" gradientTransform="matrix(1 0 0 -1 -3.650124e-02 857.1135)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000062155470144710962010000008807398578751911808_);" points="497.7,491.7 497.7,491.6
			498.9,491.8 498.9,491.8 		"/>

    <linearGradient id="SVGID_00000036231334918040040450000001276923516229396638_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="365.1981" x2="498.8995" y2="365.1981" gradientTransform="matrix(1 0 0 -1 -3.745489e-02 857.1124)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000036231334918040040450000001276923516229396638_);" points="497.7,491.8 497.7,491.8
			498.9,492 498.9,492 		"/>

    <linearGradient id="SVGID_00000076561238753605752560000005209729513616571801_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="365.0058" x2="498.8995" y2="365.0058" gradientTransform="matrix(1 0 0 -1 -3.839720e-02 857.1113)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000076561238753605752560000005209729513616571801_);" points="497.7,492 497.7,492
			498.9,492.2 498.9,492.2 		"/>

    <linearGradient id="SVGID_00000014623747403386751850000016664639735256954504_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="364.8134" x2="498.8995" y2="364.8134" gradientTransform="matrix(1 0 0 -1 -3.934708e-02 857.1102)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000014623747403386751850000016664639735256954504_);" points="497.7,492.2 497.7,492.2
			498.9,492.4 498.9,492.4 		"/>

    <linearGradient id="SVGID_00000035514224636146180960000002040096095590832802_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="364.6194" x2="498.8995" y2="364.6194" gradientTransform="matrix(1 0 0 -1 -3.029483e-02 857.1091)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000035514224636146180960000002040096095590832802_);" points="497.7,492.4 497.7,492.4
			498.9,492.6 498.9,492.6 		"/>

    <linearGradient id="SVGID_00000166638907806549927730000003664618349436351666_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="364.4271" x2="498.8995" y2="364.4271" gradientTransform="matrix(1 0 0 -1 -3.123709e-02 857.1079)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000166638907806549927730000003664618349436351666_);" points="497.7,492.6 497.7,492.6
			498.9,492.8 498.9,492.8 		"/>

    <linearGradient id="SVGID_00000043452827687962734410000013816697136837558164_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="364.2347" x2="498.8995" y2="364.2347" gradientTransform="matrix(1 0 0 -1 -3.218698e-02 857.1068)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000043452827687962734410000013816697136837558164_);" points="497.7,492.8 497.7,492.8
			498.9,492.9 498.9,493 		"/>

    <linearGradient id="SVGID_00000167374945414340821610000002294357954618260882_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="364.044" x2="498.8995" y2="364.044" gradientTransform="matrix(1 0 0 -1 -2.327075e-02 857.1073)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000167374945414340821610000002294357954618260882_);" points="497.7,493 497.7,492.9
			498.9,493.1 498.9,493.2 		"/>

    <linearGradient id="SVGID_00000009577906703068329480000005479653018074940857_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="363.8517" x2="498.8995" y2="363.8517" gradientTransform="matrix(1 0 0 -1 -2.421300e-02 857.1062)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000009577906703068329480000005479653018074940857_);" points="497.7,493.2 497.7,493.1
			498.9,493.3 498.9,493.4 		"/>

    <linearGradient id="SVGID_00000174586584580963022230000016308219350022209954_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="363.6577" x2="498.8995" y2="363.6577" gradientTransform="matrix(1 0 0 -1 -2.516289e-02 857.1051)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000174586584580963022230000016308219350022209954_);" points="497.7,493.4 497.7,493.3
			498.9,493.5 498.9,493.6 		"/>

    <linearGradient id="SVGID_00000165953190587276969150000012758476161262472863_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="363.4653" x2="498.8995" y2="363.4653" gradientTransform="matrix(1 0 0 -1 -2.611278e-02 857.1039)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000165953190587276969150000012758476161262472863_);" points="497.7,493.6 497.7,493.5
			498.9,493.7 498.9,493.8 		"/>

    <linearGradient id="SVGID_00000146486981569887541600000003307993844717237673_" gradientUnits="userSpaceOnUse" x1="496.2696" y1="357.5688" x2="500.4095" y2="357.6088" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000146486981569887541600000003307993844717237673_);" d="M494.2,496.6v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.1v3.9h3.6v-4c0-0.4,0.1-0.7,0.4-1h1.7v-0.8H494.2z"/>

    <linearGradient id="SVGID_00000060736050511485173300000006904621773324663939_" gradientUnits="userSpaceOnUse" x1="496.2495" y1="671.7024" x2="500.3895" y2="671.7424" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000060736050511485173300000006904621773324663939_);" d="M494.2,496.4v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.1v-0.8h2.1v0.9c0,0.4,0.1,0.8,0.4,1h2.5v0.8H494.2z"/>

    <linearGradient id="SVGID_00000113320987320528021740000015180807181247674301_" gradientUnits="userSpaceOnUse" x1="240.8745" y1="221.0522" x2="240.8745" y2="203.8222" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="477.9" y="502" style="fill:url(#SVGID_00000113320987320528021740000015180807181247674301_);" width="3.9" height="20.1"/>

    <linearGradient id="SVGID_00000035523033447143073890000006471581036965912450_" gradientUnits="userSpaceOnUse" x1="259.0545" y1="221.0522" x2="259.0545" y2="203.8222" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="514.8" y="502" style="fill:url(#SVGID_00000035523033447143073890000006471581036965912450_);" width="3.9" height="20.1"/>

    <linearGradient id="SVGID_00000104700095651025727180000018236158538880057233_" gradientUnits="userSpaceOnUse" x1="498.2145" y1="354.5722" x2="498.2145" y2="334.3722" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000104700095651025727180000018236158538880057233_);" d="M512.4,505.1c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8h-2.1v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H512.4z"/>

    <linearGradient id="SVGID_00000012439876507434730120000017295092706155912611_" gradientUnits="userSpaceOnUse" x1="5789.6494" y1="-6783.6279" x2="5789.6494" y2="-6772.3481" gradientTransform="matrix(1 0 0 1 -5291.3398 7553.5195)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="426.2" y="768.4" style="fill:url(#SVGID_00000012439876507434730120000017295092706155912611_);" width="144.2" height="13.8"/>

    <linearGradient id="SVGID_00000016070889391766982120000016587421428839902098_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="98.3072" x2="498.8895" y2="98.3072" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="497.7" y="749.9" style="fill:url(#SVGID_00000016070889391766982120000016587421428839902098_);" width="1.1" height="6.9"/>

    <linearGradient id="SVGID_00000096049435296215288390000000196347558718122926_" gradientUnits="userSpaceOnUse" x1="497.1595" y1="97.7422" x2="499.4695" y2="97.7422" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="497.2" y="753.6" style="fill:url(#SVGID_00000096049435296215288390000000196347558718122926_);" width="2.3" height="0.8"/>
    <rect x="497.3" y="754.4" class="st33" width="0.2" height="2.5"/>
    <rect x="499.1" y="754.4" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M498.2,751.5c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1s0.9-0.9,2.1-1.1
			c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4c1.2,0.2,2.1,0.4,2.1,1.1
			s-0.9,0.9-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C508.1,751.4,503.3,751.5,498.2,751.5z M482.7,749.6c3.1,0.3,8.3,0.5,15.5,0.5
			s12.4-0.2,15.5-0.5c-3.1-0.3-8.3-0.5-15.5-0.5S485.8,749.4,482.7,749.6L482.7,749.6z"/>
    <rect x="497" y="749.6" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="499.7,749.9 499.6,749.6 507,748.7 507.1,749.1 		"/>

    <rect x="490.8" y="743.3" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 -280.5723 1204.8209)" class="st34" width="0.4" height="12.3"/>

    <rect x="499" y="749.3" transform="matrix(0.5547 -0.8321 0.8321 0.5547 -402.0148 749.4615)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000137115084958324697530000007452288138373033873_" gradientUnits="userSpaceOnUse" x1="497.8432" y1="108.0928" x2="499.0028" y2="108.0928" gradientTransform="matrix(1.0028 4.891307e-03 4.891307e-03 -1.0028 -4.2245 860.7665)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000137115084958324697530000007452288138373033873_);" points="497.7,754.7 497.7,754.7
			498.9,754.9 498.9,754.9 		"/>

    <linearGradient id="SVGID_00000082363321362353311480000017036344182178850690_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="102.0891" x2="498.8995" y2="102.0891" gradientTransform="matrix(1 0 0 -1 -4.119333e-02 857.0963)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000082363321362353311480000017036344182178850690_);" points="497.7,754.9 497.7,754.9
			498.9,755.1 498.9,755.1 		"/>

    <linearGradient id="SVGID_00000100359688735822011330000001265180007753955742_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="101.8967" x2="498.8995" y2="101.8967" gradientTransform="matrix(1 0 0 -1 -4.212943e-02 857.095)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000100359688735822011330000001265180007753955742_);" points="497.7,755.1 497.7,755.1
			498.9,755.3 498.9,755.3 		"/>

    <linearGradient id="SVGID_00000089536321732853575520000013264492709525885868_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="101.7027" x2="498.8995" y2="101.7027" gradientTransform="matrix(1 0 0 -1 -4.308558e-02 857.094)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000089536321732853575520000013264492709525885868_);" points="497.7,755.3 497.7,755.3
			498.9,755.5 498.9,755.5 		"/>

    <linearGradient id="SVGID_00000147184639045219894780000010210470469068003490_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="101.5103" x2="498.8995" y2="101.5103" gradientTransform="matrix(1 0 0 -1 -4.402167e-02 857.0928)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000147184639045219894780000010210470469068003490_);" points="497.7,755.5 497.7,755.5
			498.9,755.7 498.9,755.7 		"/>

    <linearGradient id="SVGID_00000114759171590302367040000004236113696059231423_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="101.318" x2="498.8995" y2="101.318" gradientTransform="matrix(1 0 0 -1 -4.499288e-02 857.0917)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000114759171590302367040000004236113696059231423_);" points="497.7,755.7 497.7,755.7
			498.9,755.8 498.9,755.9 		"/>

    <linearGradient id="SVGID_00000116196167046784805740000000778143195578181822_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="101.1256" x2="498.8995" y2="101.1256" gradientTransform="matrix(1 0 0 -1 -4.592897e-02 857.0906)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000116196167046784805740000000778143195578181822_);" points="497.7,755.9 497.7,755.8
			498.9,756 498.9,756.1 		"/>

    <linearGradient id="SVGID_00000003794314252297036990000003966148312227895740_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="100.9317" x2="498.8995" y2="100.9317" gradientTransform="matrix(1 0 0 -1 -4.688513e-02 857.0895)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000003794314252297036990000003966148312227895740_);" points="497.7,756.1 497.7,756
			498.9,756.2 498.9,756.3 		"/>

    <linearGradient id="SVGID_00000160179693420050965970000017849596500267476378_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="100.7409" x2="498.8995" y2="100.7409" gradientTransform="matrix(1 0 0 -1 -3.796263e-02 857.09)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000160179693420050965970000017849596500267476378_);" points="497.7,756.3 497.7,756.2
			498.9,756.4 498.9,756.5 		"/>

    <linearGradient id="SVGID_00000181082419727718835130000010741374106377837750_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="100.5486" x2="498.8995" y2="100.5486" gradientTransform="matrix(1 0 0 -1 -3.891879e-02 857.0889)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000181082419727718835130000010741374106377837750_);" points="497.7,756.5 497.7,756.4
			498.9,756.6 498.9,756.7 		"/>

    <linearGradient id="SVGID_00000024688567484426673180000009866619292921693366_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="100.3562" x2="498.8995" y2="100.3562" gradientTransform="matrix(1 0 0 -1 -3.982436e-02 857.0877)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000024688567484426673180000009866619292921693366_);" points="497.7,756.7 497.7,756.6
			498.9,756.8 498.9,756.9 		"/>

    <linearGradient id="SVGID_00000149350239814344469180000001677821643528596409_" gradientUnits="userSpaceOnUse" x1="496.2696" y1="94.4688" x2="500.4095" y2="94.5088" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000149350239814344469180000001677821643528596409_);" d="M494.2,759.7v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.2v3.8h3.6v-3.9c0-0.4,0.1-0.8,0.4-1.1h1.7v-0.8H494.2z"/>

    <linearGradient id="SVGID_00000165207642572917049570000003193044236230128001_" gradientUnits="userSpaceOnUse" x1="496.2495" y1="934.8061" x2="500.3895" y2="934.8561" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000165207642572917049570000003193044236230128001_);" d="M494.2,759.6v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.2v-0.8h2.1v0.9c0,0.4,0.1,0.8,0.4,1.1h2.5v0.8L494.2,759.6z"/>

    <linearGradient id="SVGID_00000152952932747184920940000017352826770051567267_" gradientUnits="userSpaceOnUse" x1="240.8745" y1="-42.0478" x2="240.8745" y2="-59.2878" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="477.9" y="765.1" style="fill:url(#SVGID_00000152952932747184920940000017352826770051567267_);" width="3.9" height="20.1"/>

    <linearGradient id="SVGID_00000147188648282857385740000014638657001502968719_" gradientUnits="userSpaceOnUse" x1="259.0545" y1="-42.0478" x2="259.0545" y2="-59.2878" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="514.8" y="765.1" style="fill:url(#SVGID_00000147188648282857385740000014638657001502968719_);" width="3.9" height="20.1"/>

    <linearGradient id="SVGID_00000076583573525734919540000015861203926180866436_" gradientUnits="userSpaceOnUse" x1="498.2445" y1="91.4722" x2="498.2445" y2="71.2622" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000076583573525734919540000015861203926180866436_);" d="M512.4,768.3c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8h-2.1v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H512.4z"/>

    <linearGradient id="SVGID_00000130625517876770583470000017931784574251153081_" gradientUnits="userSpaceOnUse" x1="9978.0244" y1="-2172.7876" x2="9978.0244" y2="-2159.6077" gradientTransform="matrix(1 0 0 1 -9557.3799 2678.6199)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000130625517876770583470000017931784574251153081_);" d="M424.8,519.5h-7.4c-0.6,0-1-3.2-1-7.1
			c0-3.9,0.5-7.1,1-7.1h7.4L424.8,519.5z"/>
    <path class="st97" d="M420,505.3c0,0-2.5-0.2-2.5-2.5v2.5H420z"/>
    <path class="st98" d="M417.4,522c0,0,0.2-2.5,2.5-2.5h-2.5V522z"/>
    <rect x="421" y="505.2" class="st99" width="0.8" height="14.2"/>

    <linearGradient id="SVGID_00000095326887415131528880000018157068859400716690_" gradientUnits="userSpaceOnUse" x1="9978.7393" y1="-2172.9377" x2="9978.7393" y2="-2159.9277" gradientTransform="matrix(1 0 0 1 -9557.3799 2678.6299)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="421" y="505.2" style="fill:url(#SVGID_00000095326887415131528880000018157068859400716690_);" width="0.7" height="14.3"/>
    <circle class="st99" cx="421.4" cy="505.6" r="0.3"/>

    <linearGradient id="SVGID_00000036250158828767110330000006458272622875103400_" gradientUnits="userSpaceOnUse" x1="-485.5824" y1="2249.5034" x2="-485.1524" y2="2249.5034" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -829.8562 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000036250158828767110330000006458272622875103400_);" cx="421.4" cy="505.6" r="0.2"/>
    <circle class="st99" cx="421.4" cy="508.3" r="0.3"/>

    <linearGradient id="SVGID_00000165224456619404521250000010976426237688944053_" gradientUnits="userSpaceOnUse" x1="-486.5324" y1="2246.9902" x2="-486.1024" y2="2246.9902" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -829.8562 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000165224456619404521250000010976426237688944053_);" cx="421.4" cy="508.3" r="0.2"/>
    <circle class="st99" cx="421.4" cy="511" r="0.3"/>

    <linearGradient id="SVGID_00000174568834475412151490000017369662577625391498_" gradientUnits="userSpaceOnUse" x1="-487.4924" y1="2244.4675" x2="-487.0624" y2="2244.4675" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -829.8562 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000174568834475412151490000017369662577625391498_);" cx="421.4" cy="511" r="0.2"/>
    <circle class="st99" cx="421.4" cy="513.7" r="0.3"/>

    <linearGradient id="SVGID_00000096040741064595397070000008069837342992396948_" gradientUnits="userSpaceOnUse" x1="-488.4524" y1="2241.9448" x2="-488.0224" y2="2241.9448" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -829.8562 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000096040741064595397070000008069837342992396948_);" cx="421.4" cy="513.7" r="0.2"/>
    <circle class="st99" cx="421.4" cy="516.4" r="0.3"/>

    <linearGradient id="SVGID_00000000941184173099021910000016639921342806828447_" gradientUnits="userSpaceOnUse" x1="-489.4024" y1="2239.4224" x2="-488.9724" y2="2239.4224" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -829.8562 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000000941184173099021910000016639921342806828447_);" cx="421.4" cy="516.4" r="0.2"/>
    <circle class="st99" cx="421.4" cy="519.1" r="0.3"/>

    <linearGradient id="SVGID_00000011731230702515816500000017558273135803167887_" gradientUnits="userSpaceOnUse" x1="-490.3624" y1="2236.8997" x2="-489.9324" y2="2236.8997" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -829.8562 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000011731230702515816500000017558273135803167887_);" cx="421.4" cy="519.1" r="0.2"/>
    <rect x="423.2" y="505.2" class="st99" width="1" height="14.2"/>

    <linearGradient id="SVGID_00000114752798530424000570000014511566238762901389_" gradientUnits="userSpaceOnUse" x1="-62.9055" y1="-1544.1879" x2="-62.9055" y2="-1530.7777" gradientTransform="matrix(1 0 0 1 487.72 2049.6799)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="423.3" y="505" style="fill:url(#SVGID_00000114752798530424000570000014511566238762901389_);" width="3" height="14.7"/>
    <rect x="426.2" y="506" class="st99" width="0.5" height="0.7"/>
    <rect x="426.2" y="509.1" class="st99" width="0.5" height="0.7"/>
    <rect x="426.2" y="512.1" class="st99" width="0.5" height="0.7"/>
    <rect x="426.2" y="515.2" class="st99" width="0.5" height="0.7"/>
    <rect x="426.2" y="518.2" class="st99" width="0.5" height="0.7"/>
    <g>
			<defs>
				<path id="SVGID_00000026163088467943849060000004443355670367891847_" d="M426,768.4c-5.4,0-8.3-3.2-8.3-8.5v-11.1h-13.9v15
					c0,10.1,8.2,18.3,18.3,18.3h11.8v-13.8H426z"/>
			</defs>
      <clipPath id="SVGID_00000099652935990969757440000012194608045951144321_">
				<use xlink:href="#SVGID_00000026163088467943849060000004443355670367891847_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000099652935990969757440000012194608045951144321_);">
				<g>
					<defs>
						<rect id="SVGID_00000170269179305041603490000010155919826806834615_" x="398.7" y="743.8" width="40.1" height="43.4"/>
					</defs>
          <clipPath id="SVGID_00000128460506937475829370000011411842129615858057_">
						<use xlink:href="#SVGID_00000170269179305041603490000010155919826806834615_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000128460506937475829370000011411842129615858057_);">

							<image style="overflow:visible;enable-background:new    ;" width="84" height="92" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFUAAABeCAYAAABSMliZAAAACXBIWXMAABcRAAAXEQHKJvM/AAAA
GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAEr5JREFUeNrsXV2vHWUVXuvdhwOV
WqCNQvhSIlwpJfFCCTHGqPwCY4yA8TeI3qtXJCSQ+B8IJuqN14iGDwX1RireSLTQ0goILbaV0gN7
lvN+r7Xe9c6ec1rsNGGX4ewze8/s2c8877Oetd6PA/Dx4+PHlfBAIvrJ+PPHU2/64PTfYGfc0iFp
S8+xPidKT8cn4SmVX+M+vw1DfD7+JBrS70P5Pb5v/Bl+j8+3D9wM+2/70vjzlisB059uWXuH998a
QXwZ3j/5O9g59TIDz2+uAovxOeXfKQKYt/g7xd89SGsP3hqGDz+EYf3h+Pv4c/A/1/F52uffE/YN
eYvHZXAP3f0t2H/7vYtFdatl5cvw33/8PIKJjJXECNoSXj6P/wVAI9gEmbqkDyV2/sJ0taUXLvzn
dbjw7jE4+9oLAdhDh78N29fdumxQ3z/5dAB0ff4tBhQp8Bi6HizEDSBTu18cwmgtjqF0EyjdnNoE
Lrx7HE48+3j4efNXH14csE4C+uQI6Jv1SxF1Dqv7s16Gtwu9tZhN9VC0zkjlLQnOAiRR+3lv/+UX
cOKZx2BnZPDiQB1GZn5w6kgCVONAOuJ0AMaIE6ZnmPR31F1ElFICvFkb5yMyXqqMJgb72Vf/AGfG
bXGg7pw+MmroX4V+tbjRBjCYM0joejBROwZsz0fEGSminNiyO6jqQFFjX/097IxSsBhQPxjB9Ftp
9sQZ2WFl+TEBrApccXOMxciaMgd0kPZBtBIQLM3Xcubosti65VladZQFohCEVJRGUK9jJ0ZhPRdy
6R7a25DOQewEhFACFIEyvJq9ENnqt+Uw9R0P6htKH6kN3EzrRBDh3gcrMJg1FC0XQUqz876YCEBK
EPJn5iSA8ucbEnF2ZOvZhbB1a2cMUJI1JO0UaQaSYq2O5ii1lXTmBeL88d9QIjxx5yHkgQGfJYDa
4LUoS1WbVyfKC/POwGbvpUZLXdmQgV2xQBF0eBAiHphAslYHNKLlAJpAJSOd0VE+X7zaR8rtGAJb
ZKBhKz9PzvuH2swLkwfZ3Lm2FkBhwlNfbqZq3SPbnE8mUCr6x/vAgeHnpKKTDdjCPuXMihVrLEBp
kaDayRP1U6RWR7vH6+AmUgY7UAqQbe9a9y9HAJzWMu1PZT5g05S6aadU2qKrTEupk/I22ZVyG6Rc
yUIDVduENl6iFfENthLLnEhpaZNFCXZCI9qkNHVpgHY1tfny+guamZMhB/y7Yq1s5WBUOTc0Tb96
00EmAdoNAMHCMPWlP8sOTdVPcS59jcJMJ8Ho5v+dNlOyqU21iMvE1MnLoU3A8erTBHOJN9ve+ZHd
XDJvSumK0RW0BbHU1tSNVzjBIIMxpIMeQCcocrlB5Uc3fRYtFdS5D5wgM1Y3kAElIzvokZpnV7yW
YPhY0rKyKPNPcyWJNgCNmw8hldeb76Up/ehcxbIY6+xgstsApQ29EoB0XpGybijBTgJHUhqIliUB
bm8XswkcbCJ1yajKob4u4MLWBCyLeLnjgDbp+mI1lTo11d4X6TkAapkn5JJs5CY+kiZt21JBpblB
iib8o0oQSNVYEVMLZkUR7dBKX9e07i6t6U8w1Qo8U9Fs4jWLvBlIo3C96Z7qq0KEpTb/i73T0ykr
cjRQISG6W6ij1bUWS7jMJr87TZ31YEKJhpNFlYUVqDPgKWClMQLYsLtGerTkHHCpoBJMpD67vHBs
WBzBSoxTRe3Waqk0mA/GSM+xVyxbtqbOi2BT3wOFs6JWHEsxiwIFUTN6gXq5S1BxD0KlGKZG6VUW
MsYazEReKoSaKOj3yrjG2XtFaOr8TIrM0Xrq9nCdxNqskWlp2JwrY147cWrimvBKAlUnAhPDgdpv
31ERYgNZUJAtMNQhAxlnALcsts4s/XU7oGQ0NvwnamfvsLKTByJxei0nTiQOyIcWzQJ9KUzdmJ4a
w36U/RHKmzRSZqXIfGyWAVRdXyjGZyEbPSjk+opo/ji3ejUBPhpZE6LYj+y9GTZAORYLG7elB2gg
nDn6HJz553NXGlNpRmzoJA3I/WWN2MjYKc1EBRaZi5BAo5JSXMzoP/fRnZps3yqaPBQHgLgaf1nJ
kddo9IEhkwBl6c4cfX5k6/OXHdStFgicCRjNSms9QNRYKb8vgkMsy0JW2sM8lUgA7FLaizoEhseF
08fg9d8+Etj6qS8+AFdff/sSQJ3LPmbWfSaUq/tqDoWcDYC1GCJAys3bAY0WCgdXgMYyb2BI+/zH
pRtB8ayEzO6N+wOwTz8StqtvuB0O3PEVA1zsyBequNeOCPfnOvDZ+2D7+tv2Amov5zcivvkadlNX
SpMtqCQAqErVksGlyWeGU3ruuUz1ZiHJxMwD/O/TT85LbJADyuco8Kyuvnbgjvvglq/9CD75mft2
o6loN23qG/rqU4HPpxCBR2pmet1Fox8Cl1ul54zN7Hl8j6psgS62YL8/TKfWOA2oLq7noHn21Rfg
6K9/ACeffbyZcrT30p8x6FcMETLHOPAmzUAGZKW/fO0pgLmazpZJGGm/OEe+ERzcZMdqOoyq5wd5
5cEEVPRE8FqGl5p3j8PJZx4LGwd2F5X/tirXb01KHnTezvQy/HSuyEBk5ioBquoCzqnaq7w5IMCT
CUW1aOpffq9z0voVf2z4ZURRsnz7yK/g7Zd+yUHdPKtPJABERjZlH8KHUKK4YD5pzbE3Zmvl2IW7
uo1f3DknCjGyuF3T4MpSVbjxx48Sg0Fm6sRlBH4cD6T1ZvDUGtUNOHfsRTg7bgHU/Xd9H7YP3bPL
PgrqbDARxEBccCycjF9u5b/g1vhza5TTVQJuxb54BkIDk7d8jqzLq8pwl72vroqx352akci0O16j
Y/Ji/EzXdPbYH+Hcay/OsFQ0Ua/W86W6Oky1WfFBFf4Lk4/eOfiMVmpITXyoTdKNlziQupQ0tDUM
GQjnCD5gPCQL+WCPbU2zupHPV7bsE9PWBnCWSuspTueO/wn+9fzP9uJTrW7q6lnbpACbVFVvgQ3k
GTaMpxgBWRG4VK0iWIfnQzmb/6x1RHRYl/kEmIcSeU9Lrs5eAnZdZPVMoCqsGeAqWyUyvnJPaqly
69q7vgfwCsDOOy/tLRONE/sDS5qBwimykr4QzJ6zshQ8EL4ZGzP6wvl9Mw/HrBPCqQUMQzymTMpw
ibktS53DTvdOa6YR1CRlMZGZaSoD/9zxP4dta+9Igm30iRVZmSmvwLo0vsLfiCECCqvCNnRsZgpQ
GEE3NKVeDCwNTd5hM8kiXoKaj0Rk189Jfi9ESwZynaKTFKD8/gHU1SduHLebYP3eG7vIrnpS0LJV
zvyjeoGBoRSaLPebHmRudoMUeJZ6rYV1ifZx6LqTEpCvik9uw2YSknI12BR8mnIlgJFZgXkTIqj7
bhq3G0dQ35wGs0zy7azLwVmaGYJ6qiUvqrg4lptiFI9DBGQCUW3zUKVjyFFqiO8f2KQ2ElOHZTOn
OjsQVVosri/NmkHdwciBRaWvBKUcubXr2DSZSVszRbS2xv+F4olRBHfja4MOFkEy1rXZJYmgtCJQ
1JcIMLHJwsSbfGFs3o+q7FN1NmZxHEjXWMNYe5Damm9OANWNLPVsBTgyX1MzK8uXYqxMTbombZLx
QQcHKH1WsbnXW+MyUTHaLFr7CtYqbn41oDTl0r8xNPkMrgfM1XkByMayhmPYzRe1NCLQ0+RKUkLQ
BCXkUR/a/an53xi2vVsr3hFIqRzXJgYIdZ2Vol+Ue071+VeyY9BHeXRJW9eRbYmZhEMBELO+5i70
HKSUnmpZECxkYAkZADY6hjV7vhKHMP8+q9o+dURZK5zAk1rjX9iqGMxuAuaRAhlU51ikVkzxPnTI
+hvBC+8PoEbm5XWrysUNJPSVg1nBBsZcYzYMyw6QF1byncdWEvgxBdSrDh6G7XGLoM4U0Ry4hPG3
JIGP9MXa3Fxi6pCtFestoFiYDhKQNBUxzbZ2q8Q0r6urZlGFvGwI8bVXCheGJK8rOy1XK24gK6aj
TmREJ6drQY3W6qZkrd7cpbWSbkAGrLwN5U5j4WtiQLZWvcoj5p6BNUsM0goWOJQmXwSmgFoloECQ
9FdYoXy8YKhjq5qgMVO8F601qElbK6h6PRUzaYa6WsUES1UzQxYuSraS2Eqhq8RFZmL6wo5i0MrN
1oPj0s3L6wQq64TQziDEFQe5ylcBOk9CTgBnj1IWamCuATvjzwSoUQLuGSXgyKa+aAYmVO9agB2K
KsiY5pqzkk4Dg9VKc/t5ISbELq+nCagQ5dcxMPoUNhVS+HTMfNuIuYPqhUEELWQJABqaKoDPIGM1
izzwNT51+9AI7Kl7NmuryFYzc4c6RIc7gWyxCGQ/P7M9xGxJZCqFJBU9kGX1SpeSrZzju7C/gOR/
zyxlaSqu5NzX2uBSxpZaXfG1aC1KJgfQo0k7skF1pr3S+f6MWivVrCfeTFeBFekfqiiMtTulNGWm
xGVtgqHaMS4rfH4VYygmxjdsa5ox/yYkh9anoFcsFdnrtzSgekA9W3dOvTRq61vz0ytWseKpKhZN
TkxDvQiC7hwmbrwSe1exCpZrp1TPK9ZbUeu3+swLrQVeCKrm8hGLav4XCt9KUlvze3hnZ7rpZpqa
tfX8e09N49kELLW/ZFZOVZcT7wiVHLCARspDMm+IxBdXrHUG5BpJKrJbSYpYnQ2NXlXG2cxqsuoc
8rwmqJWtRzr2ilkrfnKtElgLx7VzPkXY3KtKQ11sEdrai1QrYoUvV3J5MfW9FFLyUa6wW6uXKN7o
Ma68e6CUEtv1sCyr2S2oXHPL/QHQc688MUXVDQEs6yrLwhTImFPVnBCKKhCZlSRSqWUdY4DiZsv7
q/xqk4yqzwEViAVbdUVMDoqerFJFJ3A4WSzOSmsVC2vx2ioF0UQPKcrmHswcbJA5Qut2aYBB9A+R
qovq7hEs1fx6dlStCnGCMCXADWUQctZ4ucoc1Xpq7+G1dd+t94cFFkvQMnN/qB41MzTRJy45V7OT
itFQGZmdQZlyWbsuyJoGZAU5BGPRRyiZ29SIn2aJPQ0sazjcUKFYb7LisXEoZa4JzKpcdRaRLQsj
wmA8z6+v0ybfh6lOinkfrCFWXHn6m7MdalLGcGzoWaC6Qd4v94GxL382Mjjz61xj6jiDGUVqH7Su
veuhcLrzrz9l9ABgO6ACVbO0hKwkYwOL9DkjUyOliatdXUI0p7ps4E5r1tCoRFl5PJIxCJDUNCRq
6y7Unm9Wx9+0GzASA1JzSJtO+2raiXhpjQFaoi8aI97AAFqlvkxDadIXDjA5hwzBWFKEdyK2U5xm
96Zec8s3w0/vBqaBZWun4ESBi9czU2oqwVU6igpgo2NOhCYCK54zrQdZnMDaYWhD1Rso0t6DXXVR
X3Xw7qCvISloVvrlmRAKTyl1Vg0mLczFUqFqJgczCQDVhcFZK/1VqnYZ/dJEdk2Y96bVpbM3rW7U
uoZdgRr19cHwPOgrkfwSeglmvfIa6sVuUVa49N8RaIBW81epMxSRpkcvNrV+QsNXEOCsfs+hkb9d
D6ZogE2AUNeaTKxzbQxmkLrZ/o0WIssP6cnCWga0PNnWjNp15Ho9cW0LnCqo7AVYEj2s0Obxvc9H
sEe4NDcIVeTDZj56m94bS2Ign95mja6h6TjAz01977snUDmwxBkr2MWzLD0AAzdcNKkmrN7IR7xM
zlftTf/sRXtr+Dc2Aa0TecuuPYOagd0vpECnd6iiJNos7i30hR1Voy7t22X0N/UpwUSpGI0bQKi+
T+sKLgrUDOx1hx8OPra1W4qVVjXL3IGNL2xrnh3PRr0lnDYtz4R2BQ50oOWfY/+tg4sGNT/2jT7W
A+yBlX1cZF98M+OapoS36dpowZ6wOQQz4jh1Xh6gHUumCkYqcF3SaZTbo4/1rPVFmI3dLRN/ZUJu
g6whWCML8zAgcUyuMRDrOmd1BetczecO9mdtOHYLLvFjWg5gcz0WOsGEptg5xVLqSwbOXNtA1wpE
d3V90/bBL8D2DZ+/9KByOfDMPX/iNyGItVp7kQ+i/g3ADRG+CWQ9GdIyq5xI47vp0mpq1x3c+WAA
+PyJpwxw4RKw2NBgAuj/CRKY0PtOBWvqWtifPPEsvfZz3/kop6ZrcB8aZeGHQRb2SM2OLtPm18ha
RcMaljT1XuifY9y/7+avwzXj9pEztQ1kh+Hglx8NJUTPWllK7PwhnB6ws1f3mDgnTjCS92Q0PRzy
mkJpdNTT1b5P//9B5eDm3gQP7Lm/P5FGxNDuiYubckrqH0SdVFnUfa0bXgGPrfC7haWXDdSGvfc+
GvrBvL/dSWNkZ2svTfU1TYwBM4G1Ahx2WhKOseIbcO2dDxSGLgZUrrve33KPGwGOIPfneeEM9k4x
GKdtGUnrFJv64QCory9bj8WAOikToY+sfeyIkd84W13tFzf/UQhvEXtA8sf/BBgA6XBNiyC715sA
AAAASUVORK5CYII=" transform="matrix(0.48 0 0 0.48 398.5995 743.4522)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="403.5" y="748.8" class="st206" width="14.2" height="1"/>

    <linearGradient id="SVGID_00000162338088490536388870000013710542429526975124_" gradientUnits="userSpaceOnUse" x1="2810.0544" y1="-8232.5771" x2="2810.0544" y2="-8219.2676" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 8636.3174 3560.5017)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="403.2" y="749" style="fill:url(#SVGID_00000162338088490536388870000013710542429526975124_);" width="14.6" height="3"/>
    <rect x="416.1" y="751.8" class="st206" width="0.7" height="0.5"/>
    <rect x="413.1" y="751.8" class="st206" width="0.7" height="0.5"/>
    <rect x="410" y="751.8" class="st206" width="0.7" height="0.5"/>
    <rect x="407" y="751.8" class="st206" width="0.7" height="0.5"/>
    <rect x="404" y="751.8" class="st206" width="0.7" height="0.5"/>
    <rect x="433.9" y="768.2" class="st206" width="1" height="14.2"/>

    <linearGradient id="SVGID_00000014599718949086171480000010541833829855359928_" gradientUnits="userSpaceOnUse" x1="2308.5645" y1="-8084.4175" x2="2308.5645" y2="-8071.1079" gradientTransform="matrix(1 0 0 1 -1875.28 8852.9199)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="431.8" y="768" style="fill:url(#SVGID_00000014599718949086171480000010541833829855359928_);" width="3" height="14.6"/>
    <rect x="431.4" y="780.9" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="777.8" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="774.8" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="771.8" class="st206" width="0.5" height="0.7"/>
    <rect x="431.4" y="768.7" class="st206" width="0.5" height="0.7"/>
    <g>
			<defs>
				<path id="SVGID_00000147898905024206312620000016728432257835004596_" d="M590.2,281.1c-5.4,0-8.4-3.2-8.4-8.5v-11.1h-13.9v15
					c0,10.1,8.2,18.3,18.4,18.4H598v-13.8H590.2z"/>
			</defs>
      <clipPath id="SVGID_00000141433081528112033930000011470413811897387176_">
				<use xlink:href="#SVGID_00000147898905024206312620000016728432257835004596_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000141433081528112033930000011470413811897387176_);">
				<g>
					<defs>
						<rect id="SVGID_00000002376681541798973470000004184319471476968625_" x="562.9" y="256.5" width="40.1" height="43.4"/>
					</defs>
          <clipPath id="SVGID_00000029757039983756420050000018414111539154223520_">
						<use xlink:href="#SVGID_00000002376681541798973470000004184319471476968625_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000029757039983756420050000018414111539154223520_);">

							<image style="overflow:visible;enable-background:new    ;" width="84" height="91" xlink:href="data:image/png;base64,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
AAAASUVORK5CYII=" transform="matrix(0.48 0 0 0.48 562.7595 256.2522)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="567.6" y="261.5" class="st206" width="14.1" height="1"/>

    <linearGradient id="SVGID_00000031905914597793397480000009918526875447902608_" gradientUnits="userSpaceOnUse" x1="3297.3545" y1="-8068.4575" x2="3297.3545" y2="-8055.1382" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 8636.3174 3560.5017)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="567.4" y="261.7" style="fill:url(#SVGID_00000031905914597793397480000009918526875447902608_);" width="14.6" height="3"/>
    <rect x="580.2" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="577.2" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="574.2" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="571.1" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="568.1" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="598" y="280.9" class="st206" width="1" height="14.1"/>

    <linearGradient id="SVGID_00000114796383376246754360000015160633495947519660_" gradientUnits="userSpaceOnUse" x1="2472.6846" y1="-8571.7178" x2="2472.6846" y2="-8558.4072" gradientTransform="matrix(1 0 0 1 -1875.28 8852.9199)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="595.9" y="280.7" style="fill:url(#SVGID_00000114796383376246754360000015160633495947519660_);" width="3" height="14.6"/>
    <rect x="595.6" y="293.6" class="st206" width="0.5" height="0.7"/>
    <rect x="595.6" y="290.5" class="st206" width="0.5" height="0.7"/>
    <rect x="595.6" y="287.5" class="st206" width="0.5" height="0.7"/>
    <rect x="595.6" y="284.5" class="st206" width="0.5" height="0.7"/>
    <rect x="595.6" y="281.4" class="st206" width="0.5" height="0.7"/>

    <linearGradient id="SVGID_00000054264873753846849680000015278365733963836574_" gradientUnits="userSpaceOnUse" x1="5190.7744" y1="-5987.8281" x2="5190.7744" y2="-5976.5479" gradientTransform="matrix(6.123234e-17 1 -1 6.123234e-17 -4778.3481 -4976.2671)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1197.2" y="166.2" style="fill:url(#SVGID_00000054264873753846849680000015278365733963836574_);" width="13.8" height="96.7"/>
    <g>
			<defs>
				<path id="SVGID_00000153677190638219912110000002098295740335661991_" d="M1188.7,147.6c5.3,0,8.3,3.2,8.3,8.5v11.1h13.9v-15
					c0-10.1-8.2-18.3-18.3-18.3h-11.8v13.7H1188.7z"/>
			</defs>
      <clipPath id="SVGID_00000109751358473069654960000008418470750835295652_">
				<use xlink:href="#SVGID_00000153677190638219912110000002098295740335661991_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000109751358473069654960000008418470750835295652_);">
				<g>
					<defs>
						<rect id="SVGID_00000176010992453495744010000004612242212640459411_" x="1175.9" y="128.8" width="40.1" height="43.4"/>
					</defs>
          <clipPath id="SVGID_00000072260976634653987960000002437344895281647008_">
						<use xlink:href="#SVGID_00000176010992453495744010000004612242212640459411_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000072260976634653987960000002437344895281647008_);">

							<image style="overflow:visible;enable-background:new    ;" width="84" height="91" xlink:href="data:image/png;base64,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
gg==" transform="matrix(0.48 0 0 0.48 1175.7195 128.5722)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="1197.1" y="166.2" class="st206" width="14.2" height="1"/>

    <linearGradient id="SVGID_00000145041221441240028970000011401747440784562566_" gradientUnits="userSpaceOnUse" x1="2317.4045" y1="-7234.6279" x2="2317.4045" y2="-7221.3179" gradientTransform="matrix(6.123234e-17 1 -1 6.123234e-17 -6023.6685 -2151.8674)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1196.8" y="164.1" style="fill:url(#SVGID_00000145041221441240028970000011401747440784562566_);" width="14.6" height="3"/>
    <rect x="1197.9" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="1200.9" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="1203.9" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="1207" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="1210" y="163.7" class="st206" width="0.7" height="0.5"/>
    <rect x="1179.8" y="133.6" class="st206" width="1" height="14.2"/>

    <linearGradient id="SVGID_00000024001880584175563150000017991351907328253887_" gradientUnits="userSpaceOnUse" x1="3306.5146" y1="-7591.7681" x2="3306.5146" y2="-7578.4575" gradientTransform="matrix(-1 0 0 -1 4487.9292 -7444.2856)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1179.9" y="133.4" style="fill:url(#SVGID_00000024001880584175563150000017991351907328253887_);" width="3" height="14.6"/>
    <rect x="1182.8" y="134.4" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.8" y="137.4" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.8" y="140.5" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.8" y="143.5" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.8" y="146.5" class="st206" width="0.5" height="0.7"/>
    <g>
			<defs>
				<path id="SVGID_00000173148211639258856900000003854169907765090486_" d="M1188.8,281.1c5.3,0,8.3-3.2,8.3-8.5v-11.1h14v15
					c0,10.1-8.2,18.3-18.3,18.4H1181v-13.8H1188.8z"/>
			</defs>
      <clipPath id="SVGID_00000032640036244466126670000009641746794448731272_">
				<use xlink:href="#SVGID_00000173148211639258856900000003854169907765090486_"  style="overflow:visible;"/>
			</clipPath>
      <g style="clip-path:url(#SVGID_00000032640036244466126670000009641746794448731272_);">
				<g>
					<defs>
						<rect id="SVGID_00000108292169379673559650000000867484108924473507_" x="1176" y="256.5" width="40.1" height="43.4"/>
					</defs>
          <clipPath id="SVGID_00000161592340094604255590000007866803725744966331_">
						<use xlink:href="#SVGID_00000108292169379673559650000000867484108924473507_"  style="overflow:visible;"/>
					</clipPath>
          <g style="clip-path:url(#SVGID_00000161592340094604255590000007866803725744966331_);">

							<image style="overflow:visible;enable-background:new    ;" width="85" height="91" xlink:href="data:image/png;base64,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" transform="matrix(0.48 0 0 0.48 1175.7195 256.2522)">
						</image>
					</g>
				</g>
			</g>
		</g>
    <rect x="1197.2" y="261.5" class="st206" width="14.1" height="1"/>

    <linearGradient id="SVGID_00000036209464482334447450000016956082561964420799_" gradientUnits="userSpaceOnUse" x1="3297.3545" y1="-7234.7578" x2="3297.3545" y2="-7221.4478" gradientTransform="matrix(6.123234e-17 -1 -1 -6.123234e-17 -6023.6582 3560.5017)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1197" y="261.7" style="fill:url(#SVGID_00000036209464482334447450000016956082561964420799_);" width="14.6" height="3"/>
    <rect x="1198" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="1201" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="1204.1" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="1207.1" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="1210.1" y="264.5" class="st206" width="0.7" height="0.5"/>
    <rect x="1179.9" y="280.9" class="st206" width="1" height="14.1"/>

    <linearGradient id="SVGID_00000157309639255936185140000017926088403827625640_" gradientUnits="userSpaceOnUse" x1="3306.3945" y1="-8571.7178" x2="3306.3945" y2="-8558.4072" gradientTransform="matrix(-1 0 0 1 4487.939 8852.9102)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1180.1" y="280.7" style="fill:url(#SVGID_00000157309639255936185140000017926088403827625640_);" width="3" height="14.6"/>
    <rect x="1182.9" y="293.6" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.9" y="290.5" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.9" y="287.5" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.9" y="284.5" class="st206" width="0.5" height="0.7"/>
    <rect x="1182.9" y="281.4" class="st206" width="0.5" height="0.7"/>
    <rect x="568.3" y="768.4" class="st99" width="0.8" height="13.8"/>

    <linearGradient id="SVGID_00000169518472841331925780000001680015300906815361_" gradientUnits="userSpaceOnUse" x1="9948.8047" y1="-1909.8077" x2="9948.8047" y2="-1897.1478" gradientTransform="matrix(1 0 0 1 -9380.1504 2678.6299)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="568.3" y="768.3" style="fill:url(#SVGID_00000169518472841331925780000001680015300906815361_);" width="0.7" height="13.9"/>
    <circle class="st99" cx="568.6" cy="768.8" r="0.2"/>

    <linearGradient id="SVGID_00000166640535348742941560000014591350665828252605_" gradientUnits="userSpaceOnUse" x1="-550.8624" y1="1993.2325" x2="-550.4424" y2="1993.2325" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000166640535348742941560000014591350665828252605_);" cx="568.6" cy="768.8" r="0.2"/>
    <circle class="st99" cx="568.6" cy="771.4" r="0.2"/>

    <linearGradient id="SVGID_00000018207483541951913820000016611600474406907796_" gradientUnits="userSpaceOnUse" x1="-551.7924" y1="1990.7847" x2="-551.3724" y2="1990.7847" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000018207483541951913820000016611600474406907796_);" cx="568.6" cy="771.4" r="0.2"/>
    <circle class="st99" cx="568.6" cy="774" r="0.2"/>

    <linearGradient id="SVGID_00000023248631537068154120000001500163248187146633_" gradientUnits="userSpaceOnUse" x1="-552.7224" y1="1988.3368" x2="-552.3024" y2="1988.3368" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000023248631537068154120000001500163248187146633_);" cx="568.6" cy="774" r="0.2"/>
    <circle class="st99" cx="568.6" cy="776.6" r="0.2"/>

    <linearGradient id="SVGID_00000079486899543395613870000002446108639760139911_" gradientUnits="userSpaceOnUse" x1="-553.6524" y1="1985.8796" x2="-553.2324" y2="1985.8796" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000079486899543395613870000002446108639760139911_);" cx="568.6" cy="776.6" r="0.2"/>
    <circle class="st99" cx="568.6" cy="779.2" r="0.2"/>

    <linearGradient id="SVGID_00000147206393578526058870000005071293509914173098_" gradientUnits="userSpaceOnUse" x1="-554.5824" y1="1983.4318" x2="-554.1624" y2="1983.4318" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000147206393578526058870000005071293509914173098_);" cx="568.6" cy="779.2" r="0.2"/>
    <circle class="st99" cx="568.6" cy="781.9" r="0.2"/>

    <linearGradient id="SVGID_00000074430727847293735490000006332175965650819469_" gradientUnits="userSpaceOnUse" x1="-555.5124" y1="1980.9839" x2="-555.0924" y2="1980.9839" gradientTransform="matrix(-0.94 -0.35 0.35 -0.94 -652.6162 2447.4207)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000074430727847293735490000006332175965650819469_);" cx="568.6" cy="781.9" r="0.2"/>
    <rect x="570.4" y="768.4" class="st99" width="1" height="13.9"/>

    <linearGradient id="SVGID_00000111910201007210487000000014674788056205529775_" gradientUnits="userSpaceOnUse" x1="-92.9505" y1="-1281.0377" x2="-92.9505" y2="-1268.0079" gradientTransform="matrix(1 0 0 1 664.95 2049.6799)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="570.5" y="768.1" style="fill:url(#SVGID_00000111910201007210487000000014674788056205529775_);" width="2.9" height="14.3"/>
    <rect x="573.3" y="769.2" class="st99" width="0.5" height="0.7"/>
    <rect x="573.3" y="772.1" class="st99" width="0.5" height="0.7"/>
    <rect x="573.3" y="775.1" class="st99" width="0.5" height="0.7"/>
    <rect x="573.3" y="778.1" class="st99" width="0.5" height="0.7"/>
    <rect x="573.3" y="781" class="st99" width="0.5" height="0.7"/>

    <linearGradient id="SVGID_00000075147543691650254320000018057969139921263255_" gradientUnits="userSpaceOnUse" x1="10060.6299" y1="-1575.7279" x2="10060.6299" y2="-1573.5577" gradientTransform="matrix(0 -1 1 0 2620.4873 10193.9424)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000075147543691650254320000018057969139921263255_);" d="M1047,132.6v1.2l0,0
			c0,0.1-0.5,0.2-1.2,0.2c-0.6,0-1.2-0.1-1.2-0.2l0,0v-1.2H1047z"/>
    <path class="st97" d="M1044.6,133.4c0,0,0,0.4-0.4,0.4h0.4V133.4z"/>
    <path class="st98" d="M1047.4,133.8c0,0-0.4,0-0.4-0.4v0.4H1047.4z"/>
    <rect x="1044.6" y="133.1" class="st99" width="2.3" height="0.1"/>

    <linearGradient id="SVGID_00000083804443702319514000000015271925840048958081_" gradientUnits="userSpaceOnUse" x1="10060.7539" y1="-1575.7579" x2="10060.7539" y2="-1573.6078" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 2620.4873 10193.9414)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1044.6" y="133.1" style="fill:url(#SVGID_00000083804443702319514000000015271925840048958081_);" width="2.4" height="0.1"/>
    <circle class="st99" cx="1044.7" cy="133.2" r="0"/>

    <linearGradient id="SVGID_00000114789515336112537170000013107653195501113233_" gradientUnits="userSpaceOnUse" x1="-773.5633" y1="1720.0217" x2="-773.4933" y2="1720.0217" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000114789515336112537170000013107653195501113233_);" cx="1044.7" cy="133.2" r="0"/>
    <circle class="st99" cx="1045.2" cy="133.2" r="0"/>

    <linearGradient id="SVGID_00000016076273233361449810000001873976721756533439_" gradientUnits="userSpaceOnUse" x1="-773.7233" y1="1719.6013" x2="-773.6433" y2="1719.6013" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000016076273233361449810000001873976721756533439_);" cx="1045.2" cy="133.2" r="0"/>
    <circle class="st99" cx="1045.6" cy="133.2" r="0"/>

    <linearGradient id="SVGID_00000021801361988924395770000017972799297321979569_" gradientUnits="userSpaceOnUse" x1="-773.8733" y1="1719.1809" x2="-773.8033" y2="1719.1809" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000021801361988924395770000017972799297321979569_);" cx="1045.6" cy="133.2" r="0"/>
    <circle class="st99" cx="1046" cy="133.2" r="0"/>

    <linearGradient id="SVGID_00000098223020250641234720000006433724717873419660_" gradientUnits="userSpaceOnUse" x1="-774.0333" y1="1718.7699" x2="-773.9633" y2="1718.7699" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000098223020250641234720000006433724717873419660_);" cx="1046" cy="133.2" r="0"/>
    <circle class="st99" cx="1046.5" cy="133.2" r="0"/>

    <linearGradient id="SVGID_00000143603339216106280430000005553995226680941758_" gradientUnits="userSpaceOnUse" x1="-774.1933" y1="1718.3494" x2="-774.1233" y2="1718.3494" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000143603339216106280430000005553995226680941758_);" cx="1046.5" cy="133.2" r="0"/>
    <circle class="st99" cx="1046.9" cy="133.2" r="0"/>

    <linearGradient id="SVGID_00000008113238051632711220000005083499737722301326_" gradientUnits="userSpaceOnUse" x1="-774.3533" y1="1717.9384" x2="-774.2833" y2="1717.9384" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000008113238051632711220000005083499737722301326_);" cx="1046.9" cy="133.2" r="0"/>
    <rect x="1044.6" y="132.7" class="st99" width="2.3" height="0.2"/>

    <linearGradient id="SVGID_00000077286492746873472390000013356828181828095933_" gradientUnits="userSpaceOnUse" x1="-211.3355" y1="-1926.2279" x2="-211.3355" y2="-1924.0079" gradientTransform="matrix(6.123234e-17 1 -1 6.123234e-17 -879.2683 343.9528)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1044.6" y="132.4" style="fill:url(#SVGID_00000077286492746873472390000013356828181828095933_);" width="2.4" height="0.5"/>
    <rect x="1044.8" y="132.3" class="st99" width="0.1" height="0.1"/>
    <rect x="1045.3" y="132.3" class="st99" width="0.1" height="0.1"/>
    <rect x="1045.8" y="132.3" class="st99" width="0.1" height="0.1"/>
    <rect x="1046.3" y="132.3" class="st99" width="0.1" height="0.1"/>
    <rect x="1046.8" y="132.3" class="st99" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000152251696256550559830000001443406124213034916_" gradientUnits="userSpaceOnUse" x1="9913.4951" y1="-1575.7279" x2="9913.4951" y2="-1573.5577" gradientTransform="matrix(0 -1 1 0 2620.4873 10193.9424)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000152251696256550559830000001443406124213034916_);" d="M1047,279.8v1.2l0,0
			c0,0.1-0.5,0.2-1.2,0.2c-0.6,0-1.2-0.1-1.2-0.2l0,0v-1.2H1047z"/>
    <path class="st97" d="M1044.7,280.6c0,0,0,0.4-0.4,0.4h0.4V280.6z"/>
    <path class="st98" d="M1047.4,281c0,0-0.4,0-0.4-0.4v0.4H1047.4z"/>
    <rect x="1044.6" y="280.3" class="st99" width="2.4" height="0.1"/>

    <linearGradient id="SVGID_00000130631675745858822320000010462335656683689151_" gradientUnits="userSpaceOnUse" x1="9913.6143" y1="-1575.7579" x2="9913.6143" y2="-1573.6078" gradientTransform="matrix(6.123234e-17 -1 1 6.123234e-17 2620.4873 10193.9414)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1044.6" y="280.3" style="fill:url(#SVGID_00000130631675745858822320000010462335656683689151_);" width="2.4" height="0.1"/>
    <circle class="st99" cx="1044.7" cy="280.3" r="0"/>

    <linearGradient id="SVGID_00000042718388436195053380000010674854280517978300_" gradientUnits="userSpaceOnUse" x1="-635.9833" y1="1668.8291" x2="-635.9133" y2="1668.8291" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000042718388436195053380000010674854280517978300_);" cx="1044.7" cy="280.3" r="0"/>
    <circle class="st99" cx="1045.2" cy="280.3" r="0"/>

    <linearGradient id="SVGID_00000091730440391444953710000012837360579886760894_" gradientUnits="userSpaceOnUse" x1="-636.1433" y1="1668.4181" x2="-636.0733" y2="1668.4181" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000091730440391444953710000012837360579886760894_);" cx="1045.2" cy="280.3" r="0"/>
    <circle class="st99" cx="1045.6" cy="280.3" r="0"/>

    <linearGradient id="SVGID_00000103258829019745121640000002595456967939002041_" gradientUnits="userSpaceOnUse" x1="-636.3033" y1="1667.9977" x2="-636.2333" y2="1667.9977" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000103258829019745121640000002595456967939002041_);" cx="1045.6" cy="280.3" r="0"/>
    <circle class="st99" cx="1046" cy="280.3" r="0"/>

    <linearGradient id="SVGID_00000088838159172705578650000002857319324902699182_" gradientUnits="userSpaceOnUse" x1="-636.4633" y1="1667.5865" x2="-636.3933" y2="1667.5865" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000088838159172705578650000002857319324902699182_);" cx="1046" cy="280.3" r="0"/>
    <circle class="st99" cx="1046.5" cy="280.3" r="0"/>

    <linearGradient id="SVGID_00000020388829969933623510000015601230370265096126_" gradientUnits="userSpaceOnUse" x1="-636.6133" y1="1667.1661" x2="-636.5433" y2="1667.1661" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000020388829969933623510000015601230370265096126_);" cx="1046.5" cy="280.3" r="0"/>
    <circle class="st99" cx="1046.9" cy="280.3" r="0"/>

    <linearGradient id="SVGID_00000093142766164864114340000004386773286935905452_" gradientUnits="userSpaceOnUse" x1="-636.7733" y1="1666.755" x2="-636.7033" y2="1666.755" gradientTransform="matrix(-0.35 0.94 -0.94 -0.35 2389.2678 1466.418)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000093142766164864114340000004386773286935905452_);" cx="1046.9" cy="280.3" r="0"/>
    <rect x="1044.6" y="279.9" class="st99" width="2.4" height="0.2"/>

    <linearGradient id="SVGID_00000021084347508909954700000004734235290758816152_" gradientUnits="userSpaceOnUse" x1="-64.2055" y1="-1926.2279" x2="-64.2055" y2="-1924.0179" gradientTransform="matrix(6.123234e-17 1 -1 6.123234e-17 -879.2682 343.9528)">
			<stop  offset="0" style="stop-color:#F0B64C"/>
      <stop  offset="0.52" style="stop-color:#EEBB63"/>
      <stop  offset="1" style="stop-color:#DE9227"/>
		</linearGradient>

    <rect x="1044.6" y="279.5" style="fill:url(#SVGID_00000021084347508909954700000004734235290758816152_);" width="2.4" height="0.5"/>
    <rect x="1044.8" y="279.5" class="st99" width="0.1" height="0.1"/>
    <rect x="1045.3" y="279.5" class="st99" width="0.1" height="0.1"/>
    <rect x="1045.8" y="279.4" class="st99" width="0.1" height="0.1"/>
    <rect x="1046.3" y="279.5" class="st99" width="0.1" height="0.1"/>
    <rect x="1046.8" y="279.4" class="st99" width="0.1" height="0.1"/>

    <linearGradient id="SVGID_00000095337097692159828260000000878698621729814942_" gradientUnits="userSpaceOnUse" x1="10407.9844" y1="-3350.8079" x2="10407.9844" y2="-3348.7976" gradientTransform="matrix(-1 0 0 -1 11474.0195 -3265.3955)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000095337097692159828260000000878698621729814942_);" d="M1065.4,83.3h1.1c0.1,0,0.2,0.5,0.2,1.1
			s-0.1,1.1-0.2,1.1h-1.1V83.3z"/>
    <path class="st20" d="M1066.1,85.5c0,0,0.4,0,0.4,0.4v-0.4H1066.1z"/>
    <path class="st21" d="M1066.5,82.9c0,0,0,0.4-0.4,0.4h0.4V82.9z"/>
    <rect x="1065.9" y="83.3" class="st4" width="0.1" height="2.2"/>

    <linearGradient id="SVGID_00000156583916973673180710000015445559696882016132_" gradientUnits="userSpaceOnUse" x1="10408.0996" y1="-3350.8376" x2="10408.0996" y2="-3348.8479" gradientTransform="matrix(-1 0 0 -1 11474.0186 -3265.3955)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="1065.9" y="83.3" style="fill:url(#SVGID_00000156583916973673180710000015445559696882016132_);" width="0.1" height="2.2"/>
    <circle class="st4" cx="1065.9" cy="83.4" r="0"/>

    <linearGradient id="SVGID_00000054966678330346225260000016915193258582042511_" gradientUnits="userSpaceOnUse" x1="-472.7486" y1="3497.3818" x2="-472.6886" y2="3497.3818" gradientTransform="matrix(0.94 0.35 -0.35 0.94 2746.4951 -3034.1763)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000054966678330346225260000016915193258582042511_);" cx="1065.9" cy="83.4" r="0"/>
    <circle class="st4" cx="1065.9" cy="83.8" r="0"/>

    <linearGradient id="SVGID_00000076591741623226213660000010806691464386398395_" gradientUnits="userSpaceOnUse" x1="-472.6086" y1="3497.7649" x2="-472.5386" y2="3497.7649" gradientTransform="matrix(0.94 0.35 -0.35 0.94 2746.4951 -3034.1763)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000076591741623226213660000010806691464386398395_);" cx="1065.9" cy="83.8" r="0"/>
    <circle class="st4" cx="1065.9" cy="84.2" r="0"/>

    <linearGradient id="SVGID_00000176003171339730942890000012865986010538550950_" gradientUnits="userSpaceOnUse" x1="-472.4585" y1="3498.1572" x2="-472.3985" y2="3498.1572" gradientTransform="matrix(0.94 0.35 -0.35 0.94 2746.4951 -3034.1763)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000176003171339730942890000012865986010538550950_);" cx="1065.9" cy="84.2" r="0"/>
    <circle class="st4" cx="1065.9" cy="84.6" r="0"/>

    <linearGradient id="SVGID_00000161595819810771297020000007569541773478514069_" gradientUnits="userSpaceOnUse" x1="-472.3186" y1="3498.5403" x2="-472.2486" y2="3498.5403" gradientTransform="matrix(0.94 0.35 -0.35 0.94 2746.4951 -3034.1763)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000161595819810771297020000007569541773478514069_);" cx="1065.9" cy="84.6" r="0"/>
    <circle class="st4" cx="1065.9" cy="85" r="0"/>

    <linearGradient id="SVGID_00000089553467294650061800000002854133159601617059_" gradientUnits="userSpaceOnUse" x1="-472.1685" y1="3498.9233" x2="-472.0985" y2="3498.9233" gradientTransform="matrix(0.94 0.35 -0.35 0.94 2746.4951 -3034.1763)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000089553467294650061800000002854133159601617059_);" cx="1065.9" cy="85" r="0"/>
    <circle class="st4" cx="1065.9" cy="85.5" r="0"/>

    <linearGradient id="SVGID_00000039114015062008505890000013287515434871662485_" gradientUnits="userSpaceOnUse" x1="-472.0185" y1="3499.3064" x2="-471.9585" y2="3499.3064" gradientTransform="matrix(0.94 0.35 -0.35 0.94 2746.4951 -3034.1763)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="1" style="stop-color:#D9D6C3"/>
		</linearGradient>
    <circle style="fill:url(#SVGID_00000039114015062008505890000013287515434871662485_);" cx="1065.9" cy="85.5" r="0"/>
    <rect x="1065.5" y="83.3" class="st4" width="0.2" height="2.2"/>

    <linearGradient id="SVGID_00000096022148606839975130000002664603192166687872_" gradientUnits="userSpaceOnUse" x1="-1105.9105" y1="-1810.4379" x2="-1105.9105" y2="-1808.3878" gradientTransform="matrix(-1 0 0 -1 -40.521 -1724.9655)">
			<stop  offset="0" style="stop-color:#969173"/>
      <stop  offset="1.000000e-02" style="stop-color:#979274"/>
      <stop  offset="0.48" style="stop-color:#D9D6C3"/>
      <stop  offset="0.56" style="stop-color:#DAD7C5"/>
      <stop  offset="1" style="stop-color:#DDD9CE"/>
		</linearGradient>

    <rect x="1065.2" y="83.3" style="fill:url(#SVGID_00000096022148606839975130000002664603192166687872_);" width="0.5" height="2.2"/>
    <rect x="1065.1" y="85.3" class="st4" width="0.1" height="0.1"/>
    <rect x="1065.1" y="84.8" class="st4" width="0.1" height="0.1"/>
    <rect x="1065.1" y="84.4" class="st4" width="0.1" height="0.1"/>
    <rect x="1065.1" y="83.9" class="st4" width="0.1" height="0.1"/>
    <rect x="1065.1" y="83.4" class="st4" width="0.1" height="0.1"/>
    <line l="3" class="st375" x1="410.5" y1="263.6" x2="410.5" y2="545.5"/>
    <line   l="9" class="st375" x1="574.5" y1="168" x2="574.5" y2="234.5"/>
    <line   l="6" class="st375" x1="574.5" y1="234.6" x2="574.5" y2="261.4"/>
    <line  l="11" class="st375" x1="1204.2" y1="168" x2="1204.2" y2="234.5"/>
    <line  l="8" class="st375" x1="1204.2" y1="234.6" x2="1204.2" y2="261.4"/>
    <line l="2" class="st375" x1="393.8" y1="546.1" x2="136.3" y2="546.1"/>
    <line  l="4" class="st375" x1="558.8" y1="235.2" x2="428.9" y2="235.2"/>
    <line  l="5" class="st375" x1="1401.4" y1="223.6" x2="1220.7" y2="223.6"/>
    <line  l="10" class="st375" x1="1179.3" y1="141" x2="599.9" y2="141"/>
    <line    l="7" class="st375" x1="1179.3" y1="287.8" x2="599.9" y2="287.8"/>

    <linearGradient id="SVGID_00000002363049819617927270000004678387158824789888_" gradientUnits="userSpaceOnUse" x1="167.8896" y1="325.9088" x2="172.1796" y2="325.9488" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000002363049819617927270000004678387158824789888_);" d="M165.7,528.2v0.8h2
			c0.3,0.3,0.4,0.8,0.4,1.2v4h3.8v-4.1c0-0.4,0.1-0.8,0.4-1.1h1.8v-0.8H165.7z"/>

    <linearGradient id="SVGID_00000162311102067601653770000017654533523729989294_" gradientUnits="userSpaceOnUse" x1="-695.3055" y1="1098.3522" x2="-695.3055" y2="1116.2822" gradientTransform="matrix(-1 0 0 1 -544.621 -560.98)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="148.7" y="535.4" style="fill:url(#SVGID_00000162311102067601653770000017654533523729989294_);" width="4" height="20.9"/>

    <linearGradient id="SVGID_00000067208857784749787710000009813835179160872617_" gradientUnits="userSpaceOnUse" x1="-686.9355" y1="1098.3522" x2="-686.9355" y2="1116.2822" gradientTransform="matrix(-1 0 0 1 -497.741 -560.98)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="187.2" y="535.4" style="fill:url(#SVGID_00000067208857784749787710000009813835179160872617_);" width="4" height="20.9"/>

    <linearGradient id="SVGID_00000161632854067418828460000007180238710695099529_" gradientUnits="userSpaceOnUse" x1="169.9145" y1="321.1922" x2="169.9145" y2="300.1922" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path  :myid="nodeInfo[6].id" @click='changeState1(6)' style="cursor:pointer;fill:url(#SVGID_00000161632854067418828460000007180238710695099529_);" d="M184.7,538.6c-6-0.6-8.4-5-14.8-5
			s-10.2,5-15,5h-2.3v14.6h2.3c4.8,0,8.6,5,15,5c6.4,0,8.8-4.4,14.8-5h2.5v-14.6H184.7z"/>

    <linearGradient id="SVGID_00000129922660073621450240000014688470910053048759_" gradientUnits="userSpaceOnUse" x1="168.8895" y1="324.1022" x2="171.2795" y2="324.1022" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="168.9" y="527" style="fill:url(#SVGID_00000129922660073621450240000014688470910053048759_);" width="2.4" height="1.2"/>

    <linearGradient id="SVGID_00000011738172618452813600000006624345627186217652_" gradientUnits="userSpaceOnUse" x1="719.2395" y1="390.4572" x2="720.3495" y2="390.4572" gradientTransform="matrix(6.123234e-17 1 1 -6.123234e-17 -210.2927 -206.3173)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="179.3" y="512.9" style="fill:url(#SVGID_00000011738172618452813600000006624345627186217652_);" width="1.8" height="1.1"/>

    <linearGradient id="SVGID_00000073716776139565043820000011504663052637565577_" gradientUnits="userSpaceOnUse" x1="167.0895" y1="325.0022" x2="172.8795" y2="325.0022" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="167.1" y="526.4" style="fill:url(#SVGID_00000073716776139565043820000011504663052637565577_);" width="5.8" height="0.6"/>

    <linearGradient id="SVGID_00000016764668939814035450000018221572532286428578_" gradientUnits="userSpaceOnUse" x1="161.7095" y1="326.0922" x2="178.6595" y2="326.0922" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#999999"/>
      <stop  offset="0.5" style="stop-color:#808080"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>

    <rect x="161.7" y="524.8" style="fill:url(#SVGID_00000016764668939814035450000018221572532286428578_);" width="17" height="1.6"/>

    <linearGradient id="SVGID_00000150800300730508397730000002336321178519248262_" gradientUnits="userSpaceOnUse" x1="162.7595" y1="341.5772" x2="177.7195" y2="341.5772" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#999999"/>
      <stop  offset="0.5" style="stop-color:#808080"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000150800300730508397730000002336321178519248262_);" d="M175.2,506.1h-10c-1.4,0-2.5,1.1-2.5,2.5
			v1.4h0.6v15h13.8v-15h0.6v-1.4C177.7,507.2,176.6,506.1,175.2,506.1z"/>
    <path class="st131" d="M164.5,510.1L164.5,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3
			v-14.2C164.2,510.2,164.4,510.1,164.5,510.1z"/>
    <path class="st131" d="M166.2,510.1L166.2,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3
			v-14.2C165.9,510.2,166,510.1,166.2,510.1z"/>
    <path class="st131" d="M167.8,510.1L167.8,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3
			v-14.2C167.5,510.2,167.6,510.1,167.8,510.1z"/>
    <path class="st131" d="M169.4,510.1L169.4,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3
			v-14.2C169.1,510.2,169.2,510.1,169.4,510.1z"/>
    <path class="st131" d="M171,510.1L171,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3v-14.2
			C170.7,510.2,170.9,510.1,171,510.1z"/>
    <path class="st131" d="M172.7,510.1L172.7,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3
			v-14.2C172.4,510.2,172.5,510.1,172.7,510.1z"/>
    <path class="st131" d="M174.3,510.1L174.3,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3
			v-14.2C174,510.2,174.1,510.1,174.3,510.1z"/>
    <path class="st131" d="M175.9,510.1L175.9,510.1c0.2,0,0.3,0.1,0.3,0.3v14.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3
			v-14.2C175.6,510.2,175.7,510.1,175.9,510.1z"/>
    <path class="st385" d="M177.1,510.9L177.1,510.9c1.2,0,2.2,1,2.2,2.1l0,0v1.1c0,1.2-1,2.1-2.1,2.1c0,0,0,0,0,0h-0.1l0,0V510.9
			L177.1,510.9z"/>
    <rect x="181.1" y="512.8" class="st385" width="0.2" height="1.4"/>
    <path class="st34" d="M181.5,508.9L181.5,508.9c0.2,0,0.3,0.1,0.3,0.3v9.2c0,0.2-0.1,0.3-0.3,0.3h0c-0.2,0-0.3-0.1-0.3-0.3v-9.2
			C181.3,509,181.4,508.9,181.5,508.9z"/>

    <linearGradient id="SVGID_00000165944173088657035630000013082563833216401303_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="638.2372" x2="498.8895" y2="638.2372" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="497.7" y="210" style="fill:url(#SVGID_00000165944173088657035630000013082563833216401303_);" width="1.1" height="6.9"/>

    <linearGradient id="SVGID_00000114068198289328092870000001280693978677796224_" gradientUnits="userSpaceOnUse" x1="497.1595" y1="637.6722" x2="499.4695" y2="637.6722" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="497.2" y="213.6" style="fill:url(#SVGID_00000114068198289328092870000001280693978677796224_);" width="2.3" height="0.8"/>
    <rect x="497.3" y="214.4" class="st33" width="0.2" height="2.5"/>
    <rect x="499.1" y="214.4" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M498.2,211.5c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1s0.9-0.9,2.1-1.1
			c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4c1.2,0.2,2.1,0.4,2.1,1.1
			s-0.9,0.9-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C508.1,211.4,503.3,211.5,498.2,211.5z M482.7,209.7c3.1,0.3,8.3,0.5,15.5,0.5
			s12.4-0.2,15.5-0.5c-3.1-0.3-8.3-0.5-15.5-0.5S485.8,209.5,482.7,209.7L482.7,209.7z"/>
    <rect x="497" y="209.6" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="499.7,210 499.6,209.6 507,208.8 507.1,209.1 		"/>

    <rect x="492.3" y="203.4" transform="matrix(4.993762e-02 -0.9988 0.9988 4.993762e-02 258.6336 690.9403)" class="st34" width="0.4" height="12.3"/>

    <rect x="499" y="209.3" transform="matrix(0.5547 -0.8321 0.8321 0.5547 47.2293 509.023)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000130616634687983535190000017465699755492736130_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="642.217" x2="498.8995" y2="642.217" gradientTransform="matrix(1 0 0 -1 -3.054740e-02 857.1205)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000130616634687983535190000017465699755492736130_);" points="497.7,214.8 497.7,214.8
			498.9,215 498.9,215 		"/>

    <linearGradient id="SVGID_00000007407348808787914080000013243330652031257278_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="642.0262" x2="498.8995" y2="642.0262" gradientTransform="matrix(1 0 0 -1 -2.164999e-02 857.1211)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000007407348808787914080000013243330652031257278_);" points="497.7,215 497.7,215
			498.9,215.2 498.9,215.2 		"/>

    <linearGradient id="SVGID_00000011715334874957480920000007327099417062224802_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="641.8339" x2="498.8995" y2="641.8339" gradientTransform="matrix(1 0 0 -1 -2.258085e-02 857.1199)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000011715334874957480920000007327099417062224802_);" points="497.7,215.2 497.7,215.2
			498.9,215.4 498.9,215.4 		"/>

    <linearGradient id="SVGID_00000071547068507850429870000002754372847638121398_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="641.6399" x2="498.8995" y2="641.6399" gradientTransform="matrix(1 0 0 -1 -2.352697e-02 857.1188)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000071547068507850429870000002754372847638121398_);" points="497.7,215.4 497.7,215.4
			498.9,215.6 498.9,215.6 		"/>

    <linearGradient id="SVGID_00000002386129944847614630000002746561445374435469_" gradientUnits="userSpaceOnUse" x1="497.7397" y1="641.4476" x2="498.8997" y2="641.4476" gradientTransform="matrix(1 0 0 -1 -2.447310e-02 857.1177)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000002386129944847614630000002746561445374435469_);" points="497.7,215.6 497.7,215.5
			498.9,215.7 498.9,215.8 		"/>

    <linearGradient id="SVGID_00000018949629084091158290000007422881025779024558_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="641.2552" x2="498.8995" y2="641.2552" gradientTransform="matrix(1 0 0 -1 -2.542424e-02 857.1166)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000018949629084091158290000007422881025779024558_);" points="497.7,215.8 497.7,215.7
			498.9,215.9 498.9,216 		"/>

    <linearGradient id="SVGID_00000047059627085542030870000011704324292145977988_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="641.0629" x2="498.8995" y2="641.0629" gradientTransform="matrix(1 0 0 -1 -2.637036e-02 857.1155)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000047059627085542030870000011704324292145977988_);" points="497.7,216 497.7,215.9
			498.9,216.1 498.9,216.2 		"/>

    <linearGradient id="SVGID_00000143609270493795413240000017232512447544065446_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="640.8689" x2="498.8995" y2="640.8689" gradientTransform="matrix(1 0 0 -1 -1.730672e-02 857.1243)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000143609270493795413240000017232512447544065446_);" points="497.7,216.2 497.7,216.1
			498.9,216.3 498.9,216.4 		"/>

    <linearGradient id="SVGID_00000155131299124356227920000013476654176322499751_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="640.6766" x2="498.8995" y2="640.6766" gradientTransform="matrix(1 0 0 -1 -1.828294e-02 857.1232)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000155131299124356227920000013476654176322499751_);" points="497.7,216.4 497.7,216.3
			498.9,216.5 498.9,216.6 		"/>

    <linearGradient id="SVGID_00000172426409401044059150000006223214185006671781_" gradientUnits="userSpaceOnUse" x1="497.7395" y1="640.4842" x2="498.8995" y2="640.4842" gradientTransform="matrix(1 0 0 -1 -1.922907e-02 857.1221)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000172426409401044059150000006223214185006671781_);" points="497.7,216.6 497.7,216.5
			498.9,216.7 498.9,216.8 		"/>

    <linearGradient id="SVGID_00000008865572287568775230000006542049072282235035_" gradientUnits="userSpaceOnUse" x1="497.7398" y1="640.2919" x2="498.8998" y2="640.2919" gradientTransform="matrix(1 0 0 -1 -2.017519e-02 857.121)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000008865572287568775230000006542049072282235035_);" points="497.7,216.8 497.7,216.7
			498.9,216.9 498.9,216.9 		"/>

    <linearGradient id="SVGID_00000000220932261394935700000011396098150025658512_" gradientUnits="userSpaceOnUse" x1="496.2695" y1="634.3967" x2="500.4095" y2="634.4467" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000000220932261394935700000011396098150025658512_);" d="M494.2,219.8v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.1v3.9h3.6v-3.9c0-0.4,0.1-0.8,0.4-1.1h1.7v-0.8H494.2z"/>

    <linearGradient id="SVGID_00000021830777579591038940000008250727950698269333_" gradientUnits="userSpaceOnUse" x1="496.2495" y1="394.8761" x2="500.3895" y2="394.9261" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000021830777579591038940000008250727950698269333_);" d="M494.2,219.6v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.1v-0.8h2.1v0.9c0,0.4,0.1,0.8,0.4,1.1h2.5v0.8H494.2z"/>

    <linearGradient id="SVGID_00000067233907202281243310000013472401508363804813_" gradientUnits="userSpaceOnUse" x1="240.8745" y1="497.8822" x2="240.8745" y2="480.6422" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="477.9" y="225.2" style="fill:url(#SVGID_00000067233907202281243310000013472401508363804813_);" width="3.9" height="20.1"/>

    <linearGradient id="SVGID_00000176019812529905419000000003571322057353716110_" gradientUnits="userSpaceOnUse" x1="259.0545" y1="497.8822" x2="259.0545" y2="480.6422" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="514.8" y="225.2" style="fill:url(#SVGID_00000176019812529905419000000003571322057353716110_);" width="3.9" height="20.1"/>

    <linearGradient id="SVGID_00000008854835259533721750000017260205881431180967_" gradientUnits="userSpaceOnUse" x1="498.2445" y1="631.4022" x2="498.2445" y2="611.1922" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path :myid="nodeInfo[7].id"  @click="changeState1(7)" style="cursor:pointer;fill:url(#SVGID_00000008854835259533721750000017260205881431180967_);" d="M512.4,228.3c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8h-2.1v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H512.4z"/>

    <linearGradient id="SVGID_00000033327879580737419270000008734190290183409844_" gradientUnits="userSpaceOnUse" x1="1132.3695" y1="732.9172" x2="1133.5195" y2="732.9172" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1132.4" y="115.3" style="fill:url(#SVGID_00000033327879580737419270000008734190290183409844_);" width="1.2" height="6.9"/>

    <linearGradient id="SVGID_00000163046134031691934200000010623807591328248745_" gradientUnits="userSpaceOnUse" x1="1131.7894" y1="732.3522" x2="1134.0995" y2="732.3522" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1131.8" y="119" style="fill:url(#SVGID_00000163046134031691934200000010623807591328248745_);" width="2.3" height="0.8"/>
    <rect x="1132" y="119.7" class="st33" width="0.2" height="2.5"/>
    <rect x="1133.7" y="119.7" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M1132.8,116.9c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1
			c0-0.8,0.9-0.9,2.1-1.1c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4
			c1.2,0.2,2.1,0.3,2.1,1.1s-0.9,1-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C1142.7,116.7,1137.9,116.9,1132.8,116.9z M1117.4,115
			c3.1,0.3,8.3,0.5,15.5,0.5s12.4-0.2,15.5-0.5c-3.1-0.3-8.3-0.5-15.5-0.5S1120.4,114.8,1117.4,115z"/>
    <rect x="1131.6" y="114.9" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="1134.3,115.3 1134.3,114.9 1141.7,114.1 1141.7,114.5 		"/>

    <rect x="1125.4" y="108.7" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 958.2285 1233.8075)" class="st34" width="0.4" height="12.3"/>

    <rect x="1133.6" y="114.7" transform="matrix(0.5547 -0.8321 0.8321 0.5547 408.6165 994.9134)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000067199570726271943740000014760589991414389412_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="736.9299" x2="1133.5294" y2="736.9299" gradientTransform="matrix(1 0 0 -1 -4.303988e-02 857.1409)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000067199570726271943740000014760589991414389412_);" points="1132.3,120.1 1132.3,120.1
			1133.5,120.3 1133.5,120.3 		"/>

    <linearGradient id="SVGID_00000011712675223675638010000005955852266121733023_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="736.736" x2="1133.5294" y2="736.736" gradientTransform="matrix(1 0 0 -1 -4.395590e-02 857.1398)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000011712675223675638010000005955852266121733023_);" points="1132.3,120.3 1132.3,120.3
			1133.5,120.5 1133.5,120.5 		"/>

    <linearGradient id="SVGID_00000065759385984518177110000011034222352146771133_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="736.5436" x2="1133.5294" y2="736.5436" gradientTransform="matrix(1 0 0 -1 -4.493212e-02 857.1387)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000065759385984518177110000011034222352146771133_);" points="1132.3,120.5 1132.3,120.5
			1133.5,120.7 1133.5,120.7 		"/>

    <linearGradient id="SVGID_00000134936485090097800950000011513589549239746968_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="736.3513" x2="1133.5294" y2="736.3513" gradientTransform="matrix(1 0 0 -1 -4.590835e-02 857.1475)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000134936485090097800950000011513589549239746968_);" points="1132.3,120.7 1132.3,120.7
			1133.5,120.9 1133.5,120.9 		"/>

    <linearGradient id="SVGID_00000174601329520794822600000018071510669765764738_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="736.1589" x2="1133.5294" y2="736.1589" gradientTransform="matrix(1 0 0 -1 -4.682437e-02 857.1465)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000174601329520794822600000018071510669765764738_);" points="1132.3,120.9 1132.3,120.9
			1133.5,121.1 1133.5,121.1 		"/>

    <linearGradient id="SVGID_00000062153127407235535780000004712548063680265103_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="735.9666" x2="1133.5294" y2="735.9666" gradientTransform="matrix(1 0 0 -1 -4.780060e-02 857.1454)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000062153127407235535780000004712548063680265103_);" points="1132.3,121.1 1132.3,121.1
			1133.5,121.3 1133.5,121.3 		"/>

    <linearGradient id="SVGID_00000134968785287419031040000014347148523238172804_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="735.7742" x2="1133.5294" y2="735.7742" gradientTransform="matrix(1 0 0 -1 -3.884298e-02 857.1458)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000134968785287419031040000014347148523238172804_);" points="1132.3,121.3 1132.3,121.3
			1133.5,121.4 1133.5,121.5 		"/>

    <linearGradient id="SVGID_00000109015175427587543760000001887178574615967157_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="735.5818" x2="1133.5294" y2="735.5818" gradientTransform="matrix(1 0 0 -1 -3.981920e-02 857.1447)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000109015175427587543760000001887178574615967157_);" points="1132.3,121.5 1132.3,121.4
			1133.5,121.6 1133.5,121.7 		"/>

    <linearGradient id="SVGID_00000094612859383265256690000009493497889080810682_" gradientUnits="userSpaceOnUse" x1="1132.3605" y1="735.3895" x2="1133.5304" y2="735.3895" gradientTransform="matrix(1 0 0 -1 -4.079543e-02 857.1436)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000094612859383265256690000009493497889080810682_);" points="1132.3,121.7 1132.3,121.6
			1133.5,121.8 1133.5,121.9 		"/>

    <linearGradient id="SVGID_00000049197223811537731850000010105950408821871786_" gradientUnits="userSpaceOnUse" x1="1132.3588" y1="735.1971" x2="1133.5287" y2="735.1971" gradientTransform="matrix(1 0 0 -1 -4.171145e-02 857.1425)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000049197223811537731850000010105950408821871786_);" points="1132.3,121.9 1132.3,121.8
			1133.5,122 1133.5,122.1 		"/>

    <linearGradient id="SVGID_00000078747728029977042830000016955698171852917922_" gradientUnits="userSpaceOnUse" x1="1132.3595" y1="735.0032" x2="1133.5294" y2="735.0032" gradientTransform="matrix(1 0 0 -1 -4.268768e-02 857.1414)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000078747728029977042830000016955698171852917922_);" points="1132.3,122.1 1132.3,122
			1133.5,122.2 1133.5,122.3 		"/>

    <linearGradient id="SVGID_00000055697773334285019710000014720536721321332618_" gradientUnits="userSpaceOnUse" x1="1130.8894" y1="729.0887" x2="1135.0294" y2="729.1288" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000055697773334285019710000014720536721321332618_);" d="M1128.8,125.1v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.2v3.8h3.7V127c0-0.4,0.1-0.8,0.4-1.1h1.7v-0.8H1128.8z"/>

    <linearGradient id="SVGID_00000074435510008986599290000017455070320886614716_" gradientUnits="userSpaceOnUse" x1="1130.8795" y1="300.1974" x2="1135.0194" y2="300.2374" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000074435510008986599290000017455070320886614716_);" d="M1128.8,124.9v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.2v-0.8h2.1v0.9c0,0.4,0.1,0.7,0.4,1h2.5v0.8L1128.8,124.9z"/>

    <linearGradient id="SVGID_00000150793755622943354060000014909434760680599468_" gradientUnits="userSpaceOnUse" x1="875.5045" y1="592.5722" x2="875.5045" y2="575.3322" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1112.6" y="130.5" style="fill:url(#SVGID_00000150793755622943354060000014909434760680599468_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000155836866383373155900000002335561380895197836_" gradientUnits="userSpaceOnUse" x1="893.6845" y1="592.5722" x2="893.6845" y2="575.3322" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1149.5" y="130.5" style="fill:url(#SVGID_00000155836866383373155900000002335561380895197836_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000106120213423968402720000006866960357472390549_" gradientUnits="userSpaceOnUse" x1="1132.8795" y1="726.0822" x2="1132.8795" y2="705.8822" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path  :myid="nodeInfo[12].id"  @click="changeState1(12)" style="cursor:pointer;fill:url(#SVGID_00000106120213423968402720000006866960357472390549_);" d="M1147.1,133.6c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8h-2.1v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H1147.1z"/>

    <linearGradient id="SVGID_00000121982882271534372310000011974102287818178202_" gradientUnits="userSpaceOnUse" x1="725.6295" y1="717.1223" x2="756.2195" y2="717.1223" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>
    <path :myid="nodeInfo[2].id"  @click='editInfo' style="cursor:pointer;fill:url(#SVGID_00000121982882271534372310000011974102287818178202_);" d="M749.3,161.1h-16.9
			c-3.8,0-6.8-3.1-6.8-6.9v-35.4h30.6v35.4C756.2,158,753.1,161.1,749.3,161.1z"/>

    <linearGradient id="SVGID_00000111888568490068603090000005151975076192891528_" gradientUnits="userSpaceOnUse" x1="642.0295" y1="732.9172" x2="643.1796" y2="732.9172" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="642" y="115.3" style="fill:url(#SVGID_00000111888568490068603090000005151975076192891528_);" width="1.2" height="6.9"/>

    <linearGradient id="SVGID_00000052074450384787054180000010080030083244921499_" gradientUnits="userSpaceOnUse" x1="641.4495" y1="732.3522" x2="643.7595" y2="732.3522" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="641.4" y="119" style="fill:url(#SVGID_00000052074450384787054180000010080030083244921499_);" width="2.3" height="0.8"/>
    <rect x="641.6" y="119.7" class="st33" width="0.2" height="2.5"/>
    <rect x="643.4" y="119.7" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M642.5,116.9c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1
			c0-0.8,0.9-0.9,2.1-1.1c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4
			c1.2,0.2,2.1,0.3,2.1,1.1s-0.9,1-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C652.4,116.7,647.6,116.9,642.5,116.9z M627,115
			c3.1,0.3,8.3,0.5,15.5,0.5s12.4-0.2,15.5-0.5c-3.1-0.3-8.3-0.5-15.5-0.5S630.1,114.8,627,115z"/>
    <rect x="641.3" y="114.9" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="643.9,115.3 643.9,114.9 651.3,114.1 651.4,114.5 		"/>

    <rect x="635.1" y="108.7" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 490.8533 744.0305)" class="st34" width="0.4" height="12.3"/>

    <rect x="643.3" y="114.7" transform="matrix(0.5547 -0.8321 0.8321 0.5547 190.2689 586.9236)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000098937334377308574910000000024823809280503743_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="736.9117" x2="643.1895" y2="736.9117" gradientTransform="matrix(1 0 0 -1 -2.349257e-02 857.1243)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000098937334377308574910000000024823809280503743_);" points="642,120.1 642,120.1
			643.2,120.3 643.2,120.3 		"/>

    <linearGradient id="SVGID_00000183235692439168270250000012037681829089413001_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="736.7177" x2="643.1895" y2="736.7177" gradientTransform="matrix(1 0 0 -1 -2.440859e-02 857.1232)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000183235692439168270250000012037681829089413001_);" points="642,120.3 642,120.3
			643.2,120.5 643.2,120.5 		"/>

    <linearGradient id="SVGID_00000135672258270875757840000006559462071660516252_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="736.5253" x2="643.1895" y2="736.5253" gradientTransform="matrix(1 0 0 -1 -2.538482e-02 857.1321)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000135672258270875757840000006559462071660516252_);" points="642,120.5 642,120.5
			643.2,120.7 643.2,120.7 		"/>

    <linearGradient id="SVGID_00000152265700490069894500000002086998370315668642_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="736.333" x2="643.1895" y2="736.333" gradientTransform="matrix(1 0 0 -1 -2.630084e-02 857.131)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000152265700490069894500000002086998370315668642_);" points="642,120.7 642,120.7
			643.2,120.9 643.2,120.9 		"/>

    <linearGradient id="SVGID_00000078035361890011959820000016747705938641245372_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="736.1406" x2="643.1895" y2="736.1406" gradientTransform="matrix(1 0 0 -1 -2.727707e-02 857.1298)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000078035361890011959820000016747705938641245372_);" points="642,120.9 642,120.9
			643.2,121.1 643.2,121.1 		"/>

    <linearGradient id="SVGID_00000074426692417180099280000012523659722013099398_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="735.9483" x2="643.1895" y2="735.9483" gradientTransform="matrix(1 0 0 -1 -2.816257e-02 857.1287)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000074426692417180099280000012523659722013099398_);" points="642,121.1 642,121.1
			643.2,121.3 643.1,121.3 		"/>

    <linearGradient id="SVGID_00000102533039836179666060000005646316597946405805_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="735.7543" x2="643.1895" y2="735.7543" gradientTransform="matrix(1 0 0 -1 -2.914883e-02 857.1277)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000102533039836179666060000005646316597946405805_);" points="642,121.3 642,121.3
			643.2,121.4 643.2,121.5 		"/>

    <linearGradient id="SVGID_00000161615231485335155450000009903163695549245358_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="735.562" x2="643.1895" y2="735.562" gradientTransform="matrix(1 0 0 -1 -3.012505e-02 857.1266)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000161615231485335155450000009903163695549245358_);" points="642,121.5 642,121.4
			643.2,121.6 643.2,121.7 		"/>

    <linearGradient id="SVGID_00000093876405705541629230000003589176984875003796_" gradientUnits="userSpaceOnUse" x1="642.019" y1="735.3713" x2="643.189" y2="735.3713" gradientTransform="matrix(1 0 0 -1 -2.116743e-02 857.1271)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000093876405705541629230000003589176984875003796_);" points="642,121.7 642,121.6
			643.2,121.8 643.2,121.9 		"/>

    <linearGradient id="SVGID_00000169535514403962682130000017483284863234499741_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="735.179" x2="643.1895" y2="735.179" gradientTransform="matrix(1 0 0 -1 -2.214366e-02 857.126)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000169535514403962682130000017483284863234499741_);" points="642,121.9 642,121.8 643.2,122
			643.1,122.1 		"/>

    <linearGradient id="SVGID_00000019639880996858423210000001961487610272487099_" gradientUnits="userSpaceOnUse" x1="642.0195" y1="734.985" x2="643.1895" y2="734.985" gradientTransform="matrix(1 0 0 -1 -2.305968e-02 857.1248)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000019639880996858423210000001961487610272487099_);" points="642,122.1 642,122 643.2,122.2
			643.2,122.3 		"/>

    <linearGradient id="SVGID_00000050641144923575719480000015699383197743789705_" gradientUnits="userSpaceOnUse" x1="640.5494" y1="729.0885" x2="644.6895" y2="729.1285" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000050641144923575719480000015699383197743789705_);" d="M638.4,125.1v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.2v3.8h3.7V127c0-0.4,0.1-0.8,0.4-1.1h1.7v-0.8H638.4z"/>

    <linearGradient id="SVGID_00000145052083375491643910000000593731327861909169_" gradientUnits="userSpaceOnUse" x1="640.5395" y1="300.1973" x2="644.6794" y2="300.2373" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000145052083375491643910000000593731327861909169_);" d="M638.4,124.9v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.2v-0.8h2.1v0.9c0,0.4,0.1,0.7,0.4,1h2.5v0.8L638.4,124.9z"/>

    <linearGradient id="SVGID_00000127745638563905923760000005822406259498757038_" gradientUnits="userSpaceOnUse" x1="385.1645" y1="592.5722" x2="385.1645" y2="575.3322" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="622.2" y="130.5" style="fill:url(#SVGID_00000127745638563905923760000005822406259498757038_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000061443368329957898410000007740091424883425695_" gradientUnits="userSpaceOnUse" x1="403.3445" y1="592.5722" x2="403.3445" y2="575.3322" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="659.1" y="130.5" style="fill:url(#SVGID_00000061443368329957898410000007740091424883425695_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000087381799627184286220000013633843645518537372_" gradientUnits="userSpaceOnUse" x1="642.5345" y1="726.0822" x2="642.5345" y2="705.8822" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path  :myid="nodeInfo[10].id"   @click="changeState1(10)" style="cursor:pointer;fill:url(#SVGID_00000087381799627184286220000013633843645518537372_);" d="M656.8,133.6c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8H626v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H656.8z"/>

    <linearGradient id="SVGID_00000046299834024786568660000003461447710350368641_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="585.5772" x2="643.2495" y2="585.5772" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="642.1" y="262.7" style="fill:url(#SVGID_00000046299834024786568660000003461447710350368641_);" width="1.2" height="6.9"/>

    <linearGradient id="SVGID_00000096771325260391596540000017913961387412660373_" gradientUnits="userSpaceOnUse" x1="641.5195" y1="585.0122" x2="643.8195" y2="585.0122" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="641.5" y="266.3" style="fill:url(#SVGID_00000096771325260391596540000017913961387412660373_);" width="2.3" height="0.8"/>
    <rect x="641.7" y="267.1" class="st33" width="0.2" height="2.5"/>
    <rect x="643.4" y="267.1" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M642.6,264.3c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1
			c0-0.8,0.9-0.9,2.1-1.1c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4
			c1.2,0.2,2.1,0.4,2.1,1.1c0,0.8-0.9,0.9-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C652.4,264.1,647.7,264.3,642.6,264.3z M627.1,262.4
			c3,0.3,8.3,0.5,15.5,0.5s12.4-0.2,15.5-0.5c-3.1-0.3-8.3-0.5-15.5-0.5S630.2,262.1,627.1,262.4L627.1,262.4z"/>
    <rect x="641.3" y="262.3" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="644,262.7 644,262.3 651.4,261.4 651.4,261.8 		"/>

    <rect x="635.1" y="256" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 343.7247 884.5327)" class="st34" width="0.4" height="12.3"/>

    <rect x="643.3" y="262" transform="matrix(0.5547 -0.8321 0.8321 0.5547 67.6924 652.5864)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000078035011941490292050000000139132577433008010_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="589.5659" x2="643.2495" y2="589.5659" gradientTransform="matrix(1 0 0 -1 -2.922417e-02 857.1177)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000078035011941490292050000000139132577433008010_);" points="642.1,267.5 642.1,267.4
			643.2,267.6 643.2,267.7 		"/>

    <linearGradient id="SVGID_00000087406307288461923060000007884614664948977056_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="589.3735" x2="643.2495" y2="589.3735" gradientTransform="matrix(1 0 0 -1 -3.017029e-02 857.1166)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000087406307288461923060000007884614664948977056_);" points="642.1,267.7 642.1,267.6
			643.2,267.8 643.2,267.9 		"/>

    <linearGradient id="SVGID_00000061432950382811855880000009301057205966551452_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="589.1812" x2="643.2495" y2="589.1812" gradientTransform="matrix(1 0 0 -1 -3.108590e-02 857.1155)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000061432950382811855880000009301057205966551452_);" points="642.1,267.9 642.1,267.8
			643.2,268 643.2,268.1 		"/>

    <linearGradient id="SVGID_00000145055684312737258510000004275627483241488513_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="588.9872" x2="643.2495" y2="588.9872" gradientTransform="matrix(1 0 0 -1 -3.203202e-02 857.1144)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000145055684312737258510000004275627483241488513_);" points="642.1,268.1 642.1,268
			643.2,268.2 643.2,268.2 		"/>

    <linearGradient id="SVGID_00000167372885591888257780000000229772500186862262_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="588.7948" x2="643.2495" y2="588.7948" gradientTransform="matrix(1 0 0 -1 -3.300825e-02 857.1133)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000167372885591888257780000000229772500186862262_);" points="642.1,268.2 642.1,268.2
			643.2,268.4 643.2,268.4 		"/>

    <linearGradient id="SVGID_00000170960999395434578460000018310801750861721533_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="588.6025" x2="643.2495" y2="588.6025" gradientTransform="matrix(1 0 0 -1 -3.395437e-02 857.1121)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000170960999395434578460000018310801750861721533_);" points="642.1,268.4 642.1,268.4
			643.2,268.6 643.2,268.6 		"/>

    <linearGradient id="SVGID_00000020363939268370067830000000964990509995610012_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="588.4101" x2="643.2495" y2="588.4101" gradientTransform="matrix(1 0 0 -1 -3.490049e-02 857.121)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000020363939268370067830000000964990509995610012_);" points="642.1,268.6 642.1,268.6
			643.2,268.8 643.2,268.8 		"/>

    <linearGradient id="SVGID_00000163062633253423630260000012728508871761376134_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="588.2161" x2="643.2495" y2="588.2161" gradientTransform="matrix(1 0 0 -1 -3.584662e-02 857.1199)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000163062633253423630260000012728508871761376134_);" points="642.1,268.8 642.1,268.8
			643.2,269 643.2,269 		"/>

    <linearGradient id="SVGID_00000096777024767589272000000011630419824162016429_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="588.0237" x2="643.2495" y2="588.0237" gradientTransform="matrix(1 0 0 -1 -3.679274e-02 857.1188)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000096777024767589272000000011630419824162016429_);" points="642.1,269 642.1,269
			643.2,269.2 643.2,269.2 		"/>

    <linearGradient id="SVGID_00000052074407315360437700000003154083686219792058_" gradientUnits="userSpaceOnUse" x1="642.0895" y1="587.8314" x2="643.2495" y2="587.8314" gradientTransform="matrix(1 0 0 -1 -3.773886e-02 857.1177)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000052074407315360437700000003154083686219792058_);" points="642.1,269.2 642.1,269.2
			643.2,269.4 643.2,269.4 		"/>

    <linearGradient id="SVGID_00000089570960345421657620000011402504520376762785_" gradientUnits="userSpaceOnUse" x1="642.0892" y1="587.6407" x2="643.2491" y2="587.6407" gradientTransform="matrix(1 0 0 -1 -2.884145e-02 857.1182)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000089570960345421657620000011402504520376762785_);" points="642.1,269.4 642.1,269.4
			643.2,269.5 643.2,269.6 		"/>

    <linearGradient id="SVGID_00000036938689993316681160000000523339429044157863_" gradientUnits="userSpaceOnUse" x1="640.6196" y1="581.7339" x2="644.7596" y2="581.7739" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000036938689993316681160000000523339429044157863_);" d="M638.5,272.5v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.1v3.9h3.6v-3.9c0-0.4,0.1-0.8,0.4-1.1h1.7v-0.8L638.5,272.5z"/>

    <linearGradient id="SVGID_00000155112113604053945790000018394336798512540076_" gradientUnits="userSpaceOnUse" x1="640.5999" y1="447.5061" x2="644.7398" y2="447.5561" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000155112113604053945790000018394336798512540076_);" d="M638.5,272.3v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.1v-0.8h2.1v0.9c0,0.4,0.1,0.8,0.4,1.1h2.5v0.8H638.5z"/>

    <linearGradient id="SVGID_00000048468973507941789990000012089404728757242782_" gradientUnits="userSpaceOnUse" x1="385.2345" y1="445.2222" x2="385.2345" y2="427.9822" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="622.3" y="277.9" style="fill:url(#SVGID_00000048468973507941789990000012089404728757242782_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000182486892276268107020000013246006917177071751_" gradientUnits="userSpaceOnUse" x1="403.4045" y1="445.2222" x2="403.4045" y2="427.9822" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="659.2" y="277.9" style="fill:url(#SVGID_00000182486892276268107020000013246006917177071751_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000111169473895100250460000007913611503878974114_" gradientUnits="userSpaceOnUse" x1="642.5945" y1="578.7422" x2="642.5945" y2="558.5322" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path   :myid="nodeInfo[11].id" @click="changeState1(11)" style="cursor:pointer;fill:url(#SVGID_00000111169473895100250460000007913611503878974114_);" d="M656.8,280.9c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8H626v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H656.8z"/>

    <linearGradient id="SVGID_00000091702262437165252930000017371357354883095435_" gradientUnits="userSpaceOnUse" x1="725.6295" y1="570.0472" x2="756.2195" y2="570.0472" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#E89931"/>
      <stop  offset="5.000000e-02" style="stop-color:#FBB03B"/>
      <stop  offset="0.38" style="stop-color:#E0932D"/>
      <stop  offset="0.94" style="stop-color:#FBB03B"/>
      <stop  offset="1" style="stop-color:#E89931"/>
		</linearGradient>
    <path  @click="editInfo" :myid="nodeInfo[3].id" style="cursor:pointer;fill:url(#SVGID_00000091702262437165252930000017371357354883095435_);" d="M749.3,308.2h-16.9
			c-3.8,0-6.9-3.1-6.9-6.9v-35.4h30.6v35.4C756.2,305.1,753.1,308.2,749.3,308.2z"/>

    <linearGradient id="SVGID_00000101824386565834078940000000241088949984522171_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="585.5772" x2="1133.5895" y2="585.5772" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1132.4" y="262.7" style="fill:url(#SVGID_00000101824386565834078940000000241088949984522171_);" width="1.2" height="6.9"/>

    <linearGradient id="SVGID_00000109717731527794174690000016371332524820046997_" gradientUnits="userSpaceOnUse" x1="1131.8595" y1="585.0122" x2="1134.1594" y2="585.0122" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1131.9" y="266.3" style="fill:url(#SVGID_00000109717731527794174690000016371332524820046997_);" width="2.3" height="0.8"/>
    <rect x="1132" y="267.1" class="st33" width="0.2" height="2.5"/>
    <rect x="1133.8" y="267.1" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M1132.9,264.3c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1
			c0-0.8,0.9-0.9,2.1-1.1c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4
			c1.2,0.2,2.1,0.4,2.1,1.1c0,0.8-0.9,0.9-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C1142.8,264.1,1138,264.3,1132.9,264.3z M1117.4,262.4
			c3,0.3,8.3,0.5,15.5,0.5s12.4-0.2,15.5-0.5c-3.1-0.3-8.3-0.5-15.5-0.5S1120.5,262.1,1117.4,262.4z"/>
    <rect x="1131.7" y="262.3" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="1134.4,262.7 1134.3,262.3 1141.7,261.4 1141.8,261.8 		"/>

    <rect x="1125.4" y="256" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 811.1195 1374.3101)" class="st34" width="0.4" height="12.3"/>

    <rect x="1133.7" y="262" transform="matrix(0.5547 -0.8321 0.8321 0.5547 286.0399 1060.5762)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000080200125754761559940000008490491537803995567_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="589.5842" x2="1133.5895" y2="589.5842" gradientTransform="matrix(1 0 0 -1 -4.877106e-02 857.1344)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000080200125754761559940000008490491537803995567_);" points="1132.4,267.5 1132.4,267.4
			1133.6,267.6 1133.5,267.7 		"/>

    <linearGradient id="SVGID_00000119116334035996043720000016551643216927829401_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="589.3918" x2="1133.5895" y2="589.3918" gradientTransform="matrix(1 0 0 -1 -4.967705e-02 857.1331)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000119116334035996043720000016551643216927829401_);" points="1132.4,267.7 1132.4,267.6
			1133.5,267.8 1133.5,267.9 		"/>

    <linearGradient id="SVGID_00000026867406057725295010000002099471204771741588_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="589.1995" x2="1133.5895" y2="589.1995" gradientTransform="matrix(1 0 0 -1 -5.066330e-02 857.1321)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000026867406057725295010000002099471204771741588_);" points="1132.4,267.9 1132.4,267.8
			1133.5,268 1133.5,268.1 		"/>

    <linearGradient id="SVGID_00000165943529152077621010000015695894486791849369_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="589.0054" x2="1133.5895" y2="589.0054" gradientTransform="matrix(1 0 0 -1 -5.162950e-02 857.1309)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000165943529152077621010000015695894486791849369_);" points="1132.4,268.1 1132.4,268
			1133.6,268.2 1133.5,268.2 		"/>

    <linearGradient id="SVGID_00000171711607498377517300000012965043126675289485_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="588.8131" x2="1133.5895" y2="588.8131" gradientTransform="matrix(1 0 0 -1 -5.255555e-02 857.1298)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000171711607498377517300000012965043126675289485_);" points="1132.4,268.2 1132.4,268.2
			1133.6,268.4 1133.5,268.4 		"/>

    <linearGradient id="SVGID_00000052087700789457192450000014217429868287548035_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="588.6207" x2="1133.5895" y2="588.6207" gradientTransform="matrix(1 0 0 -1 -5.352174e-02 857.1287)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000052087700789457192450000014217429868287548035_);" points="1132.4,268.4 1132.4,268.4
			1133.5,268.6 1133.5,268.6 		"/>

    <linearGradient id="SVGID_00000145036664098370791860000010114085343299177892_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="588.4284" x2="1133.5895" y2="588.4284" gradientTransform="matrix(1 0 0 -1 -5.444780e-02 857.1276)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000145036664098370791860000010114085343299177892_);" points="1132.4,268.6 1132.4,268.6
			1133.5,268.8 1133.5,268.8 		"/>

    <linearGradient id="SVGID_00000023241313360450569380000000493721890790882231_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="588.2344" x2="1133.5895" y2="588.2344" gradientTransform="matrix(1 0 0 -1 -5.541399e-02 857.1265)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000023241313360450569380000000493721890790882231_);" points="1132.4,268.8 1132.4,268.8
			1133.6,269 1133.5,269 		"/>

    <linearGradient id="SVGID_00000060001877426947776690000006207219958898855079_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="588.0438" x2="1133.5895" y2="588.0438" gradientTransform="matrix(1 0 0 -1 -4.646641e-02 857.137)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000060001877426947776690000006207219958898855079_);" points="1132.4,269 1132.4,269
			1133.5,269.2 1133.5,269.2 		"/>

    <linearGradient id="SVGID_00000031192329193732707910000014678355691408273795_" gradientUnits="userSpaceOnUse" x1="1132.4294" y1="587.8513" x2="1133.5895" y2="587.8513" gradientTransform="matrix(1 0 0 -1 -4.743260e-02 857.1359)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000031192329193732707910000014678355691408273795_);" points="1132.4,269.2 1132.4,269.2
			1133.5,269.4 1133.5,269.4 		"/>

    <linearGradient id="SVGID_00000175302939049308345310000013498088333460233123_" gradientUnits="userSpaceOnUse" x1="1132.4305" y1="587.6591" x2="1133.5906" y2="587.6591" gradientTransform="matrix(1 0 0 -1 -4.841886e-02 857.1348)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000175302939049308345310000013498088333460233123_);" points="1132.4,269.4 1132.4,269.4
			1133.5,269.5 1133.5,269.6 		"/>

    <linearGradient id="SVGID_00000119839956932880208000000010356705264209463195_" gradientUnits="userSpaceOnUse" x1="1130.9596" y1="581.7338" x2="1135.0996" y2="581.7738" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000119839956932880208000000010356705264209463195_);" d="M1128.8,272.5v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.1v3.9h3.7v-3.9c0-0.4,0.1-0.8,0.4-1.1h1.7v-0.8L1128.8,272.5z"/>

    <linearGradient id="SVGID_00000044878597585918434590000018431651125139631514_" gradientUnits="userSpaceOnUse" x1="1130.9398" y1="447.5061" x2="1135.0798" y2="447.5561" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000044878597585918434590000018431651125139631514_);" d="M1128.8,272.3v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.1v-0.8h2.1v0.9c0,0.4,0.1,0.8,0.4,1.1h2.5v0.8H1128.8z"/>

    <linearGradient id="SVGID_00000062183969110282842780000016909355343615333779_" gradientUnits="userSpaceOnUse" x1="875.5745" y1="445.2222" x2="875.5745" y2="427.9822" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1112.6" y="277.9" style="fill:url(#SVGID_00000062183969110282842780000016909355343615333779_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000167384411442036072040000010255827808781263772_" gradientUnits="userSpaceOnUse" x1="893.7444" y1="445.2222" x2="893.7444" y2="427.9822" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1149.5" y="277.9" style="fill:url(#SVGID_00000167384411442036072040000010255827808781263772_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000008113719737214781500000018183800599633113745_" gradientUnits="userSpaceOnUse" x1="1132.9344" y1="578.7422" x2="1132.9344" y2="558.5322" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path   :myid="nodeInfo[13].id"   @click="changeState1(13)" style="cursor:pointer;fill:url(#SVGID_00000008113719737214781500000018183800599633113745_);" d="M1147.2,280.9c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8h-2.1v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H1147.2z"/>

    <linearGradient id="SVGID_00000031207786773621326250000001235299970021604771_" gradientUnits="userSpaceOnUse" x1="1367.5394" y1="649.9172" x2="1368.6895" y2="649.9172" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1367.5" y="198.3" style="fill:url(#SVGID_00000031207786773621326250000001235299970021604771_);" width="1.2" height="6.9"/>

    <linearGradient id="SVGID_00000072970809414036772100000004270978077435808947_" gradientUnits="userSpaceOnUse" x1="1366.9595" y1="649.3522" x2="1369.2695" y2="649.3522" gradientTransform="matrix(1 0 0 -1 0 851.7045)">
			<stop  offset="0" style="stop-color:#CCCCCC"/>
      <stop  offset="5.000000e-02" style="stop-color:#EEEEED"/>
      <stop  offset="0.38" style="stop-color:#ACA7A6"/>
      <stop  offset="0.94" style="stop-color:#E5E6E6"/>
      <stop  offset="1" style="stop-color:#B3B3B3"/>
		</linearGradient>

    <rect x="1367" y="202" style="fill:url(#SVGID_00000072970809414036772100000004270978077435808947_);" width="2.3" height="0.8"/>
    <rect x="1367.1" y="202.7" class="st33" width="0.2" height="2.5"/>
    <rect x="1368.9" y="202.7" class="st33" width="0.2" height="2.5"/>
    <path class="st34" d="M1368,199.9c-5.1,0-9.9-0.1-13.5-0.3c-1.8-0.1-3.2-0.2-4.1-0.4c-1.2-0.2-2.1-0.4-2.1-1.1s0.9-0.9,2.1-1.1
			c1-0.1,2.4-0.3,4.1-0.4c3.6-0.2,8.4-0.3,13.5-0.3s9.9,0.1,13.5,0.3c1.8,0.1,3.2,0.2,4.1,0.4c1.2,0.2,2.1,0.4,2.1,1.1
			s-0.9,0.9-2.1,1.1c-1,0.1-2.4,0.3-4.1,0.4C1377.9,199.7,1373.1,199.9,1368,199.9z M1352.5,198c3.1,0.3,8.3,0.5,15.5,0.5
			s12.4-0.2,15.5-0.5c-3.1-0.2-8.3-0.5-15.5-0.5S1355.6,197.8,1352.5,198z"/>
    <rect x="1366.8" y="197.9" class="st34" width="2.7" height="0.4"/>
    <polygon class="st34" points="1369.5,198.3 1369.4,197.9 1376.8,197.1 1376.9,197.5 		"/>

    <rect x="1360.5" y="191.7" transform="matrix(4.675778e-02 -0.9989 0.9989 4.675778e-02 1099.4911 1547.8132)" class="st34" width="0.4" height="12.3"/>

    <rect x="1368.8" y="197.7" transform="matrix(0.5547 -0.8321 0.8321 0.5547 444.2799 1227.5443)" class="st34" width="0.4" height="2.1"/>

    <linearGradient id="SVGID_00000153698973453204484560000009618188581879165347_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="653.9395" x2="1368.6995" y2="653.9395" gradientTransform="matrix(1 0 0 -1 -5.743704e-02 857.1503)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000153698973453204484560000009618188581879165347_);" points="1367.5,203.1 1367.5,203.1
			1368.6,203.3 1368.6,203.3 		"/>

    <linearGradient id="SVGID_00000121250282578374910850000005170103936891306380_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="653.7454" x2="1368.6995" y2="653.7454" gradientTransform="matrix(1 0 0 -1 -5.834303e-02 857.1492)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000121250282578374910850000005170103936891306380_);" points="1367.5,203.3 1367.5,203.3
			1368.6,203.5 1368.6,203.5 		"/>

    <linearGradient id="SVGID_00000031929760088770215120000016826202049665202083_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="653.5531" x2="1368.6995" y2="653.5531" gradientTransform="matrix(1 0 0 -1 -5.926909e-02 857.1481)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000031929760088770215120000016826202049665202083_);" points="1367.5,203.5 1367.5,203.5
			1368.6,203.7 1368.6,203.7 		"/>

    <linearGradient id="SVGID_00000032643371410756897570000011304037028205485471_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="653.3607" x2="1368.6995" y2="653.3607" gradientTransform="matrix(1 0 0 -1 -6.017508e-02 857.147)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000032643371410756897570000011304037028205485471_);" points="1367.5,203.7 1367.5,203.7
			1368.6,203.9 1368.6,203.9 		"/>

    <linearGradient id="SVGID_00000102507692889909001890000013436501694215793582_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="653.1684" x2="1368.6995" y2="653.1684" gradientTransform="matrix(1 0 0 -1 -6.122154e-02 857.1459)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000102507692889909001890000013436501694215793582_);" points="1367.5,203.9 1367.5,203.9
			1368.6,204 1368.6,204.1 		"/>

    <linearGradient id="SVGID_00000055698818676157219020000012261360893632231055_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="652.9744" x2="1368.6995" y2="652.9744" gradientTransform="matrix(1 0 0 -1 -6.212753e-02 857.1447)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000055698818676157219020000012261360893632231055_);" points="1367.5,204.1 1367.5,204
			1368.6,204.2 1368.6,204.3 		"/>

    <linearGradient id="SVGID_00000136374159376529765390000012316359517790340490_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="652.7821" x2="1368.6995" y2="652.7821" gradientTransform="matrix(1 0 0 -1 -6.305358e-02 857.1437)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000136374159376529765390000012316359517790340490_);" points="1367.5,204.3 1367.5,204.2
			1368.6,204.4 1368.6,204.5 		"/>

    <linearGradient id="SVGID_00000119106055677401378610000015583854051135108021_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="652.5897" x2="1368.6995" y2="652.5897" gradientTransform="matrix(1 0 0 -1 -5.407021e-02 857.1424)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000119106055677401378610000015583854051135108021_);" points="1367.5,204.5 1367.5,204.4
			1368.6,204.6 1368.6,204.7 		"/>

    <linearGradient id="SVGID_00000003783250147513577090000009885356685250308797_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="652.3974" x2="1368.6995" y2="652.3974" gradientTransform="matrix(1 0 0 -1 -5.499627e-02 857.1414)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000003783250147513577090000009885356685250308797_);" points="1367.5,204.7 1367.5,204.6
			1368.6,204.8 1368.6,204.9 		"/>

    <linearGradient id="SVGID_00000097493052290393470940000015408366243086251923_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="652.2033" x2="1368.6995" y2="652.2033" gradientTransform="matrix(1 0 0 -1 -5.590225e-02 857.1503)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000097493052290393470940000015408366243086251923_);" points="1367.5,204.9 1367.5,204.8
			1368.7,205 1368.6,205.1 		"/>

    <linearGradient id="SVGID_00000009572198593141366760000010061996322087927440_" gradientUnits="userSpaceOnUse" x1="1367.5294" y1="652.011" x2="1368.6995" y2="652.011" gradientTransform="matrix(1 0 0 -1 -5.682831e-02 857.1492)">
			<stop  offset="0" style="stop-color:#B3B3B3"/>
      <stop  offset="5.000000e-02" style="stop-color:#CCCCCC"/>
      <stop  offset="0.38" style="stop-color:#808080"/>
      <stop  offset="0.94" style="stop-color:#CCCCCC"/>
      <stop  offset="1" style="stop-color:#999999"/>
		</linearGradient>
    <polygon style="fill:url(#SVGID_00000009572198593141366760000010061996322087927440_);" points="1367.5,205.1 1367.5,205
			1368.7,205.2 1368.6,205.3 		"/>

    <linearGradient id="SVGID_00000036242771819122672320000017698858110237304965_" gradientUnits="userSpaceOnUse" x1="1366.0594" y1="646.0838" x2="1370.1995" y2="646.1238" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000036242771819122672320000017698858110237304965_);" d="M1363.9,208.1v0.8h1.9
			c0.3,0.3,0.4,0.7,0.4,1.1v3.9h3.7v-4c0-0.4,0.1-0.8,0.4-1.1h1.7v-0.8L1363.9,208.1z"/>

    <linearGradient id="SVGID_00000064335986758286153580000010622397362651383205_" gradientUnits="userSpaceOnUse" x1="1366.0494" y1="383.1974" x2="1370.1895" y2="383.2374" gradientTransform="matrix(1 0 0 1 0 -176.61)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000064335986758286153580000010622397362651383205_);" d="M1363.9,207.9v-0.8h2.7
			c0.3-0.3,0.4-0.7,0.4-1.1v-0.8h2.1v0.9c0,0.4,0.1,0.7,0.4,1h2.5v0.8L1363.9,207.9z"/>

    <linearGradient id="SVGID_00000149373924285664252200000000656959376426189967_" gradientUnits="userSpaceOnUse" x1="1110.6746" y1="509.5622" x2="1110.6746" y2="492.3322" gradientTransform="matrix(1 0 0 -1 239 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1347.7" y="213.5" style="fill:url(#SVGID_00000149373924285664252200000000656959376426189967_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000118397521391620318550000016034326617440777625_" gradientUnits="userSpaceOnUse" x1="1128.8545" y1="509.5622" x2="1128.8545" y2="492.3322" gradientTransform="matrix(1 0 0 -1 257.7 724.9944)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>

    <rect x="1384.6" y="213.5" style="fill:url(#SVGID_00000118397521391620318550000016034326617440777625_);" width="3.8" height="20.1"/>

    <linearGradient id="SVGID_00000053541028058985284360000012965109015210198160_" gradientUnits="userSpaceOnUse" x1="1368.0195" y1="643.0822" x2="1368.0195" y2="622.8822" gradientTransform="matrix(1 0 0 -1 0 857.1044)">
			<stop  offset="0" style="stop-color:#29ABE2"/>
      <stop  offset="0.5" style="stop-color:#0071BC"/>
      <stop  offset="0.95" style="stop-color:#0E89CC"/>
		</linearGradient>
    <path style="fill:url(#SVGID_00000053541028058985284360000012965109015210198160_);" d="M1382.3,216.6c-5.8-0.6-8.1-4.8-14.2-4.8
			s-9.8,4.8-14.4,4.8h-2.2v14h2.1c4.6,0,8.3,4.8,14.4,4.8s8.5-4.2,14.2-4.8h2.3v-14H1382.3z"/>
	</g>
</g>
      <g id="组_1634" transform="translate(-376.56 -232.803)">
	<text transform="matrix(1 0 0 1 455.0974 873.7997)" class="st496 st497 st498">中压燃气管道来气</text>
        <text transform="matrix(1 0 0 1 1719.9753 497.2509)" class="st496 st497 st498">去丰田厂区一期</text>
        <text transform="matrix(1 0 0 1 514.7991 701.997)" class="st496 st497 st498">撬外</text>
        <text transform="matrix(1 0 0 1 874.0051 784.5136)" class="st496 st497 st498">远期预留</text>
        <text transform="matrix(1 0 0 1 874.0051 1046.207)" class="st496 st497 st498">远期预留</text>
        <g id="组_1390" transform="translate(649.755 -166.656)">
		<g id="路径_2459" transform="translate(525.779 -873.858)" class="st499">
			<path class="st500" d="M559.5,1454.8H425.2l-6-7v-49.4h135.4l4.9,5.7V1454.8z"/>
      <path class="st501" d="M559.4,1454.7v-50.5l-4.9-5.7H419.3v49.2l6,6.9H559.4 M559.6,1454.9H425.2l-6.1-7.1v-49.6h135.5l5,5.8
				V1454.9z"/>
		</g>
          <g id="路径_2464" transform="translate(525.779 -873.858)">
			<path class="st502" d="M425.2,1454.9l-6.1-7.1v-49.6h135.5l5,5.8v50.8H425.2z"/>
            <path class="st503" d="M555.6,1454.9h-2v-1h2V1454.9z M551.7,1454.9h-2v-1h2V1454.9z M547.7,1454.9h-2v-1h2V1454.9z
				 M543.7,1454.9h-2v-1h2V1454.9z M539.7,1454.9h-2v-1h2V1454.9z M535.7,1454.9h-2v-1h2V1454.9z M531.7,1454.9h-2v-1h2V1454.9z
				 M527.8,1454.9h-2v-1h2V1454.9z M523.8,1454.9h-2v-1h2V1454.9z M519.8,1454.9h-2v-1h2V1454.9z M515.8,1454.9h-2v-1h2V1454.9z
				 M511.8,1454.9h-2v-1h2V1454.9z M507.9,1454.9h-2v-1h2V1454.9z M503.9,1454.9h-2v-1h2V1454.9z M499.9,1454.9h-2v-1h2V1454.9z
				 M495.9,1454.9h-2v-1h2V1454.9z M491.9,1454.9h-2v-1h2V1454.9z M488,1454.9h-2v-1h2V1454.9z M484,1454.9h-2v-1h2V1454.9z
				 M480,1454.9h-2v-1h2V1454.9z M476,1454.9h-2v-1h2V1454.9z M472,1454.9h-2v-1h2V1454.9z M468.1,1454.9h-2v-1h2V1454.9z
				 M464.1,1454.9h-2v-1h2V1454.9z M460.1,1454.9h-2v-1h2V1454.9z M456.1,1454.9h-2v-1h2V1454.9z M452.1,1454.9h-2v-1h2V1454.9z
				 M448.2,1454.9h-2v-1h2V1454.9z M444.2,1454.9h-2v-1h2V1454.9z M440.2,1454.9h-2v-1h2V1454.9z M436.2,1454.9h-2v-1h2V1454.9z
				 M432.2,1454.9h-2v-1h2V1454.9z M428.3,1454.9h-2v-1h2V1454.9z M424.6,1454.3c0,0-0.4-0.5-0.7-0.9l0,0c0,0,0,0,0,0l0,0
				c0,0,0,0,0,0l-0.5-0.6l0.8-0.6l1.3,1.5L424.6,1454.3z M422,1451.2l-1.3-1.5l0.8-0.6l1.3,1.5L422,1451.2z M419.4,1448.2l-0.3-0.4
				l0,0v-1.5h1v1.1l0.1,0.1l-0.1,0.1v0.2h-0.2L419.4,1448.2z M420.1,1444.4h-1v-2h1V1444.4z M420.1,1440.4h-1v-2h1V1440.4z
				 M420.1,1436.4h-1v-2h1V1436.4z M420.1,1432.4h-1v-2h1V1432.4z M420.1,1428.4h-1v-2h1V1428.4z M420.1,1424.5h-1v-2h1V1424.5z
				 M420.1,1420.5h-1v-2h1V1420.5z M420.1,1416.5h-1v-2h1V1416.5z M420.1,1412.5h-1v-2h1V1412.5z M420.1,1408.5h-1v-2h1V1408.5z
				 M420.1,1404.6h-1v-2h1V1404.6z M420.1,1400.6h-1v-2h1V1400.6z M422.7,1399.3h-2v-1h2V1399.3z M426.7,1399.3h-2v-1h2V1399.3z
				 M430.7,1399.3h-2v-1h2V1399.3z M434.7,1399.3h-2v-1h2V1399.3z M438.6,1399.3h-2v-1h2V1399.3z M442.6,1399.3h-2v-1h2V1399.3z
				 M446.6,1399.3h-2v-1h2V1399.3z M450.6,1399.3h-2v-1h2V1399.3z M454.6,1399.3h-2v-1h2V1399.3z M458.5,1399.3h-2v-1h2V1399.3z
				 M462.5,1399.3h-2v-1h2V1399.3z M466.5,1399.3h-2v-1h2V1399.3z M470.5,1399.3h-2v-1h2V1399.3z M474.5,1399.3h-2v-1h2V1399.3z
				 M478.4,1399.3h-2v-1h2V1399.3z M482.4,1399.3h-2v-1h2V1399.3z M486.4,1399.3h-2v-1h2V1399.3z M490.4,1399.3h-2v-1h2V1399.3z
				 M494.4,1399.3h-2v-1h2V1399.3z M498.3,1399.3h-2v-1h2V1399.3z M502.3,1399.3h-2v-1h2V1399.3z M506.3,1399.3h-2v-1h2V1399.3z
				 M510.3,1399.3h-2v-1h2V1399.3z M514.3,1399.3h-2v-1h2V1399.3z M518.2,1399.3h-2v-1h2V1399.3z M522.2,1399.3h-2v-1h2V1399.3z
				 M526.2,1399.3h-2v-1h2V1399.3z M530.2,1399.3h-2v-1h2V1399.3z M534.2,1399.3h-2v-1h2V1399.3z M538.1,1399.3h-2v-1h2V1399.3z
				 M542.1,1399.3h-2v-1h2V1399.3z M546.1,1399.3h-2v-1h2V1399.3z M550.1,1399.3h-2v-1h2V1399.3z M554.1,1399.3h-2v-1h2V1399.3z
				 M556.1,1401.5l-1.3-1.5l0.8-0.6l1.3,1.5L556.1,1401.5z M558.7,1404.5l-1.3-1.5l0.8-0.6l0.4,0.5c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0
				c0.4,0.4,0.9,1,0.9,1L558.7,1404.5z M559.6,1407.8h-1v-2h1V1407.8z M559.6,1411.8h-1v-2h1V1411.8z M559.6,1415.8h-1v-2h1V1415.8z
				 M559.6,1419.7h-1v-2h1V1419.7z M559.6,1423.7h-1v-2h1V1423.7z M559.6,1427.7h-1v-2h1V1427.7z M559.6,1431.7h-1v-2h1V1431.7z
				 M559.6,1435.7h-1v-2h1V1435.7z M559.6,1439.6h-1v-2h1V1439.6z M559.6,1443.6h-1v-2h1V1443.6z M559.6,1447.6h-1v-2h1V1447.6z
				 M559.6,1451.6h-1v-2h1V1451.6z M559.6,1454.9h-2v-1h1v-0.3h1V1454.9z"/>
		</g>
          <text transform="matrix(1 0 0 1 957.7819 544.9821)" class="st504 st497 st505">出站压力</text>
          <text transform="matrix(1 0 0 1 1048.3297 544.9821)" class="st504 st506 st505">MPa</text>
          <text code="P004" key="PT3102AP" transform="matrix(1 0 0 1 1012.5084 544.9821)" class="st496 st507 st508">{{ nodeInfo[5].numericalvalue }}</text>
          <text transform="matrix(1 0 0 1 957.7819 567.8679)" class="st504 st497 st505">出站温度</text>
          <text transform="matrix(1 0 0 1 1048.3297 567.8679)" class="st504 st506 st505">℃</text>
          <text code="T004" key="TT3102AT" transform="matrix(1 0 0 1 1012.5084 567.8679)" class="st496 st507 st508">{{nodeInfo[16].numericalvalue}}</text>
	</g>
        <g id="组_1599" transform="translate(303.56 -88.368)">
		<g id="路径_2459-2" transform="translate(312.021 -874.18)" class="st499">
			<path class="st500" d="M562.3,1432.6H449.6l-6-7V1398h113.7l4.9,5.7V1432.6z"/>
      <path class="st501" d="M562.1,1432.5v-28.7l-4.9-5.7H443.7v27.5l6,6.9H562.1 M562.4,1432.8H449.6l-6.1-7.1v-27.8h113.9l5,5.8
				V1432.8z"/>
		</g>
          <g id="路径_2463" transform="translate(312.021 -873.715)">
			<path class="st502" d="M449.6,1432.8l-6.1-7.1v-27.8h113.9l5,5.8v29.1H449.6z"/>
            <path class="st503" d="M562.4,1432.8h-2v-1h1v-1.1h1V1432.8z M558.4,1432.8h-2v-1h2V1432.8z M554.4,1432.8h-2v-1h2V1432.8z
				 M550.5,1432.8h-2v-1h2V1432.8z M546.5,1432.8h-2v-1h2V1432.8z M542.5,1432.8h-2v-1h2V1432.8z M538.5,1432.8h-2v-1h2V1432.8z
				 M534.5,1432.8h-2v-1h2V1432.8z M530.6,1432.8h-2v-1h2V1432.8z M526.6,1432.8h-2v-1h2V1432.8z M522.6,1432.8h-2v-1h2V1432.8z
				 M518.6,1432.8h-2v-1h2V1432.8z M514.6,1432.8h-2v-1h2V1432.8z M510.7,1432.8h-2v-1h2V1432.8z M506.7,1432.8h-2v-1h2V1432.8z
				 M502.7,1432.8h-2v-1h2V1432.8z M498.7,1432.8h-2v-1h2V1432.8z M494.7,1432.8h-2v-1h2V1432.8z M490.8,1432.8h-2v-1h2V1432.8z
				 M486.8,1432.8h-2v-1h2V1432.8z M482.8,1432.8h-2v-1h2V1432.8z M478.8,1432.8h-2v-1h2V1432.8z M474.8,1432.8h-2v-1h2V1432.8z
				 M470.9,1432.8h-2v-1h2V1432.8z M466.9,1432.8h-2v-1h2V1432.8z M462.9,1432.8h-2v-1h2V1432.8z M458.9,1432.8h-2v-1h2V1432.8z
				 M454.9,1432.8h-2v-1h2V1432.8z M450.9,1432.8h-1.4l-0.4-0.5l0.4-0.4v-0.2h0.2l0.1-0.1l0.1,0.1h0.9V1432.8z M447.9,1430.8
				c0,0-0.4-0.5-0.8-0.9l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l-0.5-0.6l0.8-0.6l1.3,1.5L447.9,1430.8z M445.3,1427.8
				l-0.3-0.3c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0
				c-0.4-0.4-0.9-1.1-0.9-1.1l0.8-0.6l1.3,1.5L445.3,1427.8z M444.5,1424.5h-1v-2h1V1424.5z M444.5,1420.5h-1v-2h1V1420.5z
				 M444.5,1416.5h-1v-2h1V1416.5z M444.5,1412.5h-1v-2h1V1412.5z M444.5,1408.5h-1v-2h1V1408.5z M444.5,1404.6h-1v-2h1V1404.6z
				 M444.5,1400.6h-1v-2h1V1400.6z M446.8,1398.9h-2v-1h2V1398.9z M450.8,1398.9h-2v-1h2V1398.9z M454.7,1398.9h-2v-1h2V1398.9z
				 M458.7,1398.9h-2v-1h2V1398.9z M462.7,1398.9h-2v-1h2V1398.9z M466.7,1398.9h-2v-1h2V1398.9z M470.7,1398.9h-2v-1h2V1398.9z
				 M474.6,1398.9h-2v-1h2V1398.9z M478.6,1398.9h-2v-1h2V1398.9z M482.6,1398.9h-2v-1h2V1398.9z M486.6,1398.9h-2v-1h2V1398.9z
				 M490.6,1398.9h-2v-1h2V1398.9z M494.5,1398.9h-2v-1h2V1398.9z M498.5,1398.9h-2v-1h2V1398.9z M502.5,1398.9h-2v-1h2V1398.9z
				 M506.5,1398.9h-2v-1h2V1398.9z M510.5,1398.9h-2v-1h2V1398.9z M514.4,1398.9h-2v-1h2V1398.9z M518.4,1398.9h-2v-1h2V1398.9z
				 M522.4,1398.9h-2v-1h2V1398.9z M526.4,1398.9h-2v-1h2V1398.9z M530.4,1398.9h-2v-1h2V1398.9z M534.3,1398.9h-2v-1h2V1398.9z
				 M538.3,1398.9h-2v-1h2V1398.9z M542.3,1398.9h-2v-1h2V1398.9z M546.3,1398.9h-2v-1h2V1398.9z M550.3,1398.9h-2v-1h2V1398.9z
				 M554.2,1398.9h-2v-1h2V1398.9z M557.2,1399.2l-0.2-0.3h-0.7v-1h1.2l0,0l0.5,0.6L557.2,1399.2z M559.8,1402.2l-1.3-1.5l0.8-0.6
				l1.3,1.5L559.8,1402.2z M562.4,1404.8h-1v-0.7l-0.3-0.4l0.8-0.6l0.6,0.7V1404.8z M562.4,1408.8h-1v-2h1V1408.8z M562.4,1412.8h-1
				v-2h1V1412.8z M562.4,1416.7h-1v-2h1V1416.7z M562.4,1420.7h-1v-2h1V1420.7z M562.4,1424.7h-1v-2h1V1424.7z M562.4,1428.7h-1v-2
				h1V1428.7z"/>
		</g>
          <text transform="matrix(1 0 0 1 770.1907 546.5828)" class="st504 st497 st505">差压</text>
          <text transform="matrix(1 0 0 1 838.848 546.5828)" class="st504 st506 st505">KPa</text>
          <text code="C002" key="PDT3102BPV" transform="matrix(1 0 0 1 804.0218 546.5828)" class="st496 st507 st508">{{nodeInfo[3].numericalvalue}}</text>
	</g>
        <g id="组_1600" transform="translate(303.56 -238.44)">
		<g id="路径_2459-3" transform="translate(312.021 -874.18)" class="st499">
			<path class="st500" d="M562.3,1433.4H449.6l-6-7v-27.7h113.7l4.9,5.7V1433.4z"/>
      <path class="st501" d="M562.1,1433.3v-28.7l-4.9-5.7H443.7v27.5l6,6.9H562.1 M562.4,1433.5H449.6l-6.1-7.1v-27.8h113.9l5,5.8
				V1433.5z"/>
		</g>
          <g id="路径_2463-2" transform="translate(312.021 -873.715)">
			<path class="st502" d="M449.6,1433.5l-6.1-7.1v-27.8h113.9l5,5.8v29.1H449.6z"/>
            <path class="st503" d="M562.4,1433.5h-2v-1h1v-1.1h1V1433.5z M558.4,1433.5h-2v-1h2V1433.5z M554.4,1433.5h-2v-1h2V1433.5z
				 M550.5,1433.5h-2v-1h2V1433.5z M546.5,1433.5h-2v-1h2V1433.5z M542.5,1433.5h-2v-1h2V1433.5z M538.5,1433.5h-2v-1h2V1433.5z
				 M534.5,1433.5h-2v-1h2V1433.5z M530.6,1433.5h-2v-1h2V1433.5z M526.6,1433.5h-2v-1h2V1433.5z M522.6,1433.5h-2v-1h2V1433.5z
				 M518.6,1433.5h-2v-1h2V1433.5z M514.6,1433.5h-2v-1h2V1433.5z M510.7,1433.5h-2v-1h2V1433.5z M506.7,1433.5h-2v-1h2V1433.5z
				 M502.7,1433.5h-2v-1h2V1433.5z M498.7,1433.5h-2v-1h2V1433.5z M494.7,1433.5h-2v-1h2V1433.5z M490.8,1433.5h-2v-1h2V1433.5z
				 M486.8,1433.5h-2v-1h2V1433.5z M482.8,1433.5h-2v-1h2V1433.5z M478.8,1433.5h-2v-1h2V1433.5z M474.8,1433.5h-2v-1h2V1433.5z
				 M470.9,1433.5h-2v-1h2V1433.5z M466.9,1433.5h-2v-1h2V1433.5z M462.9,1433.5h-2v-1h2V1433.5z M458.9,1433.5h-2v-1h2V1433.5z
				 M454.9,1433.5h-2v-1h2V1433.5z M450.9,1433.5h-1.4l-0.4-0.5l0.4-0.4v-0.2h0.2l0.1-0.1l0.1,0.1h0.9V1433.5z M447.9,1431.5
				c0,0-0.4-0.5-0.8-0.9l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l-0.5-0.6l0.8-0.6l1.3,1.5L447.9,1431.5z M445.3,1428.5
				l-0.3-0.3c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0
				c-0.4-0.4-0.9-1.1-0.9-1.1l0.8-0.6l1.3,1.5L445.3,1428.5z M444.5,1425.2h-1v-2h1V1425.2z M444.5,1421.2h-1v-2h1V1421.2z
				 M444.5,1417.2h-1v-2h1V1417.2z M444.5,1413.3h-1v-2h1V1413.3z M444.5,1409.3h-1v-2h1V1409.3z M444.5,1405.3h-1v-2h1V1405.3z
				 M444.5,1401.3h-1v-2h1V1401.3z M446.8,1399.6h-2v-1h2V1399.6z M450.8,1399.6h-2v-1h2V1399.6z M454.7,1399.6h-2v-1h2V1399.6z
				 M458.7,1399.6h-2v-1h2V1399.6z M462.7,1399.6h-2v-1h2V1399.6z M466.7,1399.6h-2v-1h2V1399.6z M470.7,1399.6h-2v-1h2V1399.6z
				 M474.6,1399.6h-2v-1h2V1399.6z M478.6,1399.6h-2v-1h2V1399.6z M482.6,1399.6h-2v-1h2V1399.6z M486.6,1399.6h-2v-1h2V1399.6z
				 M490.6,1399.6h-2v-1h2V1399.6z M494.5,1399.6h-2v-1h2V1399.6z M498.5,1399.6h-2v-1h2V1399.6z M502.5,1399.6h-2v-1h2V1399.6z
				 M506.5,1399.6h-2v-1h2V1399.6z M510.5,1399.6h-2v-1h2V1399.6z M514.4,1399.6h-2v-1h2V1399.6z M518.4,1399.6h-2v-1h2V1399.6z
				 M522.4,1399.6h-2v-1h2V1399.6z M526.4,1399.6h-2v-1h2V1399.6z M530.4,1399.6h-2v-1h2V1399.6z M534.3,1399.6h-2v-1h2V1399.6z
				 M538.3,1399.6h-2v-1h2V1399.6z M542.3,1399.6h-2v-1h2V1399.6z M546.3,1399.6h-2v-1h2V1399.6z M550.3,1399.6h-2v-1h2V1399.6z
				 M554.2,1399.6h-2v-1h2V1399.6z M557.2,1399.9l-0.2-0.3h-0.7v-1h1.2l0,0l0.5,0.6L557.2,1399.9z M559.8,1402.9l-1.3-1.5l0.8-0.6
				l1.3,1.5L559.8,1402.9z M562.4,1405.6h-1v-0.7l-0.3-0.4l0.8-0.6l0.6,0.7V1405.6z M562.4,1409.5h-1v-2h1V1409.5z M562.4,1413.5h-1
				v-2h1V1413.5z M562.4,1417.5h-1v-2h1V1417.5z M562.4,1421.5h-1v-2h1V1421.5z M562.4,1425.5h-1v-2h1V1425.5z M562.4,1429.4h-1v-2
				h1V1429.4z"/>
		</g>
          <text transform="matrix(1 0 0 1 770.1907 547.3286)" class="st504 st497 st505">差压</text>
          <text transform="matrix(1 0 0 1 838.848 547.3286)" class="st504 st506 st505">KPa</text>
          <text  code="C001" key="PDT3102APV" transform="matrix(1 0 0 1 804.0218 547.3286)" class="st496 st507 st508">{{nodeInfo[2].numericalvalue}}</text>
	</g>
        <g id="组_1389" transform="translate(-324.44 149.309)">
		<g id="路径_2459-4" transform="translate(525.779 -873.858)" class="st499">
			<path class="st500" d="M564.3,1453.2H430.1l-6-7v-49.4h135.4l4.9,5.7V1453.2z"/>
      <path class="st501" d="M564.2,1453.1v-50.5l-4.9-5.7H424.2v49.2l6,6.9H564.2 M564.5,1453.3H430l-6.1-7.1v-49.6h135.5l5,5.8
				V1453.3z"/>
		</g>
          <g id="路径_2464-2" transform="translate(525.779 -873.858)">
			<path class="st502" d="M430,1453.3l-6.1-7.1v-49.6h135.5l5,5.8v50.8H430z"/>
            <path class="st503" d="M560.5,1453.3h-2v-1h2V1453.3z M556.5,1453.3h-2v-1h2V1453.3z M552.5,1453.3h-2v-1h2V1453.3z
				 M548.5,1453.3h-2v-1h2V1453.3z M544.6,1453.3h-2v-1h2V1453.3z M540.6,1453.3h-2v-1h2V1453.3z M536.6,1453.3h-2v-1h2V1453.3z
				 M532.6,1453.3h-2v-1h2V1453.3z M528.6,1453.3h-2v-1h2V1453.3z M524.7,1453.3h-2v-1h2V1453.3z M520.7,1453.3h-2v-1h2V1453.3z
				 M516.7,1453.3h-2v-1h2V1453.3z M512.7,1453.3h-2v-1h2V1453.3z M508.7,1453.3h-2v-1h2V1453.3z M504.7,1453.3h-2v-1h2V1453.3z
				 M500.8,1453.3h-2v-1h2V1453.3z M496.8,1453.3h-2v-1h2V1453.3z M492.8,1453.3h-2v-1h2V1453.3z M488.8,1453.3h-2v-1h2V1453.3z
				 M484.8,1453.3h-2v-1h2V1453.3z M480.9,1453.3h-2v-1h2V1453.3z M476.9,1453.3h-2v-1h2V1453.3z M472.9,1453.3h-2v-1h2V1453.3z
				 M468.9,1453.3h-2v-1h2V1453.3z M464.9,1453.3h-2v-1h2V1453.3z M461,1453.3h-2v-1h2V1453.3z M457,1453.3h-2v-1h2V1453.3z
				 M453,1453.3h-2v-1h2V1453.3z M449,1453.3h-2v-1h2V1453.3z M445,1453.3h-2v-1h2V1453.3z M441.1,1453.3h-2v-1h2V1453.3z
				 M437.1,1453.3h-2v-1h2V1453.3z M433.1,1453.3h-2v-1h2V1453.3z M429.4,1452.7c0,0-0.4-0.5-0.7-0.9l0,0c0,0,0,0,0,0l0,0
				c0,0,0,0,0,0l-0.5-0.6l0.8-0.6l1.3,1.5L429.4,1452.7z M426.8,1449.7l-1.3-1.5l0.8-0.6l1.3,1.5L426.8,1449.7z M424.2,1446.7
				l-0.3-0.4l0,0v-1.5h1v1.1l0.1,0.1l-0.1,0.1v0.2h-0.2L424.2,1446.7z M424.9,1442.8h-1v-2h1V1442.8z M424.9,1438.8h-1v-2h1V1438.8z
				 M424.9,1434.8h-1v-2h1V1434.8z M424.9,1430.9h-1v-2h1V1430.9z M424.9,1426.9h-1v-2h1V1426.9z M424.9,1422.9h-1v-2h1V1422.9z
				 M424.9,1418.9h-1v-2h1V1418.9z M424.9,1414.9h-1v-2h1V1414.9z M424.9,1411h-1v-2h1V1411z M424.9,1407h-1v-2h1V1407z M424.9,1403
				h-1v-2h1V1403z M424.9,1399h-1v-2h1V1399z M427.6,1397.7h-2v-1h2V1397.7z M431.5,1397.7h-2v-1h2V1397.7z M435.5,1397.7h-2v-1h2
				V1397.7z M439.5,1397.7h-2v-1h2V1397.7z M443.5,1397.7h-2v-1h2V1397.7z M447.5,1397.7h-2v-1h2V1397.7z M451.4,1397.7h-2v-1h2
				V1397.7z M455.4,1397.7h-2v-1h2V1397.7z M459.4,1397.7h-2v-1h2V1397.7z M463.4,1397.7h-2v-1h2V1397.7z M467.4,1397.7h-2v-1h2
				V1397.7z M471.3,1397.7h-2v-1h2V1397.7z M475.3,1397.7h-2v-1h2V1397.7z M479.3,1397.7h-2v-1h2V1397.7z M483.3,1397.7h-2v-1h2
				V1397.7z M487.3,1397.7h-2v-1h2V1397.7z M491.2,1397.7h-2v-1h2V1397.7z M495.2,1397.7h-2v-1h2V1397.7z M499.2,1397.7h-2v-1h2
				V1397.7z M503.2,1397.7h-2v-1h2V1397.7z M507.2,1397.7h-2v-1h2V1397.7z M511.1,1397.7h-2v-1h2V1397.7z M515.1,1397.7h-2v-1h2
				V1397.7z M519.1,1397.7h-2v-1h2V1397.7z M523.1,1397.7h-2v-1h2V1397.7z M527.1,1397.7h-2v-1h2V1397.7z M531,1397.7h-2v-1h2
				V1397.7z M535,1397.7h-2v-1h2V1397.7z M539,1397.7h-2v-1h2V1397.7z M543,1397.7h-2v-1h2V1397.7z M547,1397.7h-2v-1h2V1397.7z
				 M550.9,1397.7h-2v-1h2V1397.7z M554.9,1397.7h-2v-1h2V1397.7z M558.9,1397.7h-2v-1h2V1397.7z M560.9,1399.9l-1.3-1.5l0.8-0.6
				l1.3,1.5L560.9,1399.9z M563.5,1403l-1.3-1.5l0.8-0.6l0.4,0.5c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0.4,0.4,0.9,1,0.9,1L563.5,1403z
				 M564.5,1406.2h-1v-2h1V1406.2z M564.5,1410.2h-1v-2h1V1410.2z M564.5,1414.2h-1v-2h1V1414.2z M564.5,1418.2h-1v-2h1V1418.2z
				 M564.5,1422.2h-1v-2h1V1422.2z M564.5,1426.1h-1v-2h1V1426.1z M564.5,1430.1h-1v-2h1V1430.1z M564.5,1434.1h-1v-2h1V1434.1z
				 M564.5,1438.1h-1v-2h1V1438.1z M564.5,1442.1h-1v-2h1V1442.1z M564.5,1446h-1v-2h1V1446z M564.5,1450h-1v-2h1V1450z
				 M564.5,1453.3h-2v-1h1v-0.3h1V1453.3z"/>
		</g>
          <text transform="matrix(1 0 0 1 962.6229 543.4116)" class="st504 st497 st505">进站压力</text>
          <text transform="matrix(1 0 0 1 1053.1707 543.4116)" class="st504 st506 st505">MPa</text>
          <text code="P001" key="PT3102BP" transform="matrix(1 0 0 1 1017.3494 543.4116)" class="st496 st507 st508">{{ nodeInfo[4].numericalvalue }}</text>
          <text transform="matrix(1 0 0 1 962.6229 566.2974)" class="st504 st497 st505">进站温度</text>
          <text transform="matrix(1 0 0 1 1053.1707 566.2974)" class="st504 st506 st505">℃</text>
          <text code="T001" key="TT3102BT" transform="matrix(1 0 0 1 1017.3494 566.2974)" class="st496 st507 st508">{{ nodeInfo[15].numericalvalue }}</text>
	</g>
        <text transform="matrix(1 0 0 1 511.8142 810.8818)" class="st496 st507 st508">MV101#阀</text>
        <text transform="matrix(1 0 0 1 637.6257 823.8173)" class="st496 st507 st508">{{nodeInfo[16].name  }}</text>
        <text transform="matrix(1 0 0 1 637.6257 803.9169)" class="st496 st507 st508">{{nodeInfo[4].name  }}</text>
        <text transform="matrix(1 0 0 1 1274.0076 396.9492)" class="st496 st507 st508">{{nodeInfo[0].name }}</text>
        <text transform="matrix(1 0 0 1 1068.0364 412.8696)" class="st496 st507 st508">{{nodeInfo[2].name  }}</text>
        <text transform="matrix(1 0 0 1 1274.0076 542.2236)" class="st496 st507 st508">{{nodeInfo[1].name  }}</text>
        <text transform="matrix(1 0 0 1 1598.8259 481.3305)" class="st496 st507 st508">{{nodeInfo[5].name }}</text>
        <text transform="matrix(1 0 0 1 1598.8259 501.2314)" class="st496 st507 st508">{{nodeInfo[15].name  }}</text>
        <text transform="matrix(1 0 0 1 1068.0364 558.144)" class="st496 st507 st508">{{nodeInfo[3].name}}</text>
        <g id="组_1385" transform="translate(286.06 -249.137)">
		<g id="路径_2459-5" transform="translate(526.021 -874.18)" class="st499">
			<path class="st500" d="M561.3,1455.2H448.7l-6-7v-49.4h113.7l4.9,5.7V1455.2z"/>
      <path class="st501" d="M561.2,1455.1v-50.5l-4.9-5.7H442.8v49.2l6,6.9H561.2 M561.4,1455.3H448.6l-6.1-7.1v-49.6h113.9l5,5.8
				V1455.3z"/>
		</g>
          <g id="路径_2460" transform="translate(526.021 -874.18)">
			<path class="st502" d="M448.6,1455.3l-6.1-7.1v-49.6h113.9l5,5.8v50.8H448.6z"/>
            <path class="st503" d="M557.4,1455.3h-2v-1h2V1455.3z M553.5,1455.3h-2v-1h2V1455.3z M549.5,1455.3h-2v-1h2V1455.3z
				 M545.5,1455.3h-2v-1h2V1455.3z M541.5,1455.3h-2v-1h2V1455.3z M537.5,1455.3h-2v-1h2V1455.3z M533.6,1455.3h-2v-1h2V1455.3z
				 M529.6,1455.3h-2v-1h2V1455.3z M525.6,1455.3h-2v-1h2V1455.3z M521.6,1455.3h-2v-1h2V1455.3z M517.6,1455.3h-2v-1h2V1455.3z
				 M513.7,1455.3h-2v-1h2V1455.3z M509.7,1455.3h-2v-1h2V1455.3z M505.7,1455.3h-2v-1h2V1455.3z M501.7,1455.3h-2v-1h2V1455.3z
				 M497.7,1455.3h-2v-1h2V1455.3z M493.8,1455.3h-2v-1h2V1455.3z M489.8,1455.3h-2v-1h2V1455.3z M485.8,1455.3h-2v-1h2V1455.3z
				 M481.8,1455.3h-2v-1h2V1455.3z M477.8,1455.3h-2v-1h2V1455.3z M473.9,1455.3h-2v-1h2V1455.3z M469.9,1455.3h-2v-1h2V1455.3z
				 M465.9,1455.3h-2v-1h2V1455.3z M461.9,1455.3h-2v-1h2V1455.3z M457.9,1455.3h-2v-1h2V1455.3z M454,1455.3h-2v-1h2V1455.3z
				 M450,1455.3h-1.4l-0.4-0.5l0.4-0.4v-0.2h0.2l0.1-0.1l0.1,0.1h0.9V1455.3z M446.9,1453.3l-1.3-1.5l0.8-0.6l1.3,1.5L446.9,1453.3
				L446.9,1453.3z M444.3,1450.3l-0.2-0.3c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c-0.4-0.4-1.1-1.2-1.1-1.2l0.8-0.6l1.3,1.5L444.3,1450.3z
				 M443.5,1447h-1v-2h1V1447z M443.5,1443h-1v-2h1V1443z M443.5,1439h-1v-2h1V1439z M443.5,1435.1h-1v-2h1V1435.1z M443.5,1431.1
				h-1v-2h1V1431.1z M443.5,1427.1h-1v-2h1V1427.1z M443.5,1423.1h-1v-2h1V1423.1z M443.5,1419.1h-1v-2h1V1419.1z M443.5,1415.2h-1
				v-2h1V1415.2z M443.5,1411.2h-1v-2h1V1411.2z M443.5,1407.2h-1v-2h1V1407.2z M443.5,1403.2h-1v-2h1V1403.2z M443.9,1399.7h-1.4
				v-0.4v0.4v-0.4v-0.6h1c0.2,0,0.4,0,0.4,0V1399.7z M447.9,1399.7h-2v-1h2V1399.7z M451.9,1399.7h-2v-1h2V1399.7z M455.9,1399.7h-2
				v-1h2V1399.7z M459.9,1399.7h-2v-1h2V1399.7z M463.8,1399.7h-2v-1h2V1399.7z M467.8,1399.7h-2v-1h2V1399.7z M471.8,1399.7h-2v-1
				h2V1399.7z M475.8,1399.7h-2v-1h2V1399.7z M479.8,1399.7h-2v-1h2V1399.7z M483.7,1399.7h-2v-1h2V1399.7z M487.7,1399.7h-2v-1h2
				V1399.7z M491.7,1399.7h-2v-1h2V1399.7z M495.7,1399.7h-2v-1h2V1399.7z M499.7,1399.7h-2v-1h2V1399.7z M503.6,1399.7h-2v-1h2
				V1399.7z M507.6,1399.7h-2v-1h2V1399.7z M511.6,1399.7h-2v-1h2V1399.7z M515.6,1399.7h-2v-1h2V1399.7z M519.6,1399.7h-2v-1h2
				V1399.7z M523.5,1399.7h-2v-1h2V1399.7z M527.5,1399.7h-2v-1h2V1399.7z M531.5,1399.7h-2v-1h2V1399.7z M535.5,1399.7h-2v-1h2
				V1399.7z M539.5,1399.7h-2v-1h2V1399.7z M543.4,1399.7h-2v-1h2V1399.7z M547.4,1399.7h-2v-1h2V1399.7z M551.4,1399.7h-2v-1h2
				V1399.7z M555.4,1399.7h-2v-1h2V1399.7z M557.6,1401.6l-1.3-1.5l0.8-0.6c0,0,1.1,1.3,1.3,1.5l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0
				l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0L557.6,1401.6z
				 M560.2,1404.6l-1.3-1.5l0.8-0.6l1.3,1.5L560.2,1404.6z M561.4,1407.7h-1v-2h1V1407.7z M561.4,1411.7h-1v-2h1V1411.7z
				 M561.4,1415.7h-1v-2h1V1415.7z M561.4,1419.7h-1v-2h1V1419.7z M561.4,1423.7h-1v-2h1V1423.7z M561.4,1427.6h-1v-2h1V1427.6z
				 M561.4,1431.6h-1v-2h1V1431.6z M561.4,1435.6h-1v-2h1V1435.6z M561.4,1439.6h-1v-2h1V1439.6z M561.4,1443.6h-1v-2h1V1443.6z
				 M561.4,1447.5h-1v-2h1V1447.5z M561.4,1451.5h-1v-2h1V1451.5z M561.4,1455.3h-2v-1h1v-0.8h1V1455.3z"/>
		</g>
          <text transform="matrix(1 0 0 1 983.47 545.3918)" class="st504 st497 st505">压力</text>
          <text transform="matrix(1 0 0 1 1050.137 545.3918)" class="st504 st506 st505">MPa</text>
          <text code="P002" key="microtimeP101" transform="matrix(1 0 0 1 1014.3157 545.3918)" class="st496 st507 st508">{{nodeInfo[0].pressurevalue}}</text>
          <text transform="matrix(1 0 0 1 983.47 568.2776)" class="st504 st497 st505">温度</text>
          <text transform="matrix(1 0 0 1 1050.137 568.2776)" class="st504 st506 st505">℃</text>
          <text code="T002" key="microtimeT101" transform="matrix(1 0 0 1 1014.3157 568.2776)" class="st496 st507 st508">{{nodeInfo[0].temperaturevalue}}</text>
	</g>
        <g id="组_1601" transform="translate(286.06 -100.066)">
		<g id="路径_2459-6" transform="translate(526.021 -874.18)" class="st499">
			<path class="st500" d="M561.3,1454.5H448.7l-6-7v-49.4h113.7l4.9,5.7V1454.5z"/>
      <path class="st501" d="M561.2,1454.3v-50.5l-4.9-5.7H442.8v49.2l6,6.9H561.2 M561.4,1454.6H448.6l-6.1-7.1v-49.6h113.9l5,5.8
				V1454.6z"/>
		</g>
          <g id="路径_2460-2" transform="translate(526.021 -874.18)">
			<path class="st502" d="M448.6,1454.6l-6.1-7.1v-49.6h113.9l5,5.8v50.8H448.6z"/>
            <path class="st503" d="M557.4,1454.6h-2v-1h2V1454.6z M553.5,1454.6h-2v-1h2V1454.6z M549.5,1454.6h-2v-1h2V1454.6z
				 M545.5,1454.6h-2v-1h2V1454.6z M541.5,1454.6h-2v-1h2V1454.6z M537.5,1454.6h-2v-1h2V1454.6z M533.6,1454.6h-2v-1h2V1454.6z
				 M529.6,1454.6h-2v-1h2V1454.6z M525.6,1454.6h-2v-1h2V1454.6z M521.6,1454.6h-2v-1h2V1454.6z M517.6,1454.6h-2v-1h2V1454.6z
				 M513.7,1454.6h-2v-1h2V1454.6z M509.7,1454.6h-2v-1h2V1454.6z M505.7,1454.6h-2v-1h2V1454.6z M501.7,1454.6h-2v-1h2V1454.6z
				 M497.7,1454.6h-2v-1h2V1454.6z M493.8,1454.6h-2v-1h2V1454.6z M489.8,1454.6h-2v-1h2V1454.6z M485.8,1454.6h-2v-1h2V1454.6z
				 M481.8,1454.6h-2v-1h2V1454.6z M477.8,1454.6h-2v-1h2V1454.6z M473.9,1454.6h-2v-1h2V1454.6z M469.9,1454.6h-2v-1h2V1454.6z
				 M465.9,1454.6h-2v-1h2V1454.6z M461.9,1454.6h-2v-1h2V1454.6z M457.9,1454.6h-2v-1h2V1454.6z M454,1454.6h-2v-1h2V1454.6z
				 M450,1454.6h-1.4l-0.4-0.5l0.4-0.4v-0.2h0.2l0.1-0.1l0.1,0.1h0.9V1454.6z M446.9,1452.6l-1.3-1.5l0.8-0.6l1.3,1.5L446.9,1452.6
				L446.9,1452.6z M444.3,1449.6l-0.2-0.3c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c-0.4-0.4-1.1-1.2-1.1-1.2l0.8-0.6l1.3,1.5L444.3,1449.6z
				 M443.5,1446.3h-1v-2h1V1446.3z M443.5,1442.3h-1v-2h1V1442.3z M443.5,1438.3h-1v-2h1V1438.3z M443.5,1434.3h-1v-2h1V1434.3z
				 M443.5,1430.3h-1v-2h1V1430.3z M443.5,1426.4h-1v-2h1V1426.4z M443.5,1422.4h-1v-2h1V1422.4z M443.5,1418.4h-1v-2h1V1418.4z
				 M443.5,1414.4h-1v-2h1V1414.4z M443.5,1410.4h-1v-2h1V1410.4z M443.5,1406.5h-1v-2h1V1406.5z M443.5,1402.5h-1v-2h1V1402.5z
				 M443.9,1398.9h-1.4v-0.4v0.4v-0.4v-0.6h1c0.2,0,0.4,0,0.4,0V1398.9z M447.9,1398.9h-2v-1h2V1398.9z M451.9,1398.9h-2v-1h2
				V1398.9z M455.9,1398.9h-2v-1h2V1398.9z M459.9,1398.9h-2v-1h2V1398.9z M463.8,1398.9h-2v-1h2V1398.9z M467.8,1398.9h-2v-1h2
				V1398.9z M471.8,1398.9h-2v-1h2V1398.9z M475.8,1398.9h-2v-1h2V1398.9z M479.8,1398.9h-2v-1h2V1398.9z M483.7,1398.9h-2v-1h2
				V1398.9z M487.7,1398.9h-2v-1h2V1398.9z M491.7,1398.9h-2v-1h2V1398.9z M495.7,1398.9h-2v-1h2V1398.9z M499.7,1398.9h-2v-1h2
				V1398.9z M503.6,1398.9h-2v-1h2V1398.9z M507.6,1398.9h-2v-1h2V1398.9z M511.6,1398.9h-2v-1h2V1398.9z M515.6,1398.9h-2v-1h2
				V1398.9z M519.6,1398.9h-2v-1h2V1398.9z M523.5,1398.9h-2v-1h2V1398.9z M527.5,1398.9h-2v-1h2V1398.9z M531.5,1398.9h-2v-1h2
				V1398.9z M535.5,1398.9h-2v-1h2V1398.9z M539.5,1398.9h-2v-1h2V1398.9z M543.4,1398.9h-2v-1h2V1398.9z M547.4,1398.9h-2v-1h2
				V1398.9z M551.4,1398.9h-2v-1h2V1398.9z M555.4,1398.9h-2v-1h2V1398.9z M557.6,1400.8l-1.3-1.5l0.8-0.6c0,0,1.1,1.3,1.3,1.5l0,0
				c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0l0,0c0,0,0,0,0,0
				l0,0L557.6,1400.8z M560.2,1403.8l-1.3-1.5l0.8-0.6l1.3,1.5L560.2,1403.8z M561.4,1407h-1v-2h1V1407z M561.4,1411h-1v-2h1V1411z
				 M561.4,1415h-1v-2h1V1415z M561.4,1418.9h-1v-2h1V1418.9z M561.4,1422.9h-1v-2h1V1422.9z M561.4,1426.9h-1v-2h1V1426.9z
				 M561.4,1430.9h-1v-2h1V1430.9z M561.4,1434.9h-1v-2h1V1434.9z M561.4,1438.8h-1v-2h1V1438.8z M561.4,1442.8h-1v-2h1V1442.8z
				 M561.4,1446.8h-1v-2h1V1446.8z M561.4,1450.8h-1v-2h1V1450.8z M561.4,1454.6h-2v-1h1v-0.8h1V1454.6z"/>
		</g>
          <text transform="matrix(1 0 0 1 983.47 544.6509)" class="st504 st497 st505">压力</text>
          <text transform="matrix(1 0 0 1 1050.137 544.6509)" class="st504 st506 st505">MPa</text>
          <text code="P003" key="microtimeP102" transform="matrix(1 0 0 1 1014.3157 544.6509)" class="st496 st507 st508">{{ nodeInfo[1].pressurevalue }}</text>
          <text transform="matrix(1 0 0 1 983.47 567.5366)" class="st504 st497 st505">温度</text>
          <text transform="matrix(1 0 0 1 1050.137 567.5366)" class="st504 st506 st505">℃</text>
          <text code="T003" key="microtimeT102" transform="matrix(1 0 0 1 1014.3157 567.5366)" class="st496 st507 st508">{{ nodeInfo[1].temperaturevalue }}</text>
	</g>
</g>
      <g>
	<circle :myid="nodeInfo[6].id" @click='changeState1(6)' style='cursor:pointer'  l="1" class="st509" cx="170.1" cy="545.7" r="10"/>
        <path class="st510" d="M170.1,536.2c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5c-5.2,0-9.5-4.2-9.5-9.5S164.9,536.2,170.1,536.2
		 M170.1,535.2c-5.8,0-10.5,4.7-10.5,10.5s4.7,10.5,10.5,10.5s10.5-4.7,10.5-10.5S175.9,535.2,170.1,535.2L170.1,535.2z"/>
</g>
</svg>
  </div>

</template>
<style>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.box-card {
  width: 240px;
}
.st0{fill:url(#SVGID_1_);}
.st1{fill:url(#SVGID_00000108295015547130136270000005168149360236497557_);}
.st2{clip-path:url(#SVGID_00000080903970542216638390000002248128268409944754_);}
.st3{clip-path:url(#SVGID_00000105427537475150976820000017947388623633186437_);}
.st4{fill:#808080;}
.st5{fill:url(#SVGID_00000076572745239129197910000004211795603006385287_);}
.st6{fill:url(#SVGID_00000009587722116656845340000015011788363274063259_);}
.st7{fill:url(#SVGID_00000101820907350765402570000013465910236532688801_);}
.st8{fill:url(#SVGID_00000181778989753615281370000018157079362668270734_);}
.st9{clip-path:url(#SVGID_00000031204061714123590880000009280243955383824793_);}
.st10{clip-path:url(#SVGID_00000011754244673696259410000007902011874264285886_);}
.st11{fill:url(#SVGID_00000168795044305136768880000016184101365539330952_);}
.st12{fill:url(#SVGID_00000170999925221880698750000004529837236026377387_);}
.st13{fill:url(#SVGID_00000000192053614360881120000009887128286323734461_);}
.st14{clip-path:url(#SVGID_00000136369775388111062840000004278816308744003968_);}
.st15{clip-path:url(#SVGID_00000123432615272852751380000012353826349170854836_);}
.st16{fill:url(#SVGID_00000145758450910049200390000017640913244809549734_);}
.st17{fill:url(#SVGID_00000090983171199707222930000005212869821986145681_);}
.st18{fill:#C4C3AC;}
.st19{fill:url(#SVGID_00000125586125972876300840000000245414646382158760_);}
.st20{fill:#969173;}
.st21{fill:#DDD9CE;}
.st22{fill:url(#SVGID_00000007398615023652501310000007467306145340632755_);}
.st23{fill:url(#SVGID_00000009573981839183622880000003508588078450329507_);}
.st24{fill:url(#SVGID_00000168835447057167030350000002904183540064114835_);}
.st25{fill:url(#SVGID_00000157266050380165118320000005033256723938781594_);}
.st26{fill:url(#SVGID_00000145027243180361091600000007371340483904416153_);}
.st27{fill:url(#SVGID_00000099645714235431784840000015748731093048749229_);}
.st28{fill:url(#SVGID_00000141415798644863658430000013863614611072839311_);}
.st29{fill:url(#SVGID_00000118356759118142762440000018438099978947676094_);}
.st30{fill:url(#SVGID_00000183933810722031506110000002577363728614351013_);}
.st31{fill:url(#SVGID_00000121249809075194278500000012457048617715093669_);}
.st32{fill:url(#SVGID_00000183942732321304821350000007552525265495974788_);}
.st33{fill:#4D4D4D;}
.st34{fill:#FBB03B;}
.st35{fill:url(#SVGID_00000096023025450380126380000004531556707762717599_);}
.st36{fill:url(#SVGID_00000132787554063878669190000016121262449831092615_);}
.st37{fill:url(#SVGID_00000088855736977158544240000008563833198810825140_);}
.st38{fill:url(#SVGID_00000183219495162964480300000009832683242774015110_);}
.st39{fill:url(#SVGID_00000083062863456731773830000002254936634856830875_);}
.st40{fill:url(#SVGID_00000030473188342465760800000000461199556853098665_);}
.st41{fill:url(#SVGID_00000040556964995181827210000002790333950662129060_);}
.st42{fill:url(#SVGID_00000124859944241455862060000012840796646964407188_);}
.st43{fill:url(#SVGID_00000093893014771018572310000010509296542609119118_);}
.st44{fill:url(#SVGID_00000044896029950234678490000006057178676280412602_);}
.st45{fill:url(#SVGID_00000129889282794617163680000000408117249072720545_);}
.st46{fill:url(#SVGID_00000011025711035459442920000017592494725072807044_);}
.st47{fill:url(#SVGID_00000052821956436612749400000008497154945932927395_);}
.st48{fill:url(#SVGID_00000110450161579723977170000003716696745442846902_);}
.st49{fill:url(#SVGID_00000040547532070148512640000006233970513562005913_);}
.st50{fill:url(#SVGID_00000160173094365990888440000014514930939653972400_);}
.st51{fill:url(#SVGID_00000139258197947755901330000004979579955360143789_);}
.st52{clip-path:url(#SVGID_00000133528267771044120020000010252350509227623603_);}
.st53{clip-path:url(#SVGID_00000058557540019288765200000011196593948111840397_);}
.st54{fill:url(#SVGID_00000084511925107712588090000004554403760821046688_);}
.st55{fill:url(#SVGID_00000041983729726431354050000011757209484673389960_);}
.st56{fill:url(#SVGID_00000114761405365738205880000015372866405423859882_);}
.st57{fill:url(#SVGID_00000136406853093484296360000016943402786240897962_);}
.st58{fill:url(#SVGID_00000065764278942490771050000004682743222667180192_);}
.st59{fill:url(#SVGID_00000044161081501132405960000015292575435152776585_);}
.st60{fill:url(#SVGID_00000168810810040036349740000006638435431491902872_);}
.st61{fill:url(#SVGID_00000175300210852008365230000004267309532826299521_);}
.st62{fill:url(#SVGID_00000027606962613708229600000007977904569125689012_);}
.st63{fill:url(#SVGID_00000006708239922959960580000010723634422118752142_);}
.st64{fill:url(#SVGID_00000057831757609681193300000002356355453858082186_);}
.st65{fill:url(#SVGID_00000139274203907609651500000002134212608460291471_);}
.st66{fill:url(#SVGID_00000130606733273059250500000001847102048289285793_);}
.st67{fill:url(#SVGID_00000127741305451252567580000005945432861246865075_);}
.st68{fill:url(#SVGID_00000062911469168563171440000003023084852611048125_);}
.st69{fill:url(#SVGID_00000068668735639277315830000003335456238151738520_);}
.st70{fill:url(#SVGID_00000130637843039416332840000002327494699576331428_);}
.st71{fill:url(#SVGID_00000136388721062731174230000000389919841369241022_);}
.st72{fill:url(#SVGID_00000023974059823615945090000000189403057852655009_);}
.st73{fill:url(#SVGID_00000044166113584886262520000005754262524416228751_);}
.st74{fill:url(#SVGID_00000060024361464234642810000000800628111060342166_);}
.st75{fill:url(#SVGID_00000034803240808190486080000015792916133519119243_);}
.st76{clip-path:url(#SVGID_00000101077837403671265850000004549430435758683059_);}
.st77{clip-path:url(#SVGID_00000093861371445022288560000003340295554519454083_);}
.st78{fill:url(#SVGID_00000031918617158067653140000013189429431355669678_);}
.st79{fill:url(#SVGID_00000120529297212749403210000004991526207156185754_);}
.st80{fill:url(#SVGID_00000101062621887404252300000013614672681924472497_);}
.st81{clip-path:url(#SVGID_00000070810590575481041670000012156936178534614165_);}
.st82{clip-path:url(#SVGID_00000065753403068212501670000015788997274237012141_);}
.st83{fill:url(#SVGID_00000173152251761234671160000010152182145654759818_);}
.st84{fill:url(#SVGID_00000098200541420974715660000012985674742909987753_);}
.st85{fill:url(#SVGID_00000000915296129500563340000014901170905852464808_);}
.st86{clip-path:url(#SVGID_00000125583382354375497320000001760786113041682853_);}
.st87{clip-path:url(#SVGID_00000028306967866389971200000001870125678783501744_);}
.st88{fill:url(#SVGID_00000057114477432176508450000013389803270943122852_);}
.st89{fill:url(#SVGID_00000132805478376350596890000009649019509022854316_);}
.st90{fill:url(#SVGID_00000013165449014566216810000013979047590617954736_);}
.st91{fill:url(#SVGID_00000139280776482117398510000007097564496834561939_);}
.st92{fill:url(#SVGID_00000125560834373370405960000007598836114106182060_);}
.st93{fill:url(#SVGID_00000134953671077244131870000003996204086471630222_);}
.st94{fill:url(#SVGID_00000141422434387009172170000001580718540403215502_);}
.st95{fill:url(#SVGID_00000153669593042748100840000016143254053772390306_);}
.st96{fill:url(#SVGID_00000093880663573047654600000012091825240737304488_);}
.st97{fill:#F0B64C;}
.st98{fill:#DE9227;}
.st99{fill:#BA7E1E;}
.st100{fill:url(#SVGID_00000038387297391698596220000008762724463055972755_);}
.st101{fill:url(#SVGID_00000154402221621573202330000010591479886254895518_);}
.st102{fill:url(#SVGID_00000114796058528514389810000009314947802815650433_);}
.st103{fill:url(#SVGID_00000181808642913466616010000004813495484068015267_);}
.st104{fill:url(#SVGID_00000155860794381327015420000010727316842057413290_);}
.st105{fill:url(#SVGID_00000059283716874166086570000006913177140705456262_);}
.st106{fill:url(#SVGID_00000039129443436820161960000012908979497053294488_);}
.st107{fill:url(#SVGID_00000051363644491865917170000011046896299021696430_);}
.st108{fill:url(#SVGID_00000137091835476854533580000000857924779542337664_);}
.st109{fill:url(#SVGID_00000143605691918133904630000012664148514864321955_);}
.st110{fill:url(#SVGID_00000141435818046847179000000014236153263746763673_);}
.st111{fill:url(#SVGID_00000154393725888832657550000011622440942019206273_);}
.st112{fill:url(#SVGID_00000152243750948157470310000001600107507619206533_);}
.st113{fill:url(#SVGID_00000015346163378904092620000002899861097678136966_);}
.st114{fill:url(#SVGID_00000019666044183796275170000018036059345772898982_);}
.st115{fill:url(#SVGID_00000086675765681621294990000002856644316772480939_);}
.st116{fill:url(#SVGID_00000103239530885484175710000016934782536612139680_);}
.st117{fill:url(#SVGID_00000160885228981761634750000001278435722573036161_);}
.st118{fill:url(#SVGID_00000034780383371302021140000003696358666602034848_);}
.st119{fill:url(#SVGID_00000124125101560121922110000012479389257990270370_);}
.st120{fill:url(#SVGID_00000011024540784640678690000016934875419176115899_);}
.st121{fill:url(#SVGID_00000129170745362671168830000007570435229034919046_);}
.st122{fill:url(#SVGID_00000152259025391552077170000014169186709075627918_);}
.st123{fill:url(#SVGID_00000031887774198678868350000012068896959629542049_);}
.st124{fill:url(#SVGID_00000046301064578102897060000007180521650972859801_);}
.st125{fill:url(#SVGID_00000018203975427029636200000007270395045572606892_);}
.st126{fill:url(#SVGID_00000177443744834003103310000002987296840067544202_);}
.st127{fill:url(#SVGID_00000025409374721771551190000017091880071010746015_);}
.st128{fill:url(#SVGID_00000163038571679705765330000016088966322601932455_);}
.st129{fill:#CCCCCC;}
.st130{fill:#999999;}
.st131{fill:#666666;}
.st132{fill:#0072BC;}
.st133{fill:#A9AFA7;}
.st134{fill:#333333;}
.st135{font-family:'Krungthep';}
.st136{font-size:6.55px;}
.st137{fill:#9CA399;}
.st138{font-family:'SimHei';}
.st139{font-size:1.03px;}
.st140{fill:url(#SVGID_00000127023949154039828880000016969286800040575158_);}
.st141{fill:url(#SVGID_00000118399005666752522740000000936792033017932180_);}
.st142{fill:url(#SVGID_00000060728417463688956200000016754962590595601055_);}
.st143{fill:url(#SVGID_00000093165531373647859660000009920787821048255399_);}
.st144{fill:url(#SVGID_00000034048373992051874070000012970897279216232846_);}
.st145{fill:url(#SVGID_00000164489105165112531170000003541684074335338936_);}
.st146{fill:url(#SVGID_00000090984061654352521050000015764194659653898923_);}
.st147{fill:url(#SVGID_00000174583550054682805640000007900400998999269037_);}
.st148{fill:url(#SVGID_00000049904408881583171790000015066865950451380381_);}
.st149{fill:url(#SVGID_00000085244915948870698360000017086648812886684594_);}
.st150{fill:url(#SVGID_00000172424959585000963570000014072754910697154944_);}
.st151{fill:url(#SVGID_00000080168278065648015240000009704985973087551392_);}
.st152{fill:url(#SVGID_00000034088687094860197530000005952180893441973909_);}
.st153{fill:url(#SVGID_00000145736525963072974650000006197655215405812652_);}
.st154{fill:url(#SVGID_00000070823985957319148610000001499750938652429746_);}
.st155{fill:url(#SVGID_00000105400472871751461580000002137375470631313317_);}
.st156{fill:url(#SVGID_00000035513612106466344110000001369179914220877480_);}
.st157{fill:url(#SVGID_00000029029007653104851370000017888260039932582563_);}
.st158{fill:url(#SVGID_00000019679538225945530280000003942940633603740845_);}
.st159{fill:url(#SVGID_00000165914247171921524820000007774597074298936976_);}
.st160{fill:url(#SVGID_00000169528196950093861440000010311920874371688619_);}
.st161{clip-path:url(#SVGID_00000140012878355271719670000015618762203648818321_);}
.st162{fill:url(#SVGID_00000139293493877539708860000006183020907094886559_);}
.st163{fill:url(#SVGID_00000136404556668443717990000017614332966848338831_);}
.st164{fill:url(#SVGID_00000022536580123633353540000016300361874067424959_);}
.st165{fill:url(#SVGID_00000105417596520982633590000007936552615641451195_);}
.st166{fill:url(#SVGID_00000037663085854264185550000013334672295684587189_);}
.st167{fill:url(#SVGID_00000101812594830230264310000004742955728241453193_);}
.st168{fill:url(#SVGID_00000139281748751247888510000015302880137020991402_);}
.st169{fill:url(#SVGID_00000109741400110590353080000012201433447378694069_);}
.st170{fill:url(#SVGID_00000026125736058665669300000016653718278632805511_);}
.st171{fill:url(#SVGID_00000170275922648022677610000006041446846341964193_);}
.st172{fill:url(#SVGID_00000115513355343013237300000014397920972398108055_);}
.st173{fill:url(#SVGID_00000078009477607048688290000012044607199694448529_);}
.st174{fill:#EA992F;}
.st175{fill:url(#SVGID_00000101790051930272759790000012045928533191204996_);}
.st176{fill:#F2A138;}
.st177{fill:url(#SVGID_00000151530444896246482430000018244676514676703876_);}
.st178{fill:url(#SVGID_00000023264193644490376750000009093439703862839174_);}
.st179{fill:url(#SVGID_00000164489763988928540130000002497319296536639915_);}
.st180{fill:url(#SVGID_00000142863981798096088750000012907963359461283220_);}
.st181{fill:url(#SVGID_00000003813990867133893220000017977610896802648718_);}
.st182{fill:url(#SVGID_00000121989214442205631400000003673121453107625645_);}
.st183{fill:url(#SVGID_00000111164875215803634370000000895965469510687668_);}
.st184{clip-path:url(#SVGID_00000087378676807403277270000003843207833370055856_);}
.st185{fill:url(#SVGID_00000097465982372279849690000005025889999717526434_);}
.st186{fill:url(#SVGID_00000054959563519946945940000001512459679741934992_);}
.st187{fill:url(#SVGID_00000000943776520778544910000004986904039015444883_);}
.st188{fill:url(#SVGID_00000150810006370482870290000005097577835116703157_);}
.st189{fill:url(#SVGID_00000176755474984886428300000002609828225285414021_);}
.st190{fill:url(#SVGID_00000175315089107731235910000002193260079020446636_);}
.st191{fill:url(#SVGID_00000180364858939444113760000009104234286811331511_);}
.st192{fill:url(#SVGID_00000104706134918686647890000005740525982356303783_);}
.st193{fill:url(#SVGID_00000062179927088847573140000006787584059794917002_);}
.st194{fill:url(#SVGID_00000016074971909898906870000011702216516188988077_);}
.st195{fill:url(#SVGID_00000052071161988190305870000006315302425283469191_);}
.st196{fill:url(#SVGID_00000080181402697744317370000000456929576542303120_);}
.st197{fill:url(#SVGID_00000002378391338334642060000010233392658730248103_);}
.st198{fill:url(#SVGID_00000183211471403900821630000009790426025801802399_);}
.st199{fill:url(#SVGID_00000087388829120281081700000006980913146597510573_);}
.st200{fill:url(#SVGID_00000093167538918956014680000017289644487335661230_);}
.st201{fill:url(#SVGID_00000087371583829674792850000002018444296098809490_);}
.st202{fill:url(#SVGID_00000010283200883187375320000006862773575173802932_);}
.st203{fill:url(#SVGID_00000076602972088390569130000013266479272584317874_);}
.st204{clip-path:url(#SVGID_00000122698886939981390780000007087890238176584373_);}
.st205{clip-path:url(#SVGID_00000151519729378930807370000003255341617904872322_);}
.st206{fill:#A67C52;}
.st207{fill:url(#SVGID_00000097502580703756090510000014829745166285108098_);}
.st208{fill:url(#SVGID_00000028316845639006165890000018363046859164080263_);}
.st209{clip-path:url(#SVGID_00000145772636051461921250000015199818796041620148_);}
.st210{clip-path:url(#SVGID_00000047759848199352981160000008496061846364960186_);}
.st211{fill:url(#SVGID_00000037670924231746740450000013053063558213726113_);}
.st212{fill:url(#SVGID_00000075857790076775133300000012092703951448581547_);}
.st213{fill:#F1F3FF;}
.st214{fill:#E2E5ED;}
.st215{fill:#7AC943;}
.st216{fill:#F15A24;}
.st217{fill:#FF931E;}
.st218{fill:url(#SVGID_00000173859262210141915980000005575795825044370840_);}
.st219{fill:url(#SVGID_00000052072396857225009870000001994653628073854630_);}
.st220{fill:url(#SVGID_00000063625585820109603480000008796629097485312390_);}
.st221{fill:url(#SVGID_00000173857775904127573130000010492065918148143774_);}
.st222{fill:url(#SVGID_00000060018084318857739340000007627249592181064094_);}
.st223{fill:url(#SVGID_00000168099491133317308830000014849008474318206617_);}
.st224{fill:url(#SVGID_00000147200395796224999200000017700842300691894663_);}
.st225{fill:url(#SVGID_00000031185731733892384260000014374145172006463111_);}
.st226{fill:url(#SVGID_00000158748356337579670320000016029688055496580539_);}
.st227{fill:#5C5E5B;}
.st228{fill:url(#SVGID_00000083786688846603673740000014433780846510816933_);}
.st229{fill:#C24728;}
.st230{fill:url(#SVGID_00000127736984141119221810000011493338839659497609_);}
.st231{fill:url(#SVGID_00000026880254228571377250000016342625781337233308_);}
.st232{fill:#46545F;}
.st233{fill:#B3CFDA;}
.st234{fill:#949A96;}
.st235{fill:#8C9AA5;}
.st236{fill:url(#SVGID_00000044900243138087742580000012354948322201382561_);}
.st237{fill:url(#SVGID_00000068665289639363814280000000454889798090347196_);}
.st238{fill:url(#SVGID_00000006685224409072290950000006914339817773179536_);}
.st239{fill:url(#SVGID_00000039855370515375020880000005946627998290186911_);}
.st240{fill:url(#SVGID_00000083086159167378298870000006639691119743900059_);}
.st241{fill:url(#SVGID_00000182487975774262529450000013020141989483657355_);}
.st242{fill:url(#SVGID_00000161625055874573290730000007579838532017806998_);}
.st243{fill:url(#SVGID_00000150075847410972912440000002642694754754958759_);}
.st244{fill:#1A1A1A;}
.st245{font-family:'PingFangSC-Light-GBpc-EUC-H';}
.st246{font-size:2.08px;}
.st247{font-size:1.62px;}
.st248{fill:url(#SVGID_00000109709603781436729670000014359905189614883759_);}
.st249{fill:url(#SVGID_00000160904265174527559140000004375926835929343125_);}
.st250{fill:url(#SVGID_00000018217042998406553020000013192181001441230267_);}
.st251{fill:url(#SVGID_00000037653382244686540220000005913929771235944888_);}
.st252{fill:url(#SVGID_00000082355869245897885380000000352040955562512819_);}
.st253{fill:url(#SVGID_00000155133129893508549720000013645745998808415656_);}
.st254{fill:url(#SVGID_00000132063387735168798230000004239297123919442082_);}
.st255{fill:url(#SVGID_00000088107565821040872400000002972687590306814347_);}
.st256{fill:url(#SVGID_00000008146660601345741060000016496051659433330304_);}
.st257{fill:url(#SVGID_00000131363900703398227780000008965830583597666178_);}
.st258{fill:url(#SVGID_00000084525878599908044980000008676892959438365346_);}
.st259{fill:url(#SVGID_00000133496462616858879530000006952525875732926366_);}
.st260{fill:url(#SVGID_00000042724257327283924500000009604629021591810978_);}
.st261{fill:url(#SVGID_00000168074396569845866290000002581186645833215106_);}
.st262{fill:url(#SVGID_00000060733843123502071850000015889371764898058657_);}
.st263{fill:url(#SVGID_00000177473087120858501220000011001651916436152509_);}
.st264{fill:url(#SVGID_00000181081324235139313180000005605804359650380175_);}
.st265{fill:url(#SVGID_00000014616569745094207370000005234286749136377756_);}
.st266{fill:url(#SVGID_00000036931912486041981470000000418513244283156406_);}
.st267{fill:url(#SVGID_00000088102165857474274840000009736720021312182684_);}
.st268{fill:url(#SVGID_00000054228029034958955800000005564974671317650333_);}
.st269{fill:url(#SVGID_00000014616537172308083000000012498106487245002656_);}
.st270{fill:url(#SVGID_00000065052550790302744600000004170888529829848248_);}
.st271{fill:url(#SVGID_00000149373977959571227870000014781969288590044320_);}
.st272{fill:url(#SVGID_00000170250805530662072610000000897376611098996111_);}
.st273{fill:url(#SVGID_00000063631335659113650700000007287280171341890953_);}
.st274{fill:url(#SVGID_00000124855946804036229130000011010091895420365237_);}
.st275{fill:url(#SVGID_00000068668323115909946830000000810638631807461567_);}
.st276{fill:url(#SVGID_00000128449494409609624140000007335209083192800934_);}
.st277{fill:url(#SVGID_00000061439524835286360830000011806677950064337565_);}
.st278{fill:url(#SVGID_00000013880224833366137550000017766786233425319333_);}
.st279{fill:url(#SVGID_00000093875053662989702440000006492439939945252005_);}
.st280{fill:url(#SVGID_00000088855570378474836990000015861626193974444168_);}
.st281{fill:url(#SVGID_00000169516868934875401290000005620879299922024834_);}
.st282{fill:url(#SVGID_00000085234775170231225260000015863382081075384464_);}
.st283{fill:url(#SVGID_00000118366145810886172950000007610444327172671639_);}
.st284{fill:url(#SVGID_00000039133611550713696970000009351458678253006735_);}
.st285{fill:url(#SVGID_00000153684484640318258250000004671058594702618791_);}
.st286{fill:url(#SVGID_00000183937334267895270130000012916879663772834469_);}
.st287{fill:url(#SVGID_00000175290802798602387730000011779644587987098294_);}
.st288{fill:url(#SVGID_00000082342656911893427010000002802120567934263736_);}
.st289{fill:url(#SVGID_00000105389372265030195120000002125342029621532861_);}
.st290{fill:url(#SVGID_00000041254015280000806170000001327277377241567633_);}
.st291{fill:url(#SVGID_00000011752306751922329670000008293525199757786802_);}
.st292{fill:url(#SVGID_00000014606494751158165250000006764857769163696004_);}
.st293{fill:url(#SVGID_00000037670576419127036440000002014630870837129098_);}
.st294{fill:url(#SVGID_00000031924678570703867130000011735698214986167993_);}
.st295{fill:url(#SVGID_00000088094079342676730960000011988613433327565204_);}
.st296{fill:url(#SVGID_00000070078977207139490710000016938659952928326816_);}
.st297{fill:url(#SVGID_00000067916431387097229420000017017193037190340281_);}
.st298{fill:url(#SVGID_00000064328762638203165420000003631966965177314474_);}
.st299{fill:url(#SVGID_00000148652196854552470180000014450317912721548963_);}
.st300{fill:url(#SVGID_00000105389960689743461090000006326957566025216433_);}
.st301{fill:url(#SVGID_00000181792097073351869380000011752369422126019720_);}
.st302{fill:url(#SVGID_00000005239038980099019250000008592333463044450237_);}
.st303{fill:url(#SVGID_00000134235368521003859410000000079708059859833510_);}
.st304{fill:url(#SVGID_00000160190563243752854630000010488768388777110432_);}
.st305{fill:url(#SVGID_00000170968484731418386460000015741048071514872459_);}
.st306{fill:url(#SVGID_00000051381822152756098490000002696243931073868178_);}
.st307{fill:url(#SVGID_00000050650423299354678320000002189355976133325752_);}
.st308{fill:url(#SVGID_00000171684816669303677150000010349798820750396092_);}
.st309{fill:url(#SVGID_00000012469114087692838130000004015284763762598590_);}
.st310{fill:url(#SVGID_00000165917078738143774540000001781519714541287849_);}
.st311{fill:url(#SVGID_00000131359714795280403710000007911821287313068673_);}
.st312{fill:url(#SVGID_00000010275487434927043870000012587298633301839550_);}
.st313{fill:url(#SVGID_00000013872065758963174270000011818253946384675508_);}
.st314{fill:url(#SVGID_00000119813714216929572140000004829838414200643493_);}
.st315{fill:url(#SVGID_00000036932838900223359530000001511380165660403585_);}
.st316{fill:url(#SVGID_00000092455209775055192700000004149757568300309888_);}
.st317{fill:url(#SVGID_00000139293840029055694240000008481301531459098286_);}
.st318{fill:url(#SVGID_00000109021424509181213420000013776183222979758005_);}
.st319{fill:url(#SVGID_00000171686096474814206870000004891481806269053073_);}
.st320{fill:url(#SVGID_00000156555575727090574610000011220812739888149122_);}
.st321{fill:url(#SVGID_00000178899659494401575270000006096668214889401531_);}
.st322{fill:url(#SVGID_00000137852030968431819580000005640258153663550860_);}
.st323{clip-path:url(#SVGID_00000165924844417502794870000007193803550012547255_);}
.st324{clip-path:url(#SVGID_00000152257595066019035710000008129883977800191145_);}
.st325{fill:url(#SVGID_00000103224169322577705250000018282043989684642191_);}
.st326{fill:url(#SVGID_00000093164007627143331530000016181865726989921462_);}
.st327{clip-path:url(#SVGID_00000083802098415560977190000018032953538611857834_);}
.st328{clip-path:url(#SVGID_00000078739797026674540310000010371159023060971167_);}
.st329{fill:url(#SVGID_00000145051003973552541820000008538392107971637899_);}
.st330{fill:url(#SVGID_00000008142590177660883650000001626117353831970214_);}
.st331{fill:url(#SVGID_00000011734583948798291210000000479161646576875153_);}
.st332{clip-path:url(#SVGID_00000127006338140900210300000010185094382982298508_);}
.st333{clip-path:url(#SVGID_00000163046537582096831540000002110069126339152573_);}
.st334{fill:url(#SVGID_00000135677175087378618750000009244904121135908996_);}
.st335{fill:url(#SVGID_00000084504938195804808280000013367762175544401810_);}
.st336{clip-path:url(#SVGID_00000179618355821595100440000016411446286659243961_);}
.st337{clip-path:url(#SVGID_00000153687841669305524550000008283462348945864335_);}
.st338{fill:url(#SVGID_00000150097496741524374330000010221398710809864580_);}
.st339{fill:url(#SVGID_00000147911510260338170900000014508421081795593918_);}
.st340{fill:url(#SVGID_00000100364810869734405820000011737224968328429954_);}
.st341{fill:url(#SVGID_00000143592721952627574680000012293943304554878870_);}
.st342{fill:url(#SVGID_00000089542534896611887490000007749036930866832521_);}
.st343{fill:url(#SVGID_00000043457949267792302780000005243559527954287795_);}
.st344{fill:url(#SVGID_00000079485567721280366860000007974849878009294004_);}
.st345{fill:url(#SVGID_00000169554533346814932260000010964969638550867347_);}
.st346{fill:url(#SVGID_00000032618071622530747340000010457522775708526769_);}
.st347{fill:url(#SVGID_00000042724881590450748730000012074151108474888597_);}
.st348{fill:url(#SVGID_00000073702754044057562940000006943057733591868849_);}
.st349{fill:url(#SVGID_00000127045575657153992610000014889829646393917827_);}
.st350{fill:url(#SVGID_00000159442675303453828950000010886729751366703805_);}
.st351{fill:url(#SVGID_00000157278769501157764450000010400444880316973963_);}
.st352{fill:url(#SVGID_00000040536180287101798930000008517584969678689715_);}
.st353{fill:url(#SVGID_00000026878841114507107360000013519785644979312313_);}
.st354{fill:url(#SVGID_00000031895530278145372040000004242146059839724688_);}
.st355{fill:url(#SVGID_00000090984589469044309910000003430927072769392782_);}
.st356{fill:url(#SVGID_00000127751021471463311230000007325889119217843359_);}
.st357{fill:url(#SVGID_00000160170823349153477380000006573632433721214866_);}
.st358{fill:url(#SVGID_00000086686198468921539220000015244106154100649356_);}
.st359{fill:url(#SVGID_00000008130983244814678090000018322869297872734369_);}
.st360{fill:url(#SVGID_00000038399372548979433780000013656205659223617718_);}
.st361{fill:url(#SVGID_00000128450388186648591920000006870265581186715071_);}
.st362{fill:url(#SVGID_00000045620674412353402660000006322835130402136712_);}
.st363{fill:url(#SVGID_00000165926747877237518620000014573293584003107221_);}
.st364{fill:url(#SVGID_00000052080202362609955450000008496323570551365266_);}
.st365{fill:url(#SVGID_00000075873370392614496290000011401205464894963356_);}
.st366{fill:url(#SVGID_00000066507972836207109020000011242395465372886923_);}
.st367{fill:url(#SVGID_00000051374110510837467070000013982392979786222476_);}
.st368{fill:url(#SVGID_00000112612736409366302200000013769434177552186302_);}
.st369{fill:url(#SVGID_00000019652536143369129520000017203395407711175597_);}
.st370{fill:url(#SVGID_00000169560500013169826340000008176426507319081901_);}
.st371{fill:url(#SVGID_00000111877273100682803900000017890748178113972611_);}
.st372{fill:url(#SVGID_00000170993268007914736340000000788473136210095503_);}
.st373{fill:url(#SVGID_00000111914082762000632290000007526427199271201453_);}
.st374{fill:url(#SVGID_00000126292875764235152510000011324235552051192737_);}
.st375{fill:none;stroke:#FFFFFF;stroke-width:3;stroke-miterlimit:10;stroke-dasharray:8,8;}
.st376{fill:url(#SVGID_00000087412456477181423350000013912909515290831540_);}
.st377{fill:url(#SVGID_00000150785268712575980070000016848408047054061211_);}
.st378{fill:url(#SVGID_00000078757856036988827420000006025244644160612229_);}
.st379{fill:url(#SVGID_00000163785461399962455900000000655882877723742608_);}
.st380{fill:url(#SVGID_00000010287317948643276210000001639203787855117449_);}
.st381{fill:url(#SVGID_00000162346011968326636060000004839830012336161926_);}
.st382{fill:url(#SVGID_00000088816697122745005110000015469732003671863460_);}
.st383{fill:url(#SVGID_00000093879606828941428290000005248482128393632151_);}
.st384{fill:url(#SVGID_00000107564403890692352100000008049226820511031727_);}
.st385{fill:#515151;}
.st386{fill:url(#SVGID_00000154397753767662942670000014733422047870205859_);}
.st387{fill:url(#SVGID_00000134936257803742105300000017050956575612984752_);}
.st388{fill:url(#SVGID_00000154408932096886115630000000332366764113128870_);}
.st389{fill:url(#SVGID_00000097474355113420545130000000161852971315139713_);}
.st390{fill:url(#SVGID_00000032639269013645737000000012837232344920276397_);}
.st391{fill:url(#SVGID_00000044861480884200312420000015139514454718598300_);}
.st392{fill:url(#SVGID_00000048466566058771537300000009064651167859202235_);}
.st393{fill:url(#SVGID_00000065070636328575156890000009589765211655202202_);}
.st394{fill:url(#SVGID_00000112627634727871976760000016533453210311458984_);}
.st395{fill:url(#SVGID_00000069381103297507321700000014366146431772595642_);}
.st396{fill:url(#SVGID_00000034806497121430807060000015491142841660643457_);}
.st397{fill:url(#SVGID_00000044171513370857161180000003334025516981461139_);}
.st398{fill:url(#SVGID_00000054968755226592730800000018163599820733225384_);}
.st399{fill:url(#SVGID_00000061457189436752864410000006069785214983770294_);}
.st400{fill:url(#SVGID_00000155862105055324675010000017174107162898530183_);}
.st401{fill:url(#SVGID_00000130644191266388550150000007512643406507720334_);}
.st402{fill:url(#SVGID_00000169557693046481548470000016082072838769340850_);}
.st403{fill:url(#SVGID_00000141444423886891879940000014175701824138503808_);}
.st404{fill:url(#SVGID_00000042736708621762321310000001831606441561630640_);}
.st405{fill:url(#SVGID_00000051371229108766977920000009102217570400118973_);}
.st406{fill:url(#SVGID_00000034091203405222557430000007559998283424855187_);}
.st407{fill:url(#SVGID_00000124845479808558119010000011363011726928076697_);}
.st408{fill:url(#SVGID_00000027581536790802639480000011869177594912576129_);}
.st409{fill:url(#SVGID_00000081614634009515443890000018433764401592854460_);}
.st410{fill:url(#SVGID_00000036233300780617489320000002946452548467902370_);}
.st411{fill:url(#SVGID_00000171684823637467388910000011829340861192839358_);}
.st412{fill:url(#SVGID_00000116210762823394414640000005293198895166607260_);}
.st413{fill:url(#SVGID_00000013897981182747884080000002591684036976529848_);}
.st414{fill:url(#SVGID_00000094575782804955775040000006546635532824518047_);}
.st415{fill:url(#SVGID_00000120558701312860547730000015466034061901352085_);}
.st416{fill:url(#SVGID_00000048463628036938257270000001993107249440523418_);}
.st417{fill:url(#SVGID_00000052079897129185010030000015285786192749658503_);}
.st418{fill:url(#SVGID_00000140005096228481498250000000067193764401980307_);}
.st419{fill:url(#SVGID_00000169532555215817466690000007069573636628837546_);}
.st420{fill:url(#SVGID_00000055699763826433548690000004502319988500839562_);}
.st421{fill:url(#SVGID_00000054266366047150902590000009234300717399984547_);}
.st422{fill:url(#SVGID_00000034783551861630064780000001261710423514427039_);}
.st423{fill:url(#SVGID_00000165949122235106530710000004557261296395015867_);}
.st424{fill:url(#SVGID_00000098926728988338521190000008635297001276754098_);}
.st425{fill:url(#SVGID_00000044879487076949854340000009009262311250762411_);}
.st426{fill:url(#SVGID_00000149339917676707571320000002891352794280136361_);}
.st427{fill:url(#SVGID_00000049937532011528265410000008916929317319630741_);}
.st428{fill:url(#SVGID_00000058585005586128403830000010803400245755392189_);}
.st429{fill:url(#SVGID_00000180349489887907257590000010298170842010305978_);}
.st430{fill:url(#SVGID_00000075870036051030619480000006016825807401442208_);}
.st431{fill:url(#SVGID_00000161610992063308151120000003605424512747479989_);}
.st432{fill:url(#SVGID_00000151529449922072496780000013909669388855237791_);}
.st433{fill:url(#SVGID_00000181766468811312708320000017176233382022135230_);}
.st434{fill:url(#SVGID_00000140698608383138505340000003214499638828718246_);}
.st435{fill:url(#SVGID_00000168813554315653086690000001453533208818185146_);}
.st436{fill:url(#SVGID_00000153677438630112528460000014945436262602669759_);}
.st437{fill:url(#SVGID_00000026855458220326182790000012810321645239679662_);}
.st438{fill:url(#SVGID_00000178204314720648132400000009692066153809432989_);}
.st439{fill:url(#SVGID_00000060012766822808713000000009718295542413194911_);}
.st440{fill:url(#SVGID_00000139290894765301320450000002724674154633190828_);}
.st441{fill:url(#SVGID_00000121973630460816824570000009548737719545132448_);}
.st442{fill:url(#SVGID_00000001648440968922068640000007064561565643104154_);}
.st443{fill:url(#SVGID_00000013164936184795119330000007634949786625633408_);}
.st444{fill:url(#SVGID_00000150097336233231236910000006601380179974927789_);}
.st445{fill:url(#SVGID_00000023998088764609042710000001888233577261995175_);}
.st446{fill:url(#SVGID_00000097475607463243225230000009570780160745164193_);}
.st447{fill:url(#SVGID_00000160885420300949533450000018169890407948190855_);}
.st448{fill:url(#SVGID_00000060744541579202752100000004813882732221866408_);}
.st449{fill:url(#SVGID_00000091010692180459844900000011022436680797463207_);}
.st450{fill:url(#SVGID_00000054949447733585017540000008309037821132666296_);}
.st451{fill:url(#SVGID_00000130617938591545742740000002200291289464853120_);}
.st452{fill:url(#SVGID_00000155841913881396228910000002606954617688603791_);}
.st453{fill:url(#SVGID_00000129195200184309163340000017155069996466760351_);}
.st454{fill:url(#SVGID_00000076595583389095078970000001579125010558020506_);}
.st455{fill:url(#SVGID_00000060002491564533429480000015169975206264277660_);}
.st456{fill:url(#SVGID_00000090252432451376765680000011966519004239881657_);}
.st457{fill:url(#SVGID_00000010292102856290139020000005476711301624169374_);}
.st458{fill:url(#SVGID_00000047059483396209951520000009246840439958880933_);}
.st459{fill:url(#SVGID_00000016039785765167193980000016178412331278796173_);}
.st460{fill:url(#SVGID_00000158014575087047951520000002824486175598299014_);}
.st461{fill:url(#SVGID_00000150064047900936446930000001428011656182714498_);}
.st462{fill:url(#SVGID_00000020362962075289041020000008524154518223289755_);}
.st463{fill:url(#SVGID_00000014636027444879992740000002565793317838467003_);}
.st464{fill:url(#SVGID_00000072994393653453337750000015393603598617090979_);}
.st465{fill:url(#SVGID_00000018208014968694639270000005318244408508217489_);}
.st466{fill:url(#SVGID_00000045620870882805533600000014954683897142904455_);}
.st467{fill:url(#SVGID_00000094588875679996833860000006031749435644057512_);}
.st468{fill:url(#SVGID_00000113334176485791210990000018021536851432506778_);}
.st469{fill:url(#SVGID_00000145042495338931897160000003467263678296733327_);}
.st470{fill:url(#SVGID_00000111883050117186881120000005784321148526629288_);}
.st471{fill:url(#SVGID_00000097481725358418709350000001456737504754164400_);}
.st472{fill:url(#SVGID_00000034779537854235103360000003301269161189437314_);}
.st473{fill:url(#SVGID_00000098179102959919516480000003917971444057339548_);}
.st474{fill:url(#SVGID_00000106861973412177606060000005823269193598194059_);}
.st475{fill:url(#SVGID_00000041267988899203669700000003477859112042628005_);}
.st476{fill:url(#SVGID_00000101104400680008695370000005889802115501458340_);}
.st477{fill:url(#SVGID_00000107587457191462769060000016657341655015295633_);}
.st478{fill:url(#SVGID_00000044863920276556082290000010200375334662467494_);}
.st479{fill:url(#SVGID_00000049189301612138991300000009270693027831535747_);}
.st480{fill:url(#SVGID_00000001640757765826885170000004071794678310000061_);}
.st481{fill:url(#SVGID_00000004524677459320616460000016404116589977110453_);}
.st482{fill:url(#SVGID_00000093178489390580677940000012370649982081119144_);}
.st483{fill:url(#SVGID_00000145035118178746407490000017697614527263381906_);}
.st484{fill:url(#SVGID_00000051348462317641346180000008840759654037681289_);}
.st485{fill:url(#SVGID_00000149364377278608023220000001701277962105977229_);}
.st486{fill:url(#SVGID_00000052791352361466008290000008200556219967094175_);}
.st487{fill:url(#SVGID_00000145040314027351092370000015625645154463484314_);}
.st488{fill:url(#SVGID_00000013880994617664105470000012462666255359017388_);}
.st489{fill:url(#SVGID_00000091721938097968991710000014492015605926625455_);}
.st490{fill:url(#SVGID_00000076570548703529373600000013639271129201058448_);}
.st491{fill:url(#SVGID_00000019667773741926084500000009544231608251178637_);}
.st492{fill:url(#SVGID_00000170245507136532206310000016763259443744336317_);}
.st493{fill:url(#SVGID_00000125597678946068403230000006592994668413112995_);}
.st494{fill:url(#SVGID_00000062884965775231440010000013610236175958601648_);}
.st495{fill:url(#SVGID_00000026122668690494630230000012359156790419658895_);}
.st496{fill:#FFE200;}
.st497{font-family:'PingFangSC-Regular-GBpc-EUC-H';}
.st498{font-size:19.9006px;}
.st499{opacity:0.8;}
.st500{fill:#283445;}
.st501{fill:#212D3C;}
.st502{fill:none;}
.st503{fill:#E6A23D;}
.st504{fill:#41F0FF;}
.st505{font-size:11.9404px;}
.st506{font-family:'Helvetica';}
.st507{font-family:'PingFangHK-Semibold-B5pc-H';}
.st508{font-size:13.9304px;}
.st509{fill:#28C840;}
.st510{fill:#0071BC;}
</style>
