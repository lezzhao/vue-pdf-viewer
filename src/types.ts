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
   * Source of the document to display.
   */
  source: Source
  /**
   * Number of the page to display.
   */
  page?: number
  /**
   * Desired page height.
   */
  height?: number
  /**
   * Desired page width.
   */
  width?: number
  /**
   * toolbar
   */
  toolbar?: boolean | ToolBar
}