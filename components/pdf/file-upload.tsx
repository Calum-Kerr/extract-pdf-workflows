"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"

interface FileUploadProps {
  onUploadComplete?: (document: any) => void
  maxFileSize?: number
  className?: string
}

export function FileUpload({ 
  onUploadComplete, 
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  className 
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: "Your PDF has been uploaded and processed.",
      })
      
      // Reset form
      setSelectedFile(null)
      setTitle("")
      setDescription("")
      setUploadProgress(0)
      
      // Invalidate queries to refresh document lists
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      queryClient.invalidateQueries({ queryKey: ["recent-documents"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      
      onUploadComplete?.(data.document)
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
      setUploadProgress(0)
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive",
        })
        return
      }

      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `File size must be less than ${formatBytes(maxFileSize)}.`,
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      setTitle(file.name.replace(".pdf", ""))
    }
  }, [maxFileSize, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"]
    },
    multiple: false,
    maxSize: maxFileSize,
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("title", title)
    formData.append("description", description)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      await uploadMutation.mutateAsync(formData)
      setUploadProgress(100)
    } finally {
      clearInterval(progressInterval)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setTitle("")
    setDescription("")
    setUploadProgress(0)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* File Drop Zone */}
      {!selectedFile && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-lg font-medium">Drop your PDF here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drag & drop your PDF here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: {formatBytes(maxFileSize)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected File & Upload Form */}
      {selectedFile && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={uploadMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Progress */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Form */}
            {!uploadMutation.isPending && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter document description"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!title.trim() || uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload PDF
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={removeFile}
                    disabled={uploadMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Success State */}
            {uploadMutation.isSuccess && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Upload completed successfully!</span>
              </div>
            )}

            {/* Error State */}
            {uploadMutation.isError && (
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Upload failed. Please try again.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Tips */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Upload Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Only PDF files are supported</li>
            <li>• Maximum file size: {formatBytes(maxFileSize)}</li>
            <li>• Files are automatically processed for text extraction</li>
            <li>• Thumbnails are generated for quick preview</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
