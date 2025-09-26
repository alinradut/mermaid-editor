<script setup lang="ts">
import { ref, watch } from 'vue'
import { getDownloadSVG } from '@/lib/DownloadSVG'
import { getDownloadPNG } from '@/lib/DownloadPNG'

const props = defineProps<{
	diagram: string
}>()

const svgHref = ref('')
const pngHref = ref('')

watch(
	() => props.diagram,
	async (newDiagram) => {
		svgHref.value = await getDownloadSVG(newDiagram)
		pngHref.value = await getDownloadPNG(newDiagram)
	},
	{ immediate: true }
)
</script>

<template>
	<div class="download-btns">
    <a v-if="svgHref" :href="svgHref" download="diagram.svg" class="download-btn" title="SVG">SVG</a>
    <a v-if="pngHref" :href="pngHref" download="diagram.png" class="download-btn" title="PNG">PNG</a>
	</div>
</template>

<style scoped>
.download-btns {
	display: flex;
	gap: 0.25rem;
}
.download-btn {
	color: var(--bs-body-color);
}
.download-btn {
  font-size: 0.75rem;
}
</style>
