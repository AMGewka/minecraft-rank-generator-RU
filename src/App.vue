<template>
  <div class="app">
    <div class="form-container">
      <input v-model="text" placeholder="Введите текст ранга..." class="input dark-input" />

      <canvas ref="canvas" class="preview-canvas"></canvas>
      <img :src="imageSrc" alt="Предпросмотр" class="preview-img"
        :style="{ backgroundColor: bgColor, borderColor: borderColor }" />
      <div class="color-pickers">
        <label>
          Фон:
          <input type="color" v-model="bgColor" class="color-picker" />
        </label>
        <label>
          Рамка:
          <input type="color" v-model="borderColor" class="color-picker" />
          <input type="checkbox" v-model="showBorder" checked />
        </label>
        <label>
          Тень:
          <input type="color" v-model="shadowColor" class="color-picker" />
          <input type="checkbox" v-model="showShadow" checked />
        </label>
        <label>
          <select v-model="selectedPreset" @change="applyPreset" class="dark-select" size="10">
            <option disabled value="">Выберите пресет</option>
            <option v-for="(_, name) in presets" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
      </div>
      <button @click="downloadImage" class="dark-button">Скачать</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const text = ref('Rank')
const canvas = ref(null)
const imageSrc = ref('')

const bgColor = ref('#282828')
const borderColor = ref('#a0a0a0')
const shadowColor = ref('#505050')

const selectedPreset = ref('')
const showBorder = ref(true)
const showShadow = ref(true)

const saturation = 0.08

const presets = {
  // === Классические цвета ===
  Чёрный:        { bg: '#2A2A2A', border: '#000000' }, // §0
  "Тёмно-синий":   { bg: '#00002A', border: '#0000AA' }, // §1
  "Тёмно-зелёный": { bg: '#002A00', border: '#00AA00' }, // §2
  "Тёмно-бирюзовый": { bg: '#002A2A', border: '#00AAAA' }, // §3
  "Тёмно-красный": { bg: '#2A0000', border: '#AA0000' }, // §4
  "Тёмно-пурпурный": { bg: '#2A002A', border: '#AA00AA' }, // §5
  Золотой:       { bg: '#2A2A00', border: '#FFAA00' }, // §6
  Серый:         { bg: '#2A2A2A', border: '#AAAAAA' }, // §7
  "Тёмно-серый":   { bg: '#151515', border: '#555555' }, // §8
  Синий:         { bg: '#15153F', border: '#5555FF' }, // §9
  Зелёный:       { bg: '#153F15', border: '#55FF55' }, // §a
  Бирюзовый:     { bg: '#153F3F', border: '#55FFFF' }, // §b
  Красный:       { bg: '#3F1515', border: '#FF5555' }, // §c
  "Светло-пурпурный": { bg: '#3F153F', border: '#FF55FF' }, // §d
  Жёлтый:        { bg: '#3F3F15', border: '#FFFF55' }, // §e
  Белый:         { bg: '#3F3F3F', border: '#FFFFFF' }, // §f

  // === Разные сочетания ===
  Классика:     { bg: '#282828', border: '#a0a0a0' },
  Изумруд:      { bg: '#003e2f', border: '#00ffba' },
  Золото:       { bg: '#3b2c00', border: '#ffcc00' },
  Незер:        { bg: '#2b0f0f', border: '#ff3b3b' },
  Лёд:          { bg: '#0f2b3b', border: '#3bafff' },
  Алмаз:        { bg: '#0f3b3b', border: '#3bffff' },
  Рубин:        { bg: '#3b0f0f', border: '#ff3b6b' },
  Аметист:      { bg: '#2b0f3b', border: '#a03bff' },
  Обсидиан:     { bg: '#0f0f2b', border: '#3b3bff' },
  Песчаник:     { bg: '#3b2b0f', border: '#ffcc66' },
  Лазурит:      { bg: '#0f0f3b', border: '#3b6bff' },
  Эндер:        { bg: '#1a0f2b', border: '#7f3bff' },
  Призмарин:    { bg: '#0f3b2b', border: '#3bffcc' },
  Медь:         { bg: '#3b1f0f', border: '#ff9966' },
  Светокамень:  { bg: '#3b3b0f', border: '#ffff66' },
  Багровый:     { bg: '#3b0f1f', border: '#ff6699' },
  Искажённый:   { bg: '#0f3b1f', border: '#66ff99' }
}


// Добавление тени ко всем пресетам
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

  ctx.font = '48px MinecraftTitleCyrillic'
  const textMetrics = ctx.measureText(text.value)
  const textWidth = Math.ceil(textMetrics.width)
  const finalWidth = textWidth + 40
  const finalHeight = 100

  canvas.value.width = finalWidth
  canvas.value.height = finalHeight

  // Фон
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, finalWidth, finalHeight)

  // Рамка
  if (showBorder.value) {
    ctx.strokeStyle = borderColor.value
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, finalWidth, finalHeight)
  }

  // Шрифт
  ctx.font = '48px MinecraftTitleCyrillic'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const centerX = finalWidth / 2
  const centerY = finalHeight / 2 + 4  // ← смещение вниз на 4px

  // Тень
  if (showShadow.value) {
    ctx.fillStyle = shadowColor.value
    ctx.fillText(text.value, centerX + 2, centerY + 2)
  }

  // Основной текст
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text.value, centerX, centerY)

  // Экспорт изображения
  imageSrc.value = canvas.value.toDataURL()
}


function downloadImage() {
  const link = document.createElement('a')
  link.href = imageSrc.value
  link.download = `${text.value || 'rank'}.png` // ← имя по тексту, по умолчанию "rank"
  link.click()
}

watch([text, bgColor, borderColor, shadowColor, showBorder, showShadow], draw)
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

body {
  margin: 0;
  font-family: sans-serif;
  background: #1a1a1a;
  color: white;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 0;
  overflow: hidden;
}

.app {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  height: 100vh;
  background: #1a1a1a;
}

.input {
  padding: 0.25rem;
  font-size: 1rem;
  width: 200px;
}

.color-pickers {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.preview-canvas {
  display: none;
}

.preview-img {
  image-rendering: pixelated;
  width: auto;
  height: 128px;
}

button {
  padding: 0.4rem 0.8rem;
  background: #333;
  border: 1px solid #666;
  color: white;
  cursor: pointer;
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
}

.dark-select {
  margin-left: 0.5rem;
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
</style>
