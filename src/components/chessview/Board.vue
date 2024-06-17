<script setup lang="ts">
import {ref, watch} from "vue";
import Pawn from "@/components/chessview/Pawn.vue";
import {logValInfo} from "@/assets/LogUtil"
import {ElMessage} from "element-plus";

// 棋盘
const board = ref<HTMLElement | Element>();
//象 狮 虎 豹 狼 狗 猫 鼠
//7  6 5  4 3 2  1  0
const other = [15, 9, 13, 19, 17, 7, 1, 21];
const self = [49, 55, 51, 45, 47, 57, 63, 43];
const den = [4, 60];    //兽穴
const river = [23, 24, 26, 27, 30, 31, 33, 34, 37, 38, 40, 41];   //河流
const canJumpPos1 = [16, 17, 19, 20];   //可以越河的位置
const canJumpPos2 = [44, 45, 47, 48];   //可以越河的位置
const chessPos = ref() //所有格子
const isSelect = ref<boolean>(false)
const selectedChess = ref<HTMLElement>();
const endPos = ref();
const startP = ref<number>(-1);
const endP = ref<number>(-1);
const isMyTurn = ref<boolean>(false);
const trap = ref<Array<number>>([3, 5, 11, 53, 59, 61]);
const trapOther = ref<Array<number>>([3, 5, 11]);
const trapSelf = ref<Array<number>>([53, 59, 61]);
const trigger = ref<Array<number>>([])

watch(trigger, (nv, ov) => {
  console.log(nv)
  for (let i = 0; i < nv.length; i++) {
    chessPos.value[nv[i] - 1]?.style.setProperty("--bg", 'url("src/assets/pawn_img/trap_trigger.svg")');
    console.log("该陷阱已触发")
  }
}, {
  deep: true,
});

// TODO 根据数据渲染对方棋子


// 渲染棋子
function isChess(n: number): boolean {
  return self.includes(n) || other.includes(n);
}

// 生成棋子
function getPawnClassName(n: number): string {
  let res: string = "pawn"
  if (self.includes(n)) {
    res += self.indexOf(n);
  }

  if (other.includes(n)) {
    res += other.indexOf(n);
  }

  return res;
}

//选择棋子
function startSelect(n: number) {
  console.log("start select")
  console.log(n)

  let target: HTMLElement | Element = chessPos.value[n - 1];
  let chess: any = target.childNodes[0];

  logValInfo("格子：", target.childNodes);
  //如果位置存在棋子
  if (target.childNodes.length != 0 && chess.style && !isSelect.value) {
    console.log("选择目标棋子")
    //记录初始位置
    startP.value = n;
    selectChess(chess)
  } else {
    if (n == startP.value) {
      cancelSelected();
      console.log("取消落点")
      return;
    }
    // 选择落点
    if (isSelect.value) {
      console.log("选择落点")
      if (endPos.value != undefined)
        endPos.value.style.setProperty("--s", "hidden");

      endP.value = n
      endPos.value = target;

      endPos.value.style.setProperty("--s", "visible")

      updatePos();
    }
  }

  console.log("end select")
}

function selectChess(chess: HTMLElement) {

  const isShow = chess.style.getPropertyValue("--show");
  //选中
  if (isShow == "hidden") {
    cancelSelected()
    chess.style.setProperty("--show", "visible")
    selectedChess.value = chess;

    isSelect.value = true;
    if (endPos.value != undefined)
      endPos.value.style.setProperty("--s", "hidden");
  } else if (isShow == "visible") {
    cancelSelected();
  }
}

//取消选择目标棋子
function cancelSelected(): void {
  let self = document.querySelectorAll(".self");
  self.forEach((e: HTMLElement) => {
    e.style.setProperty("--show", "hidden")
  })

  let other = document.querySelectorAll(".other");
  other.forEach((e: HTMLElement) => {
    e.style.setProperty("--show", "hidden")
  })

  initState();
}

// 己方的棋子
function isSelf(n: number) {
  return self.includes(n)
}

//改变棋子位置
function updatePos(): void {
  console.log("updatePos start");

  if (!moveCorrectly(selectedChess.value)) {
    console.log("落点不符合规则")
    msgNotice("落点不符合规则")
    cancelSelected();
    return;
  }

  // 吃掉对方
  if (!eatOpponent()) {
    cancelSelected();
    return;
  }

  console.log("吃的掉对方")
  endPos.value.insertBefore(selectedChess.value, endPos.value.firstChild);

  if (isSuccess()) {
    console.log("win")
    setTimeout(() => {
      location.reload()
    }, 1500)
  }

  cancelSelected();
  console.log("结束落点")
  isMyTurn.value = !isMyTurn.value;
}

