<!-- Font Awesome CDN -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" integrity="sha512-rvA8MXH6YzWhgGu2+RINyNsJLXTrgbDUNZwSHdBdBDX8jVJzGUHPwEYc3Qyxydm7i0IH33RZjDPn7R1XD2ojIQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />

<template>
  <div class="app">
    <div class="form-container">
      <h1 class="title"><i class="fas fa-paint-brush"></i> Генератор Рангов</h1>

      <div class="row">
        <input v-model="text" placeholder="Введите текст ранга..." class="input dark-input" />

        <select v-model="selectedFont" class="dark-select">
          <option v-for="font in fontOptions" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </div>

      <div class="row">
        <label class="labeled-input">
          <i class="fas fa-text-height"></i>
          Размер шрифта:
          <input v-model.number="fontSize" type="number" min="8" max="256" class="dark-input mini" />
        </label>

        <label class="labeled-input">
          <i class="fas fa-ruler-horizontal"></i>
          Высота:
          <input v-model.number="imageHeight" type="number" min="1" class="dark-input mini" />
        </label>
      </div>

      <canvas ref="canvas" class="preview-canvas"></canvas>
      <img :src="imageSrc" alt="Предпросмотр" class="preview-img"
        :style="{ backgroundColor: bgColor, borderColor: borderColor }" />

      <div class="color-pickers">
        <div class="color-group">
          <label><i class="fas fa-fill-drip"></i> Фон:</label>
          <input type="color" v-model="bgColor" class="color-picker" />
          <input type="text" v-model="bgColor" class="dark-input mini" />
        </div>
        <div class="color-group">
          <label><i class="fas fa-border-style"></i> Рамка:</label>
          <input type="color" v-model="borderColor" class="color-picker" />
          <input type="text" v-model="borderColor" class="dark-input mini" />
          <label><input type="checkbox" v-model="showBorder" /> Показать</label>
        </div>
        <div class="color-group">
          <label><i class="fas fa-cloud-showers-heavy"></i> Тень:</label>
          <input type="color" v-model="shadowColor" class="color-picker" />
          <input type="text" v-model="shadowColor" class="dark-input mini" />
          <label><input type="checkbox" v-model="showShadow" /> Показать</label>
        </div>
      </div>

      <div class="preset-section">
        <label><i class="fas fa-palette"></i> Пресеты:</label>
        <select v-model="selectedPreset" @change="applyPreset" class="dark-select" size="6">
          <option disabled value="">Выберите...</option>
          <option v-for="(_, name) in presets" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>

      <button @click="downloadImage" class="dark-button">
        <i class="fas fa-download"></i> Скачать
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const text = ref('Rank')
const canvas = ref(null)
const imageSrc = ref('')
const fontSize = ref(48)
const imageHeight = ref(128)

const bgColor = ref('#282828')
const borderColor = ref('#a0a0a0')
const shadowColor = ref('#505050')

const selectedPreset = ref('')
const showBorder = ref(true)
const showShadow = ref(true)

const fontOptions = [
  { label: 'Minecraft Title Cyrillic', value: 'MinecraftTitleCyrillic' },
  { label: 'Minecraft Rus', value: 'MinecraftRus'},
  { label: 'Pixy Regular', value: 'Pixy' },
  { label: 'Roboto Italic', value: 'Roboto' }
]
const selectedFont = ref('MinecraftTitleCyrillic')

const saturation = 0.08

const presets = {
  "Чёрный":        { bg: '#2A2A2A', border: '#000000' },
  "Тёмно-синий":   { bg: '#00002A', border: '#0000AA' },
  "Тёмно-зелёный": { bg: '#002A00', border: '#00AA00' },
  "Тёмно-бирюзовый": { bg: '#002A2A', border: '#00AAAA' },
  "Тёмно-красный": { bg: '#2A0000', border: '#AA0000' },
  "Тёмно-пурпурный": { bg: '#2A002A', border: '#AA00AA' },
  "Золотой":       { bg: '#2A2A00', border: '#FFAA00' },
  "Серый":         { bg: '#2A2A2A', border: '#AAAAAA' },
  "Тёмно-серый":   { bg: '#151515', border: '#555555' },
  "Синий":         { bg: '#15153F', border: '#5555FF' },
  "Зелёный":       { bg: '#153F15', border: '#55FF55' },
  "Бирюзовый":     { bg: '#153F3F', border: '#55FFFF' },
  "Красный":       { bg: '#3F1515', border: '#FF5555' },
  "Светло-пурпурный": { bg: '#3F153F', border: '#FF55FF' },
  "Жёлтый":        { bg: '#3F3F15', border: '#FFFF55' },
  "Белый":         { bg: '#3F3F3F', border: '#FFFFFF' },
}

