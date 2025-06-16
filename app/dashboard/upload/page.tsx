"use client"

import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/pdf/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { createSupabaseClient } from "@/lib/supabase"
import { formatBytes } from "@/lib/utils"
import { Upload, FileText, Zap, Shield, Users } from "lucide-react"
import Link from "next/link"

export default function UploadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  // Fetch user profile for storage limits
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const handleUploadComplete = (document: any) => {
    router.push(`/dashboard/documents/${document.id}`)
  }

  const getMaxFileSize = () => {
    switch (profile?.subscription_tier) {
      case "pro":
        return 100 * 1024 * 1024 // 100MB
      case "enterprise":
        return 1024 * 1024 * 1024 // 1GB
      default:
        return 10 * 1024 * 1024 // 10MB for free tier
    }
  }

  const storageUsedPercentage = profile 
    ? Math.round((profile.storage_used / profile.storage_limit) * 100)
    : 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Upload PDF</h1>
        <p className="text-muted-foreground">
          Upload and process your PDF documents for editing and collaboration.
        </p>
      </div>

      {/* Storage Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Storage Usage</CardTitle>
              <CardDescription>
                {formatBytes(profile?.storage_used || 0)} of {formatBytes(profile?.storage_limit || 0)} used
              </CardDescription>
            </div>
            <Badge variant={profile?.subscription_tier === "free" ? "secondary" : "default"}>
              {profile?.subscription_tier?.toUpperCase() || "FREE"} Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Storage Used</span>
              <span>{storageUsedPercentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(storageUsedPercentage, 100)}%` }}
              />
            </div>
            {storageUsedPercentage > 80 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-600">Running low on storage</span>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/billing">Upgrade Plan</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Component */}
      <FileUpload
        onUploadComplete={handleUploadComplete}
        maxFileSize={getMaxFileSize()}
      />

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Fast Processing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your PDFs are processed instantly with automatic text extraction and thumbnail generation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Secure Storage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All files are encrypted and stored securely with enterprise-grade security measures.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Easy Sharing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Share documents with team members and collaborate in real-time with advanced permissions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Limits</CardTitle>
          <CardDescription>
            Current limits for your {profile?.subscription_tier || "free"} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Max File Size</p>
              <p className="text-2xl font-bold">{formatBytes(getMaxFileSize())}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Storage Limit</p>
              <p className="text-2xl font-bold">{formatBytes(profile?.storage_limit || 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Monthly Uploads</p>
              <p className="text-2xl font-bold">
                {profile?.subscription_tier === "free" ? "50" : 
                 profile?.subscription_tier === "pro" ? "1,000" : "Unlimited"}
              </p>
            </div>
          </div>
          
          {profile?.subscription_tier === "free" && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Need more storage?</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro for 10GB storage and larger file uploads.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/billing">Upgrade Now</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
