import { PasswordResponses, getDocument } from 'pdfjs-dist';
import type {
  OnProgressParameters,
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'
import { PasswordRequestParams, Source, PdfInstance } from './types';

import { GlobalWorkerOptions } from 'pdfjs-dist'
// @ts-expect-error
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { addPrintStyles, createPrintIframe, downloadPdf, releaseChildCanvases, scrollToPage } from './utils';

if (!GlobalWorkerOptions?.workerSrc) {
  GlobalWorkerOptions.workerSrc = PdfWorker
}

const pdfInstanceCache = new Map<Source, PdfInstance>()

export function usePdfViewer(options?: {
  onError?: (e: Error) => unknown
  onPasswordRequest?: (passwordRequestParams: PasswordRequestParams) => unknown
  onProgress?: (progressParams: OnProgressParameters) => unknown
}) {
  /**
   * get pdf file, add event listener to handle password request, progress and error
   * @param source 
   * @param options 
   * @returns 
   */
  const transform = async (source: Source): Promise<PdfInstance | undefined> => {
    const { onError, onPasswordRequest, onProgress } = options || {}
    if (!source) return

    if (pdfInstanceCache.has(source)) return pdfInstanceCache.get(source)

    let result = { pdf: null, task: null } as PdfInstance
    if (Object.prototype.hasOwnProperty.call(source, '_pdfInfo')) {
      result.pdf = source as PDFDocumentProxy
    } else {
      try {
        const task = getDocument(
          source as Parameters<typeof getDocument>[0]
        )

        if (onPasswordRequest) {
          task!.onPassword = (
            callback: Function,
            response: number
          ) => {
            onPasswordRequest({
              callback,
              isWrongPassword: response === PasswordResponses.INCORRECT_PASSWORD,
            })
          }
        }

        if (onProgress) {
          task.onProgress = onProgress
        }

        const pdf = await task.promise
        result = { pdf, task }
      } catch (e) {
        if (onError) {
          onError(e as Error)
        } else {
          throw e
        }
      }
    }
    if (result.pdf) {
      pdfInstanceCache.set(source, result)
    }
    if (pdfInstanceCache.size > 5) {
      pdfInstanceCache.delete(Array.from(pdfInstanceCache.keys())[0])
    }
    return result
  }

  /**
   * remove all event listener bind to the pdf, and destroy the pdf object
   * @param source 
   */
  const clear = (instance?: PdfInstance) => {
    const { task, pdf } = instance || {}
    if (task?.onPassword) {
      // @ts-expect-error: onPassword must be reset
      task.onPassword = null
    }
    if (task?.onProgress) {
      // @ts-expect-error: onProgress must be reset
      task.onProgress = null
    }
    pdf?.destroy()
  }

  // render thumbnail item
  const renderThumbnail = async (page: PDFPageProxy) => {
    const canvas = document.createElement('canvas')
    canvas.classList.add('pdf-thumb-item')
    const context = canvas.getContext('2d')
    let viewport = page.getViewport({ scale: 1 })
    const s = 100 / viewport.width
    viewport = viewport.clone({ scale: s })
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.dataset.t_page = `${page.pageNumber}`
    canvas.addEventListener('click', (e) => {
      const target = e.target as HTMLCanvasElement
      const page = target.dataset.t_page
      scrollToPage(page)
    })

    requestAnimationFrame(() => {
      page.render({ canvasContext: context!, viewport }).promise
    })
    return canvas
  }
  // render pdf page item
  const renderPage = async (page: PDFPageProxy, config?: {
    scale?: number, rotation?: number
  }) => {
    const { rotation = 0, scale = 1 } = config || {}
    const canvas = document.createElement('canvas')
    canvas.classList.add('pdf-page-item')
    const context = canvas.getContext('2d')
    const viewport = page.getViewport({ scale, rotation })

    canvas.dataset.page = `${page.pageNumber}`
    canvas.height = viewport.height
    canvas.width = viewport.width

    requestAnimationFrame(() => {
      page.render({ canvasContext: context!, viewport }).promise
    })
    return canvas
  }
  // render logic
  const render = async (pdf: PDFDocumentProxy, config: { thumbnail?: boolean, scale?: number } = { thumbnail: false }) => {
    const { thumbnail, scale = 1 } = config
    const fragment = document.createDocumentFragment()

    let _render = thumbnail ? renderThumbnail : renderPage

    await Promise.all([...Array(pdf.numPages).keys()].map(async (i) => {
      const page = await pdf.getPage(i + 1)
      const p = await _render(page, { scale })
      fragment.appendChild(p)
    }))

    return fragment
  }

  const renderPrintUnit = async (page: PDFPageProxy, scale: number) => {
    const canvas = document.createElement('canvas')
    const viewport = page.getViewport({ scale: 1, rotation: 0 })

    canvas.height = viewport.height * scale
    canvas.width = viewport.width * scale
    return { canvas, viewport }
  }

  const print = async (pdf: PDFDocumentProxy, options?: {
    dpi?: number, filename?: string, page?: number
  }) => {
    if (!pdf) {
      return
    }
    const { dpi = 300, filename = '', page = -1 } = options || {}
    const printUnits = dpi / 72
    const styleUnits = 96 / 72
    let container: HTMLDivElement
    let iframe: HTMLIFrameElement
    let title: string | undefined

    try {
      container = window.document.createElement('div')
      container.style.display = 'none'
      window.document.body.appendChild(container)
      iframe = await createPrintIframe(container)

      const ranges =
        page === -1
          ? Array.from({ length: pdf.numPages }, (_, i) => i + 1)
          : [page]

      await Promise.all(
        ranges.map(async (p, i) => {
          const page = await pdf.getPage(p)
          const { canvas, viewport } = await renderPrintUnit(page, printUnits)

          if (i === 0) {
            const sizeX = (viewport.width * printUnits) / styleUnits
            const sizeY = (viewport.height * printUnits) / styleUnits
            addPrintStyles(iframe, sizeX, sizeY)
          }

          container.appendChild(canvas)
          const canvasClone = canvas.cloneNode() as HTMLCanvasElement
          iframe.contentWindow!.document.body.appendChild(canvasClone)

          await page.render({
            canvasContext: canvas.getContext('2d')!,
            intent: 'print',
            transform: [printUnits, 0, 0, printUnits, 0, 0],
            viewport,
          }).promise

          canvasClone.getContext('2d')!.drawImage(canvas, 0, 0)
        })
      )

      if (filename) {
        title = window.document.title
        window.document.title = filename
      }

      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } finally {
      if (title) {
        window.document.title = title
      }
      releaseChildCanvases(container!)
      container!.parentNode?.removeChild(container!)
    }
  }


  const download = async (pdf: PDFDocumentProxy, filename?: string) => {
    if (!pdf) return
    const data = await pdf.getData()
    const meta = await pdf.getMetadata()
    console.log(meta);
    // @ts-expect-error
    downloadPdf(data, filename || meta.contentDispositionFilename || 'download')
  }

  return {
    transform,
    render,
    clear,
    print,
    download
  }
}