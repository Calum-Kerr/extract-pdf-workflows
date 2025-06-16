"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useMutation } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Scissors, 
  Merge, 
  RotateCw, 
  Crop,
  FileText,
  Download,
  Upload,
  Loader2,
  Settings,
  Image as ImageIcon
} from "lucide-react"
import { PDFEngine } from "@/lib/pdf-engine"
import { downloadBlob } from "@/lib/utils"

interface PDFToolsProps {
  file: File | null
  onToolComplete?: (result: any) => void
  className?: string
}

export function PDFTools({ file, onToolComplete, className }: PDFToolsProps) {
  const [splitPages, setSplitPages] = useState("")
  const [mergeFiles, setMergeFiles] = useState<File[]>([])
  const [rotationAngle, setRotationAngle] = useState(90)
  const [watermarkText, setWatermarkText] = useState("")
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  // Split PDF mutation
  const splitMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected")
      
      const pdfEngine = new PDFEngine()
      await pdfEngine.loadPDF(file)
      
      const pageNumbers = splitPages
        .split(",")
        .map(p => parseInt(p.trim()))
        .filter(p => !isNaN(p))
      
      if (pageNumbers.length === 0) {
        throw new Error("Please specify valid page numbers")
      }
      
      const extractedPDF = await pdfEngine.extractPages(pageNumbers)
      pdfEngine.dispose()
      
      return extractedPDF
    },
    onSuccess: (pdfBytes) => {
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      downloadBlob(blob, `split-pages-${splitPages.replace(/,/g, "-")}.pdf`)
      toast({
        title: "PDF split successful",
        description: "Selected pages have been extracted.",
      })
      onToolComplete?.({ type: "split", pages: splitPages })
    },
    onError: (error: Error) => {
      toast({
        title: "Split failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Merge PDFs mutation
  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No main file selected")
      if (mergeFiles.length === 0) throw new Error("No files to merge")
      
      const allFiles = [file, ...mergeFiles]
      const mergedPDF = await PDFEngine.mergePDFs(allFiles)
      
      return mergedPDF
    },
    onSuccess: (pdfBytes) => {
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      downloadBlob(blob, "merged-document.pdf")
      toast({
        title: "PDF merge successful",
        description: `${mergeFiles.length + 1} files have been merged.`,
      })
      onToolComplete?.({ type: "merge", fileCount: mergeFiles.length + 1 })
    },
    onError: (error: Error) => {
      toast({
        title: "Merge failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Rotate PDF mutation
  const rotateMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected")
      
      const pdfEngine = new PDFEngine()
      await pdfEngine.loadPDF(file)
      
      // Rotate all pages
      const info = await pdfEngine.loadPDF(file)
      const allPages = Array.from({ length: info.numPages }, (_, i) => i + 1)
      
      const rotatedPDF = await pdfEngine.rotatePages(allPages, rotationAngle)
      pdfEngine.dispose()
      
      return rotatedPDF
    },
    onSuccess: (pdfBytes) => {
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      downloadBlob(blob, `rotated-${rotationAngle}deg.pdf`)
      toast({
        title: "PDF rotation successful",
        description: `Document rotated by ${rotationAngle} degrees.`,
      })
      onToolComplete?.({ type: "rotate", angle: rotationAngle })
    },
    onError: (error: Error) => {
      toast({
        title: "Rotation failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Add watermark mutation
  const watermarkMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected")
      if (!watermarkText.trim()) throw new Error("Please enter watermark text")
      
      const pdfEngine = new PDFEngine()
      await pdfEngine.loadPDF(file)
      
      const watermarkedPDF = await pdfEngine.addWatermark(watermarkText, {
        opacity: 0.3,
        fontSize: 50,
        color: [0.7, 0.7, 0.7],
        rotation: 45
      })
      pdfEngine.dispose()
      
      return watermarkedPDF
    },
    onSuccess: (pdfBytes) => {
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      downloadBlob(blob, "watermarked-document.pdf")
      toast({
        title: "Watermark added successfully",
        description: "Watermark has been applied to all pages.",
      })
      onToolComplete?.({ type: "watermark", text: watermarkText })
    },
    onError: (error: Error) => {
      toast({
        title: "Watermark failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const pdfFiles = files.filter(f => f.type === "application/pdf")
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only PDF files are allowed.",
        variant: "destructive",
      })
    }
    
    setMergeFiles(pdfFiles)
  }

  const tools = [
    {
      id: "split",
      title: "Split PDF",
      description: "Extract specific pages from your PDF",
      icon: Scissors,
      action: () => splitMutation.mutate(),
      loading: splitMutation.isPending,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="split-pages">Page Numbers</Label>
            <Input
              id="split-pages"
              value={splitPages}
              onChange={(e) => setSplitPages(e.target.value)}
              placeholder="e.g., 1,3,5-7"
            />
            <p className="text-xs text-muted-foreground">
              Enter page numbers separated by commas. Use ranges like "5-7" for multiple pages.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "merge",
      title: "Merge PDFs",
      description: "Combine multiple PDF files into one",
      icon: Merge,
      action: () => mergeMutation.mutate(),
      loading: mergeMutation.isPending,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merge-files">Additional PDF Files</Label>
            <Input
              id="merge-files"
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground">
              Select additional PDF files to merge with the current document.
            </p>
          </div>
          {mergeFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Files to merge ({mergeFiles.length + 1} total):</Label>
              <div className="space-y-1">
                <Badge variant="outline">{file?.name} (current)</Badge>
                {mergeFiles.map((f, i) => (
                  <Badge key={i} variant="secondary">{f.name}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: "rotate",
      title: "Rotate PDF",
      description: "Rotate all pages in your PDF",
      icon: RotateCw,
      action: () => rotateMutation.mutate(),
      loading: rotateMutation.isPending,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rotation Angle</Label>
            <div className="grid grid-cols-4 gap-2">
              {[90, 180, 270, 360].map((angle) => (
                <Button
                  key={angle}
                  variant={rotationAngle === angle ? "default" : "outline"}
                  onClick={() => setRotationAngle(angle)}
                  size="sm"
                >
                  {angle}°
                </Button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: "watermark",
      title: "Add Watermark",
      description: "Add text watermark to all pages",
      icon: ImageIcon,
      action: () => watermarkMutation.mutate(),
      loading: watermarkMutation.isPending,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Input
              id="watermark-text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter watermark text"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            The watermark will be applied diagonally across all pages with 30% opacity.
          </div>
        </div>
      )
    }
  ]

  if (!file) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Please select a PDF file to use these tools.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Dialog key={tool.id}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <tool.icon className="h-5 w-5" />
                    <span>{tool.title}</span>
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <tool.icon className="h-5 w-5" />
                  <span>{tool.title}</span>
                </DialogTitle>
                <DialogDescription>{tool.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {tool.content}
                
                <Button 
                  onClick={tool.action}
                  disabled={tool.loading}
                  className="w-full"
                >
                  {tool.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <tool.icon className="mr-2 h-4 w-4" />
                      {tool.title}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}
