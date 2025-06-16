"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useMutation } from "@tanstack/react-query"
import { 
  FileText, 
  Download, 
  Copy, 
  Search, 
  Languages,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { createWorker } from "tesseract.js"
import { copyToClipboard, downloadBlob } from "@/lib/utils"

interface OCRExtractorProps {
  file: File | string
  pageNumber?: number
  onTextExtracted?: (text: string) => void
  className?: string
}

export function OCRExtractor({ 
  file, 
  pageNumber = 1, 
  onTextExtracted,
  className 
}: OCRExtractorProps) {
  const [extractedText, setExtractedText] = useState("")
  const [progress, setProgress] = useState(0)
  const [language, setLanguage] = useState("eng")
  const { toast } = useToast()

  const languages = [
    { code: "eng", name: "English" },
    { code: "spa", name: "Spanish" },
    { code: "fra", name: "French" },
    { code: "deu", name: "German" },
    { code: "ita", name: "Italian" },
    { code: "por", name: "Portuguese" },
    { code: "rus", name: "Russian" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
  ]

  const ocrMutation = useMutation({
    mutationFn: async () => {
      const worker = await createWorker({
        logger: m => console.log(m)
      })
      await worker.loadLanguage(language)
      await worker.initialize(language)
      
      try {
        // Convert PDF page to image if needed
        let imageSource: string | File = file as File
        
        if (typeof file === "string" || file.type === "application/pdf") {
          // For PDF files, we would need to convert the specific page to an image
          // This is a simplified version - in production, you'd use PDF.js to render the page
          throw new Error("PDF to image conversion not implemented in this demo")
        }

        const result = await worker.recognize(imageSource, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100))
            }
          }
        })

        await worker.terminate()
        return result.data.text
      } catch (error) {
        await worker.terminate()
        throw error
      }
    },
    onSuccess: (text) => {
      setExtractedText(text)
      onTextExtracted?.(text)
      setProgress(100)
      toast({
        title: "OCR completed",
        description: "Text has been successfully extracted from the image.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "OCR failed",
        description: error.message,
        variant: "destructive",
      })
      setProgress(0)
    },
  })

  const handleExtractText = () => {
    setProgress(0)
    setExtractedText("")
    ocrMutation.mutate()
  }

  const handleCopyText = async () => {
    try {
      await copyToClipboard(extractedText)
      toast({
        title: "Text copied",
        description: "Extracted text has been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain" })
    downloadBlob(blob, `extracted-text-page-${pageNumber}.txt`)
  }

  const selectedLanguage = languages.find(lang => lang.code === language)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>OCR Text Extraction</span>
        </CardTitle>
        <CardDescription>
          Extract text from scanned documents and images using OCR technology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selection */}
        <div className="flex items-center space-x-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm border rounded px-2 py-1"
            disabled={ocrMutation.isPending}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Extract Button */}
        <Button 
          onClick={handleExtractText}
          disabled={ocrMutation.isPending}
          className="w-full"
        >
          {ocrMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting Text...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Extract Text with OCR
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {ocrMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing with {selectedLanguage?.name}...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success/Error Status */}
        {ocrMutation.isSuccess && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Text extraction completed</span>
          </div>
        )}

        {ocrMutation.isError && (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Text extraction failed</span>
          </div>
        )}

        {/* Extracted Text */}
        {extractedText && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Extracted Text:</span>
                <Badge variant="outline">
                  {extractedText.length} characters
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadText}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Extracted text will appear here..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        )}

        {/* OCR Tips */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">OCR Tips for Better Results:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ensure the image has good contrast and lighting</li>
              <li>• Higher resolution images produce better results</li>
              <li>• Select the correct language for your document</li>
              <li>• Avoid skewed or rotated text when possible</li>
              <li>• Clean, printed text works better than handwriting</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
