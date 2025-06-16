"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createSupabaseClient } from "@/lib/supabase"
import { copyToClipboard } from "@/lib/utils"
import { 
  Share2, 
  Copy, 
  Mail, 
  Link, 
  Users, 
  Eye, 
  Edit, 
  MessageSquare,
  Calendar,
  Lock,
  Globe,
  Trash2
} from "lucide-react"

interface ShareDialogProps {
  documentId: string
  documentTitle: string
  children: React.ReactNode
}

export function ShareDialog({ documentId, documentTitle, children }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [permission, setPermission] = useState<"view" | "comment" | "edit">("view")
  const [expiresAt, setExpiresAt] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [publicPassword, setPublicPassword] = useState("")
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createSupabaseClient()

  // Fetch existing shares
  const { data: shares } = useQuery({
    queryKey: ["document-shares", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_shares")
        .select(`
          *,
          profiles(full_name, email, avatar_url)
        `)
        .eq("document_id", documentId)
      
      if (error) throw error
      return data
    },
    enabled: open,
  })

  // Fetch public links
  const { data: publicLinks } = useQuery({
    queryKey: ["public-links", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_links")
        .select("*")
        .eq("document_id", documentId)
      
      if (error) throw error
      return data
    },
    enabled: open,
  })

  // Share with user mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      // First, find user by email
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single()

      if (userError || !user) {
        throw new Error("User not found with this email address")
      }

      // Create share record
      const { error } = await supabase
        .from("document_shares")
        .insert({
          document_id: documentId,
          shared_with: user.id,
          permission_level: permission,
          expires_at: expiresAt || null,
        })

      if (error) throw error

      // TODO: Send email notification
      return user
    },
    onSuccess: () => {
      toast({
        title: "Document shared",
        description: `Document shared with ${email}`,
      })
      setEmail("")
      setMessage("")
      queryClient.invalidateQueries({ queryKey: ["document-shares", documentId] })
    },
    onError: (error: Error) => {
      toast({
        title: "Share failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Create public link mutation
  const createPublicLinkMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("public_links")
        .insert({
          document_id: documentId,
          permission_level: permission,
          expires_at: expiresAt || null,
          password_hash: publicPassword ? await hashPassword(publicPassword) : null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Public link created",
        description: "Anyone with the link can access this document",
      })
      queryClient.invalidateQueries({ queryKey: ["public-links", documentId] })
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create public link",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Remove share mutation
  const removeShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from("document_shares")
        .delete()
        .eq("id", shareId)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Access removed",
        description: "User access has been revoked",
      })
      queryClient.invalidateQueries({ queryKey: ["document-shares", documentId] })
    },
  })

  const handleShare = () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }
    shareMutation.mutate()
  }

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/shared/${token}`
    try {
      await copyToClipboard(link)
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case "view": return <Eye className="h-4 w-4" />
      case "comment": return <MessageSquare className="h-4 w-4" />
      case "edit": return <Edit className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case "view": return "secondary"
      case "comment": return "outline"
      case "edit": return "default"
      default: return "secondary"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share "{documentTitle}"</span>
          </DialogTitle>
          <DialogDescription>
            Share this document with others or create a public link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with specific users */}
          <div className="space-y-4">
            <h3 className="font-medium">Share with people</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Permission</Label>
                <Select value={permission} onValueChange={(value: any) => setPermission(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>View only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="comment">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Can comment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center space-x-2">
                        <Edit className="h-4 w-4" />
                        <span>Can edit</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message for the recipient"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires (optional)</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleShare}
              disabled={shareMutation.isPending}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {shareMutation.isPending ? "Sharing..." : "Share"}
            </Button>
          </div>

          {/* Current shares */}
          {shares && shares.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">People with access</h3>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={share.profiles?.avatar_url} />
                        <AvatarFallback>
                          {share.profiles?.full_name?.charAt(0) || share.profiles?.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{share.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{share.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPermissionColor(share.permission_level) as any}>
                        {getPermissionIcon(share.permission_level)}
                        <span className="ml-1 capitalize">{share.permission_level}</span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShareMutation.mutate(share.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Public access</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => createPublicLinkMutation.mutate()}
                disabled={createPublicLinkMutation.isPending}
              >
                <Link className="mr-2 h-4 w-4" />
                Create Link
              </Button>
            </div>

            {publicLinks && publicLinks.length > 0 && (
              <div className="space-y-2">
                {publicLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Public link</p>
                        <p className="text-sm text-muted-foreground">
                          Anyone with the link can {link.permission_level}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {link.password_hash && <Lock className="h-4 w-4 text-muted-foreground" />}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simple password hashing (in production, use proper server-side hashing)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