// 陷阱判断
function trapTrigger(targetChess: HTMLElement): boolean {

  let endPos = endP.value;
  if (targetChess.classList.contains("self")) {
    let isTrapped = trapOther.value.includes(endPos);
    if (isTrapped) {
      trigger.value = trap.value.filter(item => item == endPos);
      trapOther.value[trapOther.value.indexOf(endPos)] = -1;
    }
    return isTrapped;
  } else if (targetChess.classList.contains("other")) {
    let isTrapped = trapOther.value.includes(endPos);
    if (isTrapped) {
      trigger.value = trap.value.filter(item => item == endPos);
      trapSelf.value[trapSelf.value.indexOf(endPos)] = -1;
    }

    return isTrapped
  }

  return false;
}

// 吃掉对方
function eatOpponent(): boolean {
  console.log("eat start")
  // 3、5、11、53、59、61

  let self = chessPos.value[startP.value - 1].firstChild;
  let opponent = chessPos.value[endP.value - 1].firstChild;

  //判断落点是否有棋子
  if (opponent == null || !opponent.style)
    return true;
  //在判断是否是自己人
  if (checkIsSelf(opponent)) {
    console.log("不能吃掉己方的棋子")
    msgNotice("不能吃掉己方的棋子");
    return false;
  }

  let canEat: boolean = compareRank(self, opponent);
  if (canEat) {
    opponent?.remove();
  }

  return canEat;
}

// 移动一格的逻辑
function moveCorrectly(ele: HTMLElement): boolean {
  console.log("start: " + startP.value)
  console.log("end: " + endP.value)

  if (ele.classList.contains("other") && endP.value == 4
      || ele.classList.contains("self") && endP.value == 60) {
    return false;
  }

  //落入陷阱的不能在动了
  if (ele.classList.contains("self") && trapOther.value.includes(startP.value)
      || ele.classList.contains("other") && trapSelf.value.includes(startP.value)){
    msgNotice("该棋子落进陷阱当中，不能移动")
    return false;
  }

  //23, 24, 26, 27, 30, 31, 33, 34, 37, 38, 40, 41
  if (!ele.classList.contains("pawn0") && river.includes(endP.value))
    return false;

  let move = endP.value - startP.value;
  //判断是否能过河
  if (canJumpOverRiver(ele)) {
    return jumpOverRiver(move);
  }

  return move == 1 || move == -1 || move == 7 || move == -7;
}

// TODO 显示可移动的地方

// TODO 添加轮次操作

// TODO 添加落点判断

// TODO 根据WS传回数据更新对方的棋子信息

// 获胜
function isSuccess(): boolean {
  let other = document.querySelectorAll(".other");
  if (other.length == 0) {
    console.log("self win")
    msgNotice("Congrats!!! BLUE WIN")
    return true;
  }

  let self = document.querySelectorAll(".self");
  if (other.length == 0) {
    console.log("other win")
    msgNotice("Congrats!!! RED WIN")
    return true;
  }

  return den.includes(endP.value);
}

function msgNotice(info: string): void {
  ElMessage.success(info);
}

// 过河
function canJumpOverRiver(ele: HTMLElement): boolean {
  return ele.classList.contains("pawn5") || ele.classList.contains("pawn6");
}

// 判断是否有老鼠在河道上挡住路线
function checkIsRatBlocked(startPos: number, endPos: number): number {
  console.log("checkIsRatBlocked")
  let min = Math.min(startPos, endPos);
  let max = Math.max(startPos, endPos);
  let i = min + 7
  for (; i < max; i += 7) {
    if (chessPos.value[i - 1].childNodes[0]?.classList != undefined) {
      console.log("不可以越河")
      min = i
      break
    }
  }
  let res = max - min;
  return res == 28 ? 28 : 1;
}

// 开始越河
function jumpOverRiver(direction: number) {
  console.log("越河")
  let startPos = startP.value;
  if (canJumpPos1.includes(startPos)) {
    return direction == checkIsRatBlocked(startPos, endP.value) || direction == 1 || direction == -1 || direction == -7;
  } else if (canJumpPos2.includes(startPos)) {
    return direction == -checkIsRatBlocked(startPos, endP.value) || direction == 1 || direction == -1 || direction == 7;
  } else {
    return direction == 1 || direction == -1 || direction == 7 || direction == -7;
  }
}

