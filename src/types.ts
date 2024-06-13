import { PDFDocumentLoadingTask, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'

export type Source = Parameters<typeof getDocument>[0] | PDFDocumentProxy | null

export type PasswordRequestParams = {
  callback: Function
  isWrongPassword: boolean
}


export type PdfInstance = {
  pdf: PDFDocumentProxy | null,
  task: PDFDocumentLoadingTask | null,
}


export type ToolBar = {
  download?: boolean
  scale?: boolean
  page?: boolean
  print?: boolean
  viewThumbnail?: boolean
}

export interface PdfProps {
  /**
   * Whether to enable an annotation layer.
   */
  annotationLayer?: boolean
  /**
   * Desired page height.
   */
  height?: number
  /**
   * Root element identifier (inherited by page containers with page number
   * postfixes).
   */
  id?: string
  /**
   * Path for annotation icons, including trailing slash.
   */
  imageResourcesPath?: string
  /**
   * Number of the page to display.
   */
  page?: number
  /**
   * Source of the document to display.
   */
  source: Source
  /**
   * Whether to enable a text layer.
   */
  textLayer?: boolean
  /**
   * Desired page width.
   */
  width?: number
  /**
   * toolbar
   */
  toolbar?: boolean | ToolBar
}