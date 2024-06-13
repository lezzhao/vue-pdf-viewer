
// scroll to specific page of the pdf
export function scrollToPage(page?: number | string) {
    if (!page) return
    document.querySelector(`[data-page="${page}"]`)?.scrollIntoView({ behavior: 'smooth' })
}

// download pdf
export function downloadPdf(data: Uint8Array, filename: string) {
    return new Promise(resolve => {
        const url = URL.createObjectURL(
            new Blob([data], {
                type: 'application/pdf',
            })
        )
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => {
            resolve(true)
        }, 1000)
    })
}


export function createPrintIframe(
    container: HTMLDivElement
  ): Promise<HTMLIFrameElement> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.width = '0'
      iframe.height = '0'
      iframe.style.position = 'absolute'
      iframe.style.top = '0'
      iframe.style.left = '0'
      iframe.style.border = 'none'
      iframe.style.overflow = 'hidden'
      iframe.onload = () => resolve(iframe)
      container.appendChild(iframe)
    })
  }

  export function addPrintStyles(
    iframe: HTMLIFrameElement,
    sizeX: number,
    sizeY: number
  ) {
    const style = iframe.contentWindow!.document.createElement('style')
    style.textContent = `
      @page {
        margin: 3mm;
        size: ${sizeX}pt ${sizeY}pt;
      }
      body {
        margin: 0;
      }
      canvas {
        width: 100%;
        page-break-after: always;
        page-break-before: avoid;
        page-break-inside: avoid;
      }
    `
    iframe.contentWindow!.document.head.appendChild(style)
    iframe.contentWindow!.document.body.style.width = '100%'
  }

export function releaseChildCanvases(el?: HTMLElement) {
    el?.querySelectorAll('canvas').forEach((canvas: HTMLCanvasElement) => {
      canvas.width = 1
      canvas.height = 1
      canvas.getContext('2d')?.clearRect(0, 0, 1, 1)
    })
  }