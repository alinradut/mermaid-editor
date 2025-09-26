<script setup lang="ts">
import Zoom from '@/components/NotePreview/Toolbar/Zoom/Zoom.vue'
import { injectUseNoteSingle } from '@/store/UseNoteSingle'

const { getPermalink, getText, update } = injectUseNoteSingle()

const copyPermalink = async () => {
  const link = getPermalink()
  try {
    await navigator.clipboard.writeText(link)
  } catch (e) {
    // fallback
    const input = document.createElement('input')
    input.value = link
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
}

const save = async () => {
  await update(getText())
}
</script>

<template>
  <div class="preview-toolbar">
    <zoom />
    <button class="btn btn-sm btn-primary" @click="save">Save</button>
    <button class="btn btn-sm btn-outline-secondary" @click="copyPermalink">Copy permalink</button>
  </div>
</template>

<style scoped>
.preview-toolbar {
  padding-inline: 0.4rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  height: 2.4rem;
  background-color: var(--bs-gray-200);
}
</style>