for (const name in presets) {
  const preset = presets[name];
  preset.shadow = adjustHSL(preset.bg, saturation);
}

const applyPreset = () => {
  const preset = presets[selectedPreset.value]
  if (preset) {
    bgColor.value = preset.bg
    borderColor.value = preset.border
    shadowColor.value = preset.shadow
  }
}

function adjustHSL(colorHex, lightnessAdjustment) {
  const r = parseInt(colorHex.slice(1, 3), 16) / 255
  const g = parseInt(colorHex.slice(3, 5), 16) / 255
  const b = parseInt(colorHex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min)

  const h = (() => {
    if (max === min) return 0
    if (max === r) return ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6
    if (max === g) return ((b - r) / (max - min) + 2) / 6
    return ((r - g) / (max - min) + 4) / 6
  })()

  const adjustedL = Math.min(Math.max(l + lightnessAdjustment, 0), 1)
  const q = adjustedL < 0.5 ? adjustedL * (1 + s) : adjustedL + s - adjustedL * s
  const p = 2 * adjustedL - q

  const toRGB = t => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const newR = Math.round(toRGB(h + 1 / 3) * 255)
  const newG = Math.round(toRGB(h) * 255)
  const newB = Math.round(toRGB(h - 1 / 3) * 255)

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

function draw() {
  const ctx = canvas.value.getContext('2d')
  ctx.imageSmoothingEnabled = false

  ctx.font = `${fontSize.value}px ${selectedFont.value}`
  const textMetrics = ctx.measureText(text.value)
  const textWidth = Math.ceil(textMetrics.width)

  const finalWidth = textWidth + 40
  const finalHeight = imageHeight.value || fontSize.value + 60

  canvas.value.width = finalWidth
  canvas.value.height = finalHeight

  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, finalWidth, finalHeight)

  if (showBorder.value) {
    ctx.strokeStyle = borderColor.value
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, finalWidth, finalHeight)
  }

  ctx.font = `${fontSize.value}px ${selectedFont.value}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const centerX = finalWidth / 2
  const centerY = finalHeight / 2 + 4

  if (showShadow.value) {
    ctx.fillStyle = shadowColor.value
    ctx.fillText(text.value, centerX + 2, centerY + 2)
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillText(text.value, centerX, centerY)

  imageSrc.value = canvas.value.toDataURL()
}

function downloadImage() {
  const link = document.createElement('a')
  link.href = imageSrc.value
  link.download = `${text.value || 'rank'}.png`
  link.click()
}

watch([text, bgColor, borderColor, shadowColor, showBorder, showShadow, selectedFont, fontSize, imageHeight], draw)
onMounted(() => {
  draw()
})
</script>


<style>
@font-face {
  font-family: 'MinecraftTitleCyrillic';
  src: url('/fonts/minecraft_title_cyrillic.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'MinecraftRus';
  src: url('/fonts/minecraft.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Pixy';
  src: url('/fonts/Pixy.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Roboto';
  src: url('/fonts/Roboto-Italic.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

body {
  margin: 0;
  font-family: sans-serif;
  background: #1a1a1a;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  overflow: hidden;
  height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  background: #1a1a1a;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  background: #2a2a2a;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  border: 1px solid #4a4a4a;
  max-width: 800px;
  width: 100%;
}

.title {
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.input {
  padding: 0.25rem;
  font-size: 1rem;
  width: 200px;
}

.input.dark-input {
  padding: 0.5rem;
  font-size: 1.2rem;
  width: 250px;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  background: #1e1e2e;
  color: #e0e0ff;
}

.input.dark-input::placeholder {
  color: #a0a0c0;
}

.color-picker {
  margin-left: 0.5rem;
  border: none;
  background: #1e1e2e;
  border-radius: 4px;
  padding: 0.2rem;
  width: 40px;
  height: 40px;
}

.dark-select {
  padding: 0.4rem;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  background: #1e1e2e;
  color: #e0e0ff;
}

.dark-button {
  padding: 0.6rem 1.2rem;
  background: #3a3a5a;
  border: 1px solid #5a5a8a;
  color: #e0e0ff;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.dark-button:hover {
  background: #4a4a7a;
}

.labeled-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mini {
  width: 100px;
}

.preview-canvas {
  display: none;
}

.preview-img {
  image-rendering: pixelated;
  width: auto;
  height: 128px;
  border-radius: 6px;
  border: 2px solid transparent;
}

.color-pickers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  width: 100%;
}

.color-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  background: #1f1f2a;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #444;
}

.color-group label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
}

.preset-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.preset-section label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fa {
  color: #aaa;
}
</style>

