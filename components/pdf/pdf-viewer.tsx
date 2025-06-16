"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Search,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PDFViewerProps {
  file: File | string | null
  className?: string
  onDocumentLoad?: (numPages: number) => void
  onPageChange?: (pageNumber: number) => void
  annotations?: any[]
  onAnnotationAdd?: (annotation: any) => void
  readOnly?: boolean
}

export function PDFViewer({
  file,
  className,
  onDocumentLoad,
  onPageChange,
  annotations = [],
  onAnnotationAdd,
  readOnly = false
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    onDocumentLoad?.(numPages)
  }, [onDocumentLoad])

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(error.message)
    setLoading(false)
    toast({
      title: "Failed to load PDF",
      description: error.message,
      variant: "destructive",
    })
  }, [toast])

  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1
      setPageNumber(newPage)
      onPageChange?.(newPage)
    }
  }, [pageNumber, onPageChange])

  const goToNextPage = useCallback(() => {
    if (pageNumber < numPages) {
      const newPage = pageNumber + 1
      setPageNumber(newPage)
      onPageChange?.(newPage)
    }
  }, [pageNumber, numPages, onPageChange])

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value)
    if (page >= 1 && page <= numPages) {
      setPageNumber(page)
      onPageChange?.(page)
    }
  }, [numPages, onPageChange])

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleScaleChange = useCallback((value: number[]) => {
    setScale(value[0])
  }, [])

  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const downloadPDF = useCallback(() => {
    if (typeof file === "string") {
      const link = document.createElement("a")
      link.href = file
      link.download = "document.pdf"
      link.click()
    } else if (file instanceof File) {
      const url = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = url
      link.download = file.name
      link.click()
      URL.revokeObjectURL(url)
    }
  }, [file])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          goToPrevPage()
          break
        case "ArrowRight":
          e.preventDefault()
          goToNextPage()
          break
        case "=":
        case "+":
          e.preventDefault()
          zoomIn()
          break
        case "-":
          e.preventDefault()
          zoomOut()
          break
        case "r":
          e.preventDefault()
          rotate()
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut, rotate, toggleFullscreen])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  if (!file) {
    return (
      <Card className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No PDF file selected</p>
        </div>
      </Card>
    )
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-2">
          {/* Navigation */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={pageNumber}
              onChange={handlePageInputChange}
              className="w-16 text-center"
              min={1}
              max={numPages}
            />
            <span className="text-sm text-muted-foreground">
              of {numPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2 min-w-32">
            <Slider
              value={[scale]}
              onValueChange={handleScaleChange}
              min={0.25}
              max={3.0}
              step={0.25}
              className="w-20"
            />
            <Badge variant="outline" className="text-xs">
              {Math.round(scale * 100)}%
            </Badge>
          </div>

          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Other Controls */}
          <Button variant="outline" size="sm" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div className="flex justify-center p-4">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <Card className="p-8 text-center">
              <p className="text-destructive mb-4">Failed to load PDF</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </Card>
          )}

          {!loading && !error && (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              <div className="relative">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  className="shadow-lg"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                
                {/* Annotations overlay */}
                {annotations
                  .filter(annotation => annotation.page_number === pageNumber)
                  .map((annotation) => (
                    <div
                      key={annotation.id}
                      className={cn(
                        "absolute pointer-events-auto",
                        annotation.annotation_type === "highlight" && "bg-yellow-300/30 border border-yellow-400",
                        annotation.annotation_type === "note" && "bg-blue-100 border border-blue-300 rounded-sm p-1"
                      )}
                      style={{
                        left: `${annotation.position.x * scale}px`,
                        top: `${annotation.position.y * scale}px`,
                        width: `${annotation.position.width * scale}px`,
                        height: `${annotation.position.height * scale}px`,
                      }}
                      title={annotation.content}
                    />
                  ))}
              </div>
            </Document>
          )}
        </div>
      </div>
    </div>
  )
}
