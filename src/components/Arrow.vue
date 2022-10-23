<script lang="ts" setup>
import {defineProps} from 'vue'
defineProps({
  msg: String
})
</script>
<template>
  <div class="info">
    <div class="w-30 h-6 bg-black text-center absolute ml-2 -mt-3">
      <text class="text-white">{{msg ? msg : 'error'}}</text>
    </div>
  </div>

</template>

<style>
.arrow{
  position: relative;
  width: 0;
  height: 0;
  border: 10px solid transparent;
  border-right: 10px solid black;
}

</style>
