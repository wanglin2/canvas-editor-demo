<template>
  <div class="container">
    <div class="toolbar">
      <el-select
        v-model="fontFamily"
        size="small"
        style="width: 100px; margin-right: 6px"
        @change="exec('fontFamily')"
      >
        <el-option
          v-for="item in fontFamilyList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <div class="btn sizeAdd" @click="exec('sizeAdd')">
        <i></i>
      </div>
      <div class="btn sizeMinus" @click="exec('sizeMinus')">
        <i></i>
      </div>
      <div class="btn bold" :class="{ active: isBold }" @click="exec('bold')">
        <i></i>
      </div>
      <div
        class="btn italic"
        :class="{ active: isItalic }"
        @click="exec('italic')"
      >
        <i></i>
      </div>
      <div
        class="btn underline"
        :class="{ active: isUnderline }"
        @click="exec('underline')"
      >
        <i></i>
      </div>
      <div
        class="btn linethrough"
        :class="{ active: isLinethrough }"
        @click="exec('linethrough')"
      >
        <i></i>
      </div>
      <el-color-picker
        v-model="color"
        show-alpha
        :predefine="predefineColors"
        size="small"
        @change="exec('color')"
      />
      <el-color-picker
        v-model="background"
        show-alpha
        :predefine="predefineColors"
        size="small"
        @change="exec('background')"
      />
      <el-select
        v-model="lineHeight"
        size="small"
        style="width: 100px; margin-right: 6px"
        @change="exec('lineHeight')"
      >
        <el-option
          v-for="item in lineHeightList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div class="editorContainer" ref="editorContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CanvasEditor from '../canvas-editor/'
import data from './mock'

const editorContainer = ref(null)
let editor = null
onMounted(() => {
  editor = new CanvasEditor(editorContainer.value, data)
  editor.listeners.mousedown = positionIndex => {
    checkStyle(editor.data[positionIndex])
  }
  editor.listeners.rangeChange = range => {
    if (range.length > 0) {
      let { color: defaultColor, fontFamily: defaultFontFamily } =
        editor.options
      let first = editor.data[range[0]]
      fontFamily.value = first.fontfamily || defaultFontFamily
      color.value = first.color || defaultColor
      background.value = first.background || ''
      let isAllBold = true
      let isAllItalic = true
      let isAllUnderline = true
      let isAllLinethrough = true
      for (let i = range[0]; i <= range[1]; i++) {
        let cur = editor.data[i]
        if (!cur.bold) {
          isAllBold = false
        }
        if (!cur.italic) {
          isAllItalic = false
        }
        if (!cur.underline) {
          isAllUnderline = false
        }
        if (!cur.linethrough) {
          isAllLinethrough = false
        }
      }
      isBold.value = isAllBold
      isItalic.value = isAllItalic
      isUnderline.value = isAllUnderline
      isLinethrough.value = isAllLinethrough
    }
  }
})

const checkStyle = item => {
  let { color: defaultColor, fontFamily: defaultFontFamily, lineHeight: defaultLineHeight } = editor.options
  fontFamily.value = item.fontfamily || defaultFontFamily
  isBold.value = !!item.bold
  isItalic.value = !!item.italic
  isUnderline.value = !!item.underline
  isLinethrough.value = !!item.linethrough
  color.value = item.color || defaultColor
  background.value = item.background || ''
  lineHeight.value = item.lineheight || defaultLineHeight
}

