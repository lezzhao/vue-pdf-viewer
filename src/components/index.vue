<script setup lang="ts">
import type { PdfProps, TransformPdfResult } from '../types';
import { usePdfViewer } from '../pdf'
import { watch, ref, onUnmounted, toRaw } from 'vue'

const props = defineProps<PdfProps>()

const { transform, clear, renderPages } = usePdfViewer()
const pdfInfo = ref<TransformPdfResult>()

const render = async () => {
    if (pdfInfo.value?.pdf) {
        const pdf = toRaw(pdfInfo.value.pdf)
        const contents = await renderPages(pdf)
        const thumbs = await renderPages(pdf, { thumbnail: true })
        document.querySelector('.pdf-thumbs-container')!.appendChild(thumbs)
        document.querySelector('.pdf-content-container')!.appendChild(contents)
    }
}

watch(() => props.source, async val => {
    if (val) {
        pdfInfo.value = await transform(val)
        render()
    }
}, { immediate: true })


onUnmounted(() => {
    clear(pdfInfo.value)
})

</script>

<template>
    <main class="pdf-container">
        <header class="pdf-header"></header>
        <section class="pdf-main-container">
            <section class="pdf-thumbs-container"></section>
            <section class="pdf-content-container"></section>
        </section>
    </main>
</template>


<style>
div,
main,
section,
header,
body {
    padding: 0;
    margin: 0;
}

.pdf-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
}

.pdf-header {
    height: 50px;
    background-color: #ccc;
}

.pdf-main-container {
    height: 0;
    overflow: hidden;
    flex: 1;
    display: flex;
}

.pdf-thumbs-container {
    width: 180px;
    text-align: center;
    background-color: #eee;
    height: 100%;
    overflow-y: auto;
}

.pdf-thumb-item {
    margin: 8px 0;
    cursor: pointer;
}

.pdf-thumb-item:hover {
    outline: #ccc solid 6px;
}

.pdf-content-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    background-color: #fff;
    height: 100%;
    overflow-y: auto;
}</style>