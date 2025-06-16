"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseClient } from "@/lib/supabase"
import { formatDate, formatBytes } from "@/lib/utils"
import { 
  History, 
  Download, 
  RotateCcw, 
  Eye, 
  FileText,
  Clock,
  User,
  GitBranch
} from "lucide-react"

interface VersionHistoryProps {
  documentId: string
  currentVersion: number
  onVersionRestore?: (version: number) => void
  children: React.ReactNode
}

export function VersionHistory({ 
  documentId, 
  currentVersion, 
  onVersionRestore,
  children 
}: VersionHistoryProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createSupabaseClient()

  // Fetch version history
  const { data: versions, isLoading } = useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select(`
          *,
          profiles(full_name, avatar_url)
        `)
        .eq("document_id", documentId)
        .order("version_number", { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: open,
  })

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (versionNumber: number) => {
      const { error } = await supabase.rpc("restore_document_version", {
        p_document_id: documentId,
        p_version_number: versionNumber
      })

      if (error) throw error
      return versionNumber
    },
    onSuccess: (versionNumber) => {
      toast({
        title: "Version restored",
        description: `Document restored to version ${versionNumber}`,
      })
      queryClient.invalidateQueries({ queryKey: ["document-versions", documentId] })
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      onVersionRestore?.(versionNumber)
    },
    onError: (error: Error) => {
      toast({
        title: "Restore failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Download version mutation
  const downloadVersionMutation = useMutation({
    mutationFn: async (version: any) => {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(version.file_path)

      if (error) throw error
      return { blob: data, version }
    },
    onSuccess: ({ blob, version }) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${version.title}-v${version.version_number}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Download started",
        description: `Version ${version.version_number} is downloading`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "created": return "default"
      case "edited": return "secondary"
      case "annotated": return "outline"
      case "shared": return "secondary"
      default: return "outline"
    }
  }

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case "created": return <FileText className="h-3 w-3" />
      case "edited": return <GitBranch className="h-3 w-3" />
      case "annotated": return <Eye className="h-3 w-3" />
      case "shared": return <User className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Version History</span>
          </DialogTitle>
          <DialogDescription>
            View and manage document versions and changes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : versions && versions.length > 0 ? (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <Card key={version.id} className={version.version_number === currentVersion ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={version.profiles?.avatar_url} />
                          <AvatarFallback>
                            {version.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              Version {version.version_number}
                            </span>
                            {version.version_number === currentVersion && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                            <Badge 
                              variant={getChangeTypeColor(version.change_type) as any}
                              className="text-xs"
                            >
                              {getChangeTypeIcon(version.change_type)}
                              <span className="ml-1 capitalize">{version.change_type}</span>
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {version.change_description || "No description"}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                            <span>{version.profiles?.full_name || "Unknown user"}</span>
                            <span>{formatDate(version.created_at)}</span>
                            <span>{formatBytes(version.file_size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadVersionMutation.mutate(version)}
                          disabled={downloadVersionMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {version.version_number !== currentVersion && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreVersionMutation.mutate(version.version_number)}
                            disabled={restoreVersionMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Version comparison indicator */}
                    {index < versions.length - 1 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-muted rounded-full mr-2"></div>
                          <span>
                            {version.changes_summary || "Changes from previous version"}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No version history</h3>
                <p className="text-sm text-muted-foreground">
                  Version history will appear here as you make changes to the document.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Version statistics */}
        {versions && versions.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{versions.length}</div>
                <div className="text-xs text-muted-foreground">Total Versions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {versions.filter(v => v.change_type === "edited").length}
                </div>
                <div className="text-xs text-muted-foreground">Edits</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(versions.map(v => v.created_by)).size}
                </div>
                <div className="text-xs text-muted-foreground">Contributors</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