// 获取等级 比较谁能吃谁
function compareRank(self: HTMLElement, opponent: HTMLElement | null): boolean {
  console.log("判断是否能吃掉对方")

  let selfR: string = self.classList[1].charAt(4);
  let opponentR: string = opponent?.classList[1].charAt(4);
  let canEat = ((selfR >= opponentR || Number(selfR) - Number(opponentR) == -7)
      && Number(selfR) - Number(opponentR) != 7);

  let isTrapped = trapTrigger(opponent);
  logValInfo("是否在陷阱中", isTrapped)

  return canEat || isTrapped;
}

//判断待吃的棋子是否是己方的棋子
function checkIsSelf(ele: HTMLElement): boolean {
  if (!ele?.style)
    return false;
  return ele.classList.contains("self") && selectedChess.value?.classList.contains("self")
      || ele.classList.contains("other") && selectedChess.value?.classList.contains("other");
}

function log() {
  console.log("----- cur info -----")
  console.log("selectedChess")
  console.log(selectedChess.value)
  console.log("endPos")
  console.log(endPos.value)
  console.log(isSelect.value)
  console.log("start pos " + startP.value)
  console.log("end pos " + endP.value)
  console.log("----- cur info -----")
}

//初始化状态
function initState(): void {
  isSelect.value = false;
  selectedChess.value = undefined;

  if (endPos.value != undefined) {
    endPos.value.style.setProperty("--s", "hidden");
  }
  endPos.value = undefined;
}
</script>

<template>
  <div class="container">
    <div class="board" ref="board">
      <div v-for="n in 63" :key="n" class="chessPos" ref="chessPos" @click="startSelect(n)">
        <Pawn v-if="isChess(n)" :key="n" :class="{ [getPawnClassName(n)] : true,
       self:isSelf(n),other:!isSelf(n)}"></Pawn>
      </div>
    </div>
    <div class="options">

    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  box-sizing: border-box;
}

.board {
  height: calc(100vmin - 3rem);
  width: auto;
  aspect-ratio: 7 / 9;
  margin: 1rem auto;
  box-sizing: border-box;
  box-shadow: rgba(0, 0, 0, 0.16) 0 3px 6px, rgba(0, 0, 0, 0.23) 0 3px 6px;
  display: grid;
  /* 创建 9列 */
  grid-template-rows: repeat(9, 1fr);
  /* 创建 7行 */
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 0.8px;
  padding: 2px 2px;
}

.chessPos {
  --s: hidden;
  position: relative;
  background: rgba(252, 252, 252);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chessPos::before {
  content: '';
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 130%;
  height: 130%;
  box-sizing: border-box;
  background: url("src/assets/pawn_img/done.svg");
  background-size: cover;
  visibility: var(--s);
}


.chessPos:nth-child(odd) {
  background: #CCFFCC;
}

.chessPos:nth-child(even) {
  background: #99FFCC;
}

/* 兽穴 */
.chessPos:nth-child(60) {
  background: url("src/assets/pawn_img/flag_new.svg") no-repeat center;
  background-size: cover;
}

.chessPos:nth-child(4) {
  background: url("src/assets/pawn_img/flag.svg") no-repeat center;
  background-size: cover;
}

/* 陷阱 */
.chessPos:nth-child(3),
.chessPos:nth-child(5),
.chessPos:nth-child(11),
.chessPos:nth-child(53),
.chessPos:nth-child(59),
.chessPos:nth-child(61) {
  --bg: url("src/assets/pawn_img/trap.svg");
  background: var(--bg);
  background-size: cover;
  margin: 1px 1px;
}

.self {
  border: 2px solid rgb(0, 153, 255);
}

.other {
  border: 2px solid #FF3366;
}

/* 河流 */
.chessPos:nth-child(23),
.chessPos:nth-child(24),
.chessPos:nth-child(26),
.chessPos:nth-child(27),
.chessPos:nth-child(30),
.chessPos:nth-child(31),
.chessPos:nth-child(33),
.chessPos:nth-child(34),
.chessPos:nth-child(37),
.chessPos:nth-child(38),
.chessPos:nth-child(40),
.chessPos:nth-child(41) {
  background: #33CCFF;
}

/** 媒体检查 确保比例正确 */
@media (max-width: 480px) {
  .board {
    margin: 1rem auto;
    width: calc(100vmin - 3rem);
    height: auto;
    aspect-ratio: 7 / 9;
    box-sizing: border-box;
    box-shadow: rgba(0, 0, 0, 0.16) 0 3px 6px, rgba(0, 0, 0, 0.23) 0 3px 6px;
    display: grid;
    /* 创建 9列 */
    grid-template-rows: repeat(9, 1fr);
    /* 创建 7行 */
    grid-template-columns: repeat(7, 1fr);
    grid-gap: 1px;
    padding: 2px 2px;
  }
}
</style>