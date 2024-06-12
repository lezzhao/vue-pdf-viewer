import { PasswordResponses, getDocument } from 'pdfjs-dist';
import type {
  OnProgressParameters,
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'
import { PasswordRequestParams, Source, TransformPdfResult } from './types';

import { GlobalWorkerOptions } from 'pdfjs-dist'
// @ts-expect-error
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

if (!GlobalWorkerOptions?.workerSrc) {
  GlobalWorkerOptions.workerSrc = PdfWorker
}

const pdfInstanceCache = new Map<Source, TransformPdfResult>()

export function usePdfViewer(options?: {
  onError?: (e: Error) => unknown
  onPasswordRequest?: (passwordRequestParams: PasswordRequestParams) => unknown
  onProgress?: (progressParams: OnProgressParameters) => unknown
}) {
  /**
   * transform pdf file, add event listener to handle password request, progress and error
   * @param source 
   * @param options 
   * @returns 
   */
  const transform = async (source: Source): Promise<TransformPdfResult> => {
    const { onError, onPasswordRequest, onProgress } = options || {}
    if (!source) return

    const cache = pdfInstanceCache.get(source)
    if (cache) return cache
    if (pdfInstanceCache.size >= 5) pdfInstanceCache.delete(Array.from(pdfInstanceCache.keys())[0])

    if (Object.prototype.hasOwnProperty.call(source, '_pdfInfo')) {
      pdfInstanceCache.set(source, {
        pdf: source as PDFDocumentProxy,
        task: null,
      })
      return { pdf: source as PDFDocumentProxy, task: null }
    }

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
      pdfInstanceCache.set(source, { pdf, task })
      return { pdf, task }
    } catch (e) {
      if (onError) {
        onError(e as Error)
      } else {
        throw e
      }
    }
  }

  /**
   * remove all event listener bind to the pdf, and destroy the pdf object
   * @param source 
   */
  const clear = (source: TransformPdfResult) => {
    const { task, pdf } = source || {}
    if (task?.onPassword) {
      // @ts-expect-error: onPassword must be reset
      task.onPassword = null
    }
    if (task?.onProgress) {
      // @ts-expect-error: onProgress must be reset
      task.value.onProgress = null
    }
    pdf?.destroy()
  }


  const renderPage = async (page: PDFPageProxy, config?: {
    scale?: number, rotation?: number, thumbnail?: boolean
  }) => {
    const { rotation = 0, scale = 2, thumbnail } = config || {}
    const canvas = document.createElement('canvas')
    canvas.classList.add(thumbnail ? `pdf-thumb-item` : `pdf-page-item`)
    const context = canvas.getContext('2d')
    const viewport = page.getViewport({ scale: thumbnail ? 0.34 : scale, rotation })
    if (thumbnail) {
      canvas.width = 100
      canvas.dataset.t_page = `${page.pageNumber}`
      canvas.addEventListener('click', (e) => {
        const target = e.target as HTMLCanvasElement
        const page = target.dataset.t_page
        if (page) {
          document.querySelector(`[data-page="${page}"]`)?.scrollIntoView({ behavior: 'smooth'})
        }
      })
    } else {
      canvas.dataset.page = `${page.pageNumber}`
      canvas.height = viewport.height
      canvas.width = viewport.width
      IntersectionObserver
    }

    requestAnimationFrame(() => {
      page.render({ canvasContext: context!, viewport }).promise
    })
    return canvas
  }

  const renderPages = async (pdf: PDFDocumentProxy, config: { thumbnail?: boolean } = { thumbnail: false }) => {
    const { thumbnail } = config
    const fragment = document.createDocumentFragment()
    console.log(await pdf.getPage(1));

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const p = await renderPage(page, thumbnail ? { thumbnail: true, scale: 1 } : undefined)
      fragment.appendChild(p)
    }

    return fragment
  }


  return {
    transform,
    renderPages,
    clear
  }
}