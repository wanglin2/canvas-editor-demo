<template>
  <div class="container">
    <div class="editorContainer" ref="editorContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CanvasEditor from '../canvas-editor/'
import data from './mock'

const editorContainer = ref(null)
onMounted(() => {
  new CanvasEditor(editorContainer.value, data)
})
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
  padding: 50px;
  display: flex;
  justify-content: center;
}

.editorContainer {
  display: flex;
  flex-direction: column;
  height: max-content;
  position: relative;
}
</style>
