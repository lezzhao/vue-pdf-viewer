<script setup lang="ts">
import type { PdfProps, PdfInstance } from '../types';
import { usePdfViewer } from '../pdf'
import { watch, ref, onUnmounted, toRaw, reactive, computed } from 'vue'
import type { OnProgressParameters, PDFDocumentProxy } from 'pdfjs-dist';

const props = withDefaults(defineProps<PdfProps>(), {
    source: '',
    password: '',
    scale: 1,
    toolbar: true,
})

const emit = defineEmits<{
    (e: 'loaded', value: PDFDocumentProxy): void
    (e: 'failed', value: { type: 'load-error' | 'render-error'; error: Error }): void
    (e: 'progress', value: OnProgressParameters): void
    (e: 'rendered'): void
}>()

const { transform, clear, render, download, print } = usePdfViewer({
    onError: (e) => {
        info.total = 0
        emit('failed', { type: 'load-error', error: e })
    },
    onPasswordRequest({ callback, isWrongPassword }) {
        console.log('onPasswordRequest', callback, isWrongPassword);

    },
    onProgress: (progressParams) => {
        emit('progress', progressParams)

    },
})
const pdfInstance = ref<PdfInstance>()
const info = reactive({
    total: 0,
    page: 1,
    scale: 1,
    thumbnail: false,
})

const toolbar = computed(() => {
    if (props.toolbar === false) return {
        download: false,
        scale: false,
        page: false,
        print: false,
        viewThumbnail: false,
    }
    return props.toolbar === true ? {
        download: true,
        scale: true,
        page: true,
        print: true,
        viewThumbnail: true,
    } : props.toolbar
})

const renderHandler = async () => {
    if (!pdfInstance.value?.pdf) return
    try {
        const pdf = toRaw(pdfInstance.value.pdf)
        info.total = pdf.numPages
        const contents = await render(pdf)
        if (toolbar.value?.viewThumbnail) {
            const thumbs = await render(pdf, { thumbnail: true })
            document.querySelector('.pdf-thumbs-container')!.appendChild(thumbs)
        }
        document.querySelector('.pdf-content-container')!.appendChild(contents)
        emit('rendered')
    } catch (error) {
        emit('failed', { type: 'render-error', error: error as Error })
    }
}

watch(() => props.source, async val => {
    if (val) {
        pdfInstance.value = await transform(val)
        renderHandler()
    }
}, { immediate: true })

const toggleThumbnail = () => {
    info.thumbnail = !info.thumbnail
}

const scaleHandler = () => { }
const downloadHandler = (filename?: string) => {
    if (!pdfInstance.value?.pdf) return
    download(toRaw(pdfInstance.value?.pdf), filename)
}
const printHandler = () => {
    if (!pdfInstance.value?.pdf) return
    print(toRaw(pdfInstance.value?.pdf))
}


onUnmounted(() => {
    clear(pdfInstance.value)
})
</script>

<template>
    <main class="pdf-container">
        <section class="pdf-mask">
            <header class="pdf-header">
                <span @click="toggleThumbnail">缩略图切换</span>
                <span @click="() => navigateTo(1)">上一页</span>
                <span @click="() => navigateTo(2)">下一页</span>
                <span @click="() => navigateTo(3)">跳转</span>
                <span @click="scaleHandler">放大</span>
                <span @click="scaleHandler">缩小</span>
                <span @click="downloadHandler()">下载</span>
                <span @click="printHandler">打印</span>
            </header>
            <section class="pdf-main-container">
                <section class="pdf-thumbs-container" :style="{
                    width: !info.thumbnail ? 0 : '180px',
                    transition: 'all .2s'
                }" v-if="toolbar.viewThumbnail"></section>
                <section class="pdf-content-container"></section>
            </section>
        </section>
    </main>
</template>

<style lang="less">
div,
main,
section,
header,
body {
    padding: 0;
    margin: 0;
}

.pdf-container {
    height: 100vh;
    width: 100%;
    position: relative;

    .pdf-mask {
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        position: absolute;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .pdf-header {
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        height: 40px;
        background-color: #ccc;
        justify-content: space-evenly;
    }

    .pdf-main-container {
        height: 0;
        overflow: hidden;
        flex: 1;
        display: flex;

        .pdf-thumbs-container {
            padding: 10px 0;
            text-align: center;
            background-color: #eee;
            height: 100%;
            overflow-y: auto;

        }

        .pdf-thumb-item {
            margin: 4px 0 !important;
            cursor: pointer;

            &:hover {
                outline: #ccc solid 6px;
            }
        }

        .pdf-content-container {
            padding: 4px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            background-color: #fff;
            height: 100%;
            overflow-y: auto;
        }
    }
}
</style>