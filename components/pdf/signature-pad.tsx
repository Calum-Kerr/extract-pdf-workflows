"use client"

import { useRef, useState, useEffect } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  PenTool, 
  Type, 
  Upload, 
  Save, 
  Trash2, 
  Download,
  FileSignature
} from "lucide-react"

interface SignaturePadProps {
  onSignatureCreate: (signatureData: string, type: "draw" | "type" | "upload") => void
  onClose?: () => void
  className?: string
}

export function SignaturePad({ onSignatureCreate, onClose, className }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null)
  const [typedSignature, setTypedSignature] = useState("")
  const [signatureFont, setSignatureFont] = useState("cursive")
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("draw")
  const { toast } = useToast()

  const clearSignature = () => {
    signatureRef.current?.clear()
  }

  const saveDrawnSignature = () => {
    if (signatureRef.current?.isEmpty()) {
      toast({
        title: "Empty signature",
        description: "Please draw your signature first.",
        variant: "destructive",
      })
      return
    }

    const signatureData = signatureRef.current?.toDataURL()
    if (signatureData) {
      onSignatureCreate(signatureData, "draw")
      onClose?.()
    }
  }

  const saveTypedSignature = () => {
    if (!typedSignature.trim()) {
      toast({
        title: "Empty signature",
        description: "Please enter your signature text.",
        variant: "destructive",
      })
      return
    }

    // Create a canvas to render the typed signature
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 400
    canvas.height = 100
    
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = "black"
    ctx.font = `36px ${signatureFont}`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2)

    const signatureData = canvas.toDataURL()
    onSignatureCreate(signatureData, "type")
    onClose?.()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File too large",
        description: "Image must be less than 2MB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedSignature(result)
    }
    reader.readAsDataURL(file)
  }

  const saveUploadedSignature = () => {
    if (!uploadedSignature) {
      toast({
        title: "No signature uploaded",
        description: "Please upload a signature image first.",
        variant: "destructive",
      })
      return
    }

    onSignatureCreate(uploadedSignature, "upload")
    onClose?.()
  }

  const fonts = [
    { name: "Cursive", value: "cursive" },
    { name: "Serif", value: "serif" },
    { name: "Sans-serif", value: "sans-serif" },
    { name: "Monospace", value: "monospace" },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSignature className="h-5 w-5" />
          <span>Create Digital Signature</span>
        </CardTitle>
        <CardDescription>
          Create your digital signature using one of the methods below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="flex items-center space-x-2">
              <PenTool className="h-4 w-4" />
              <span>Draw</span>
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center space-x-2">
              <Type className="h-4 w-4" />
              <span>Type</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 400,
                  height: 200,
                  className: "signature-canvas border rounded"
                }}
                backgroundColor="white"
                penColor="black"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={clearSignature} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button onClick={saveDrawnSignature} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Signature
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-text">Signature Text</Label>
                <Input
                  id="signature-text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label>Font Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {fonts.map((font) => (
                    <Button
                      key={font.value}
                      variant={signatureFont === font.value ? "default" : "outline"}
                      onClick={() => setSignatureFont(font.value)}
                      className="justify-start"
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </Button>
                  ))}
                </div>
              </div>

              {typedSignature && (
                <div className="border rounded-lg p-4 bg-white text-center">
                  <div 
                    className="text-3xl"
                    style={{ fontFamily: signatureFont }}
                  >
                    {typedSignature}
                  </div>
                </div>
              )}

              <Button onClick={saveTypedSignature} size="sm" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Signature
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-upload">Upload Signature Image</Label>
                <Input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PNG, JPG, GIF. Max size: 2MB
                </p>
              </div>

              {uploadedSignature && (
                <div className="border rounded-lg p-4 bg-white text-center">
                  <img
                    src={uploadedSignature}
                    alt="Uploaded signature"
                    className="max-w-full max-h-32 mx-auto"
                  />
                </div>
              )}

              <Button 
                onClick={saveUploadedSignature} 
                size="sm" 
                className="w-full"
                disabled={!uploadedSignature}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Signature
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Dialog wrapper for the signature pad
export function SignatureDialog({ 
  children, 
  onSignatureCreate 
}: { 
  children: React.ReactNode
  onSignatureCreate: (signatureData: string, type: "draw" | "type" | "upload") => void
}) {
  const [open, setOpen] = useState(false)

  const handleSignatureCreate = (signatureData: string, type: "draw" | "type" | "upload") => {
    onSignatureCreate(signatureData, type)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Digital Signature</DialogTitle>
          <DialogDescription>
            Create your digital signature to sign documents
          </DialogDescription>
        </DialogHeader>
        <SignaturePad 
          onSignatureCreate={handleSignatureCreate}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
