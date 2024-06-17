<script setup lang="ts">

import {inject, ref} from "vue";

const isSelected = ref<"visible" | "hidden">("hidden");
const pawn = ref<HTMLElement | Element>()

</script>

<template>
  <div class="pawn" ref="pawn" :style="{'--show':isSelected}">
  </div>
</template>

<style scoped>
.pawn {
  --show: hidden;
  position: relative;
  width: 85%;
  height: 85%;
  background: #bbbbbb;
  background-position: center;
  background-size: cover;
  box-sizing: border-box;
  border-radius: 50%;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: rgba(0, 0, 0, 0.24) 0 3px 8px;
}

.pawn::after {
  content: '';
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 210%;
  height: 210%;
  box-sizing: border-box;
  background: url("src/assets/pawn_img/choose.svg");
  background-size: cover;
  visibility: var(--show);
}

/**
老鼠
 */
.pawn0 {
  background: #bbbbbb url("src/assets/pawn_img/rat.svg") center;
  background-size: cover;
}

.pawn1 {
  background: #bbbbbb url("src/assets/pawn_img/cat.svg") center;
  background-size: cover;
}

.pawn2 {
  background: #bbbbbb url("src/assets/pawn_img/dog.svg") center;
  background-size: cover;
}

.pawn3 {
  background: #bbbbbb url("src/assets/pawn_img/wolf.svg") center;
  background-size: cover;
}

.pawn4 {
  background: #bbbbbb url("src/assets/pawn_img/leopard.svg") center;
  background-size: cover;
}

.pawn5 {
  background: #bbbbbb url("src/assets/pawn_img/tiger.svg") center;
  background-size: cover;
}

.pawn6 {
  background: #bbbbbb url("src/assets/pawn_img/lion.svg") center;
  background-size: cover;
}

.pawn7 {
  background: #bbbbbb url("src/assets/pawn_img/elephant.svg") center;
  background-size: cover;
}
</style>