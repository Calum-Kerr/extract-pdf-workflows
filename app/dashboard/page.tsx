"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Upload, 
  Users, 
  TrendingUp,
  Plus,
  Clock,
  Star
} from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { createSupabaseClient } from "@/lib/supabase"
import { formatBytes, formatDate } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  // Fetch user profile and stats
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

  // Fetch recent documents
  const { data: recentDocuments } = useQuery({
    queryKey: ["recent-documents", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // Fetch document stats
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const [documentsResult, sharedResult, processingResult] = await Promise.all([
        supabase
          .from("documents")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
        supabase
          .from("document_shares")
          .select("id", { count: "exact" })
          .eq("shared_with", user.id),
        supabase
          .from("processing_jobs")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "processing")
      ])

      return {
        totalDocuments: documentsResult.count || 0,
        sharedDocuments: sharedResult.count || 0,
        processingJobs: processingResult.count || 0,
      }
    },
    enabled: !!user,
  })

  const storageUsedPercentage = profile 
    ? Math.round((profile.storage_used / profile.storage_limit) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.user_metadata?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your documents today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={profile?.subscription_tier === "free" ? "secondary" : "default"}>
            {profile?.subscription_tier?.toUpperCase() || "FREE"} Plan
          </Badge>
          <Button asChild>
            <Link href="/dashboard/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload PDF
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Your PDF collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared with Me</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sharedDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Collaborative documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processingJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Jobs in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageUsedPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(profile?.storage_used || 0)} of {formatBytes(profile?.storage_limit || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>
              Monitor your storage consumption
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Used Storage</span>
                <span>{formatBytes(profile?.storage_used || 0)}</span>
              </div>
              <Progress value={storageUsedPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{formatBytes(profile?.storage_limit || 0)}</span>
              </div>
            </div>
            
            {storageUsedPercentage > 80 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You're running low on storage space. Consider upgrading your plan.
                </p>
                <Button size="sm" className="mt-2" asChild>
                  <Link href="/dashboard/billing">Upgrade Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              Your recently accessed PDFs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentDocuments && recentDocuments.length > 0 ? (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.updated_at)} • {formatBytes(doc.file_size)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.page_count} pages
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <Link href="/dashboard/documents">View All Documents</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No documents yet. Upload your first PDF to get started.
                </p>
                <Button asChild>
                  <Link href="/dashboard/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload PDF
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
              <Link href="/dashboard/upload">
                <Upload className="h-8 w-8" />
                <span>Upload PDF</span>
                <span className="text-xs text-muted-foreground">Add new documents</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
              <Link href="/dashboard/documents">
                <FileText className="h-8 w-8" />
                <span>Browse Documents</span>
                <span className="text-xs text-muted-foreground">View your PDFs</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
              <Link href="/dashboard/shared">
                <Users className="h-8 w-8" />
                <span>Shared Documents</span>
                <span className="text-xs text-muted-foreground">Collaborate with others</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
