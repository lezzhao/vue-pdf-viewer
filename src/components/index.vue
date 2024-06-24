<script setup lang="ts">
import type { PdfProps, PdfInstance } from '../types';
import { usePdfViewer } from '../pdf'
import { watch, ref, onUnmounted, reactive, computed, onMounted, shallowRef } from 'vue'
import type { OnProgressParameters, PDFDocumentProxy } from 'pdfjs-dist';
import { isSlidePast, debounce } from '../utils';

const props = withDefaults(defineProps<PdfProps>(), {
    source: '',
    scale: 1,
    toolbar: true,
})

const toolbar = computed(() => {
    if (props.toolbar === false) return {
        download: false,
        scale: false,
        print: false,
        viewThumbnail: false,
    }
    return props.toolbar === true ? {
        download: true,
        scale: true,
        print: true,
        viewThumbnail: true,
    } : props.toolbar
})

const emit = defineEmits<{
    (e: 'loaded', value: PDFDocumentProxy): void
    (e: 'failed', value: { type: 'load-error' | 'render-error'; error: Error }): void
    (e: 'progress', value: OnProgressParameters): void
    (e: 'rendered'): void
}>()

const pwdInfo = ref({
    visible: false,
    pwd: ''
})
const { transform, clear, render, download, print } = usePdfViewer({
    onError: (e) => {
        info.total = 0
        emit('failed', { type: 'load-error', error: e })
    },
    onPasswordRequest({ callback, isWrongPassword }) {
        pwdInfo.value = {
            visible: true,
            pwd: ''
        }
    },
    onProgress: (progressParams) => emit('progress', progressParams),
})

const pdfInstance = shallowRef<PdfInstance>()
const info = reactive({
    total: 0,
    page: 1,
    scale: 1,
    thumbnail: false,
})

const clickHandler = async () => {
    let source: any = {
        url: '',
        password: ''
    }
    if (typeof props.source === 'string') {
        source.url = props.source
        source.password = pwdInfo.value.pwd
    } else {
        source = Object.assign({ password: pwdInfo.value.pwd }, props.source)
    }
    pdfInstance.value = await transform(source)
    await renderHandler()
    pwdInfo.value.visible = false
}

const renderHandler = async () => {
    if (!pdfInstance.value?.pdf) return
    try {
        const pdf = pdfInstance.value.pdf
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
}, { immediate: true, deep: true })

const toggleThumbnail = () => {
    info.thumbnail = !info.thumbnail
    if (info.thumbnail)
        highlightThumbItem(info.page)
}

const scaleHandler = async (increase: boolean) => {
    const increaseNum = increase ? 0.25 : -0.25
    info.scale = info.scale + increaseNum
    const contents = await render(pdfInstance.value?.pdf as PDFDocumentProxy, { scale: info.scale })
    document.querySelector('.pdf-content-container')!.innerHTML = ''
    document.querySelector('.pdf-content-container')!.appendChild(contents)
}
const downloadHandler = (filename?: string) => {
    if (!pdfInstance.value?.pdf) return
    download(pdfInstance.value?.pdf, filename)
}
const printHandler = () => {
    if (!pdfInstance.value?.pdf) return
    print(pdfInstance.value?.pdf)
}

const scrollContainer = ref<HTMLElement>()
const highlightThumbItem = (page: number) => {
    document.querySelector('.pdf-thumb-item.active')?.classList.remove('active')
    const target = document.querySelector(`[data-t_page="${page}"]`)
    if (target) {
        target.classList.add('active')
        target.scrollIntoView({ behavior: 'auto', block: 'center' })
    }
}
const scrollHandler = debounce(() => {
    if (info.total) {
        for (let i = 1; i <= info.total; i++) {
            const flag = isSlidePast(i.toString())
            if (flag) {
                continue
            }
            info.page = i
            break
        }
        highlightThumbItem(info.page)
    }
}, 500)

onMounted(() => {
    if (scrollContainer.value && toolbar.value?.viewThumbnail) {
        scrollContainer.value.addEventListener('scroll', scrollHandler)
    }
})

onUnmounted(() => {
    clear(pdfInstance.value)
    if (scrollContainer.value) {
        scrollContainer.value.removeEventListener('scroll', scrollHandler)
    }
})


defineExpose({
    print: printHandler,
    download: downloadHandler
})
</script>

<template>
    <main class="pdf-container">
        <section class="pdf-mask" :style="pwdInfo.visible && {
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }">
            <template v-if="info.total">
                <header class="pdf-header">
                    <div>
                        <span @click="toggleThumbnail"><svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px"
                                viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h4v16zm6 0V4h10q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20z" />
                            </svg></span>
                        <span @click="scaleHandler(true)"><svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px"
                                viewBox="0 0 24 24">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                    stroke-width="2" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0-14 0m4 0h6m-3-3v6m11 8l-6-6" />
                            </svg></span>
                        <span @click="scaleHandler(false)"><svg xmlns="http://www.w3.org/2000/svg" width="22px"
                                height="22px" viewBox="0 0 24 24">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                    stroke-width="2" d="m21 21l-6-6m2-5a7 7 0 1 1-14 0a7 7 0 0 1 14 0m-4 0H7" />
                            </svg></span>
                    </div>
                    <div>
                        <span @click="downloadHandler()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="m12 16l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11zm-6 4q-.825 0-1.412-.587T4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413T18 20z" />
                            </svg>
                        </span>
                        <span @click="printHandler"><svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px"
                                viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="M16 8V5H8v3H6V3h12v5zM4 10h16zm14 2.5q.425 0 .713-.288T19 11.5t-.288-.712T18 10.5t-.712.288T17 11.5t.288.713t.712.287M16 19v-4H8v4zm2 2H6v-4H2v-6q0-1.275.875-2.137T5 8h14q1.275 0 2.138.863T22 11v6h-4zm2-6v-4q0-.425-.288-.712T19 10H5q-.425 0-.712.288T4 11v4h2v-2h12v2z" />
                            </svg></span>
                    </div>
                </header>
                <section class="pdf-main-container">
                    <section class="pdf-thumbs-container" :style="{
                        width: !info.thumbnail ? 0 : '180px',
                        transition: 'all .2s'
                    }" v-if="toolbar.viewThumbnail"></section>
                    <section class="pdf-content-container" ref="scrollContainer"></section>
                </section>
            </template>
            <template v-if="pwdInfo.visible">
                <div class="pwd-container">
                    <input type="password" placeholder="please type password" v-model="pwdInfo.pwd">
                    <button @click="clickHandler">confirm</button>
                </div>
            </template>
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
        justify-content: space-between;
        font-size: 24px;
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

            .pdf-thumb-item {
                margin: 4px 0 !important;
                cursor: pointer;

                &:hover {
                    outline: #ccc solid 6px;
                }

                &.active {
                    outline: #ccc solid 6px;
                }
            }
        }

        .pdf-content-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            background-color: #fff;
            height: 100%;
            overflow: auto;


            .pdf-page-item {
                margin: 4px 0;
                box-shadow: 0 0 10px 2px #ddd;
            }
        }
    }

    .pwd-container {
        background-color: #fff;
        padding: 20px 12px;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        justify-content: end;
        align-items: end;

        input {
            width: 320px;
            height: 30px;
            border: none;
            outline: none;
            border-bottom: 2px solid #2278f9;

            &::placeholder {
                font-size: 14px;
                color: #aaa;
            }
        }

        button {
            background-color: #2278f9;
            color: white;
            border: none;
            font-size: 14px;
            outline: none;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
            float: right;
        }
    }
}
</style>