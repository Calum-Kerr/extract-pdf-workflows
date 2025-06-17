import { PDFDocument, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

export interface PDFInfo {
  numPages: number
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  fileSize: number
}

export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
}

export interface AnnotationData {
  id: string
  type: 'highlight' | 'note' | 'drawing' | 'stamp' | 'signature'
  pageNumber: number
  position: {
    x: number
    y: number
    width: number
    height: number
    rotation?: number
  }
  content?: string
  style?: {
    color?: string
    opacity?: number
    fontSize?: number
    fontFamily?: string
  }
}

export class PDFEngine {
  private pdfDoc: PDFDocument | null = null
  private pdfBytes: Uint8Array | null = null

  // Load PDF from file or bytes
  async loadPDF(source: File | Uint8Array | ArrayBuffer): Promise<PDFInfo> {
    try {
      let bytes: Uint8Array

      if (source instanceof File) {
        bytes = new Uint8Array(await source.arrayBuffer())
      } else if (source instanceof ArrayBuffer) {
        bytes = new Uint8Array(source)
      } else {
        bytes = source
      }

      this.pdfBytes = bytes
      this.pdfDoc = await PDFDocument.load(bytes)

      // Extract PDF information
      const pageCount = this.pdfDoc.getPageCount()
      const title = this.pdfDoc.getTitle()
      const author = this.pdfDoc.getAuthor()
      const subject = this.pdfDoc.getSubject()
      const creator = this.pdfDoc.getCreator()
      const producer = this.pdfDoc.getProducer()
      const creationDate = this.pdfDoc.getCreationDate()
      const modificationDate = this.pdfDoc.getModificationDate()

      return {
        numPages: pageCount,
        title: title || undefined,
        author: author || undefined,
        subject: subject || undefined,
        creator: creator || undefined,
        producer: producer || undefined,
        creationDate: creationDate || undefined,
        modificationDate: modificationDate || undefined,
        fileSize: bytes.length
      }
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error}`)
    }
  }

  // Get page information
  async getPageInfo(pageNumber: number): Promise<PDFPageInfo> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')

    const page = this.pdfDoc.getPage(pageNumber - 1)
    const { width, height } = page.getSize()
    const rotation = page.getRotation().angle

    return {
      pageNumber,
      width,
      height,
      rotation
    }
  }

  // Render page as image
  async renderPageAsImage(
    pageNumber: number,
    scale = 1.5,
    format: 'png' | 'jpeg' = 'png'
  ): Promise<string> {
    if (!this.pdfBytes) throw new Error('No PDF loaded')

    const pdf = await pdfjsLib.getDocument({ data: this.pdfBytes }).promise
    const page = await pdf.getPage(pageNumber)

    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    return canvas.toDataURL(`image/${format}`)
  }

  // Extract text from page
  async extractTextFromPage(pageNumber: number): Promise<string> {
    if (!this.pdfBytes) throw new Error('No PDF loaded')

    const pdf = await pdfjsLib.getDocument({ data: this.pdfBytes }).promise
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()

    return textContent.items
      .map((item: any) => item.str)
      .join(' ')
  }

  // Extract all text from PDF
  async extractAllText(): Promise<string[]> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')

    const pageTexts: string[] = []
    const pageCount = this.pdfDoc.getPageCount()

    for (let i = 1; i <= pageCount; i++) {
      const text = await this.extractTextFromPage(i)
      pageTexts.push(text)
    }

    return pageTexts
  }

  // Merge multiple PDFs
  static async mergePDFs(pdfFiles: (File | Uint8Array)[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create()

    for (const pdfFile of pdfFiles) {
      let bytes: Uint8Array

      if (pdfFile instanceof File) {
        bytes = new Uint8Array(await pdfFile.arrayBuffer())
      } else {
        bytes = pdfFile
      }

      const pdf = await PDFDocument.load(bytes)
      const pageIndices = pdf.getPageIndices()
      const pages = await mergedPdf.copyPages(pdf, pageIndices)

      pages.forEach((page) => mergedPdf.addPage(page))
    }

    return await mergedPdf.save()
  }

  // Split PDF into separate pages
  async splitPDF(): Promise<Uint8Array[]> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')

    const pageCount = this.pdfDoc.getPageCount()
    const splitPdfs: Uint8Array[] = []

    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create()
      const [page] = await newPdf.copyPages(this.pdfDoc, [i])
      newPdf.addPage(page)

      const pdfBytes = await newPdf.save()
      splitPdfs.push(pdfBytes)
    }

    return splitPdfs
  }

  // Extract specific pages
  async extractPages(pageNumbers: number[]): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')

    const newPdf = await PDFDocument.create()
    const pageIndices = pageNumbers.map(num => num - 1)
    const pages = await newPdf.copyPages(this.pdfDoc, pageIndices)

    pages.forEach((page) => newPdf.addPage(page))

    return await newPdf.save()
  }

  // Add watermark
  async addWatermark(
    text: string,
    options: {
      opacity?: number
      fontSize?: number
      color?: [number, number, number]
      rotation?: number
    } = {}
  ): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')

    const {
      opacity = 0.3,
      fontSize = 50,
      color = [0.7, 0.7, 0.7],
      rotation = 45
    } = options

    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = this.pdfDoc.getPages()

    pages.forEach((page) => {
      const { width, height } = page.getSize()
      
      page.drawText(text, {
        x: width / 2 - (text.length * fontSize) / 4,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(color[0], color[1], color[2]),
        opacity,
        rotate: degrees(rotation)
      })
    })

    return await this.pdfDoc.save()
  }

  // Add annotations
  async addAnnotations(annotations: AnnotationData[]): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')

    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica)

    for (const annotation of annotations) {
      const page = this.pdfDoc.getPage(annotation.pageNumber - 1)
      const { position, content, style } = annotation

      switch (annotation.type) {
        case 'note':
          if (content) {
            page.drawText(content, {
              x: position.x,
              y: position.y,
              size: style?.fontSize || 12,
              font,
              color: rgb(0, 0, 0),
              opacity: style?.opacity || 1
            })
          }
          break

        case 'highlight':
          page.drawRectangle({
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            color: rgb(1, 1, 0),
            opacity: style?.opacity || 0.3
          })
          break

        case 'stamp':
          if (content) {
            page.drawText(content, {
              x: position.x,
              y: position.y,
              size: style?.fontSize || 16,
              font,
              color: rgb(1, 0, 0),
              opacity: style?.opacity || 1
            })
          }
          break
      }
    }

    return await this.pdfDoc.save()
  }

  // Rotate pages
  async rotatePages(pageNumbers: number[], rotationDegrees: number): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')

    pageNumbers.forEach(pageNum => {
      const page = this.pdfDoc!.getPage(pageNum - 1)
      page.setRotation(degrees(rotationDegrees))
    })

    return await this.pdfDoc.save()
  }

  // Get current PDF as bytes
  async save(): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('No PDF loaded')
    return await this.pdfDoc.save()
  }

  // Create new blank PDF
  static async createBlankPDF(
    pageCount = 1,
    pageSize: [number, number] = [595.28, 841.89] // A4 size
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()

    for (let i = 0; i < pageCount; i++) {
      pdfDoc.addPage(pageSize)
    }

    return await pdfDoc.save()
  }

  // Cleanup
  dispose(): void {
    this.pdfDoc = null
    this.pdfBytes = null
  }
}