const fontFamilyList = [
  {
    label: '微软雅黑',
    value: 'Yahei'
  },
  {
    label: '宋体',
    value: '宋体'
  },
  {
    label: '黑体',
    value: '黑体'
  },
  {
    label: '仿宋',
    value: '仿宋'
  },
  {
    label: '楷体',
    value: '楷体'
  },
  {
    label: '华文琥珀',
    value: '华文琥珀'
  },
  {
    label: '华文楷体',
    value: '华文楷体'
  },
  {
    label: '华文隶书',
    value: '华文隶书'
  },
  {
    label: '华文新魏',
    value: '华文新魏'
  },
  {
    label: '华文行楷',
    value: '华文行楷'
  },
  {
    label: '华文中宋',
    value: '华文中宋'
  },
  {
    label: '华文彩云',
    value: '华文彩云'
  },
  {
    label: 'Arial',
    value: 'Arial'
  },
  {
    label: 'Segoe UI',
    value: 'Segoe UI'
  },
  {
    label: 'Ink Free',
    value: 'Ink Free'
  },
  {
    label: 'Fantasy',
    value: 'Fantasy'
  }
]

const lineHeightList = [
  {
    label: '1',
    value: 1
  },
  {
    label: '1.25',
    value: 1.25
  },
  {
    label: '1.5',
    value: 1.5
  },
  {
    label: '1.75',
    value: 1.75
  },
  {
    label: '2',
    value: 2
  },
  {
    label: '2.5',
    value: 2.5
  },
  {
    label: '3',
    value: 3
  }
]

const predefineColors = ref([
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  'rgba(255, 69, 0, 0.68)',
  'rgb(255, 120, 0)',
  'hsv(51, 100, 98)',
  'hsva(120, 40, 94, 0.5)',
  'hsl(181, 100%, 37%)',
  'hsla(209, 100%, 56%, 0.73)',
  '#c7158577'
])

const fontFamily = ref('Yahei')
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const isLinethrough = ref(false)
const color = ref('')
const background = ref('')
const lineHeight = ref(1.5)

const exec = command => {
  let range = editor.getRange()
  if (range.length > 0) {
    if (command === 'bold') {
      isBold.value = !isBold.value
    } else if (command === 'italic') {
      isItalic.value = !isItalic.value
    } else if (command === 'underline') {
      isUnderline.value = !isUnderline.value
    } else if (command === 'linethrough') {
      isLinethrough.value = !isLinethrough.value
    }
    for (let i = range[0]; i <= range[1]; i++) {
      let cur = editor.data[i]
      switch (command) {
        case 'fontFamily':
          cur.fontfamily = fontFamily.value
          break
        case 'sizeAdd':
          cur.size = (cur.size || editor.options.fontSize) + 1
          break
        case 'sizeMinus':
          cur.size = (cur.size || editor.options.fontSize) - 1
          break
        case 'bold':
          cur.bold = isBold.value
          break
        case 'italic':
          cur.italic = isItalic.value
          break
        case 'underline':
          cur.underline = isUnderline.value
          break
        case 'linethrough':
          cur.linethrough = isLinethrough.value
          break
        case 'color':
          cur.color = color.value
          break
        case 'background':
          cur.background = background.value
          break
        case 'lineHeight':
          cur.lineheight = lineHeight.value
          break
        default:
          break
      }
    }
  }
  editor.render()
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
<style scoped>
.container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #f2f4f7;
  overflow-y: auto;
  padding: 60px;
  display: flex;
  justify-content: center;
}

.editorContainer {
  display: flex;
  flex-direction: column;
  height: max-content;
  position: relative;
}

.toolbar {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f2f4f7;
  z-index: 999;
}

.toolbar .btn {
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 3px;
}

.toolbar .btn:hover,
.toolbar .btn.active {
  background: rgba(25, 55, 88, 0.04);
}

.toolbar .btn i {
  width: 16px;
  height: 16px;
  display: inline-block;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.sizeAdd i {
  background-image: url('./assets/image/size-add.svg');
}

.sizeMinus i {
  background-image: url('./assets/image/size-minus.svg');
}

.bold i {
  background-image: url('./assets/image/bold.svg');
}

.italic i {
  background-image: url('./assets/image/italic.svg');
}

.underline i {
  background-image: url('./assets/image/underline.svg');
}

.linethrough i {
  background-image: url('./assets/image/strikeout.svg');
}
</style>
