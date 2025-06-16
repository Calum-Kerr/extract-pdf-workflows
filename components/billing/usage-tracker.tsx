"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSubscriptionLimits } from "@/hooks/use-subscription"
import { formatBytes } from "@/lib/utils"
import { 
  HardDrive, 
  Upload, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  Crown
} from "lucide-react"
import Link from "next/link"

interface UsageTrackerProps {
  showUpgradePrompt?: boolean
  className?: string
}

export function UsageTracker({ showUpgradePrompt = true, className }: UsageTrackerProps) {
  const {
    limits,
    usage,
    storagePercentage,
    uploadsPercentage,
    apiCallsPercentage,
  } = useSubscriptionLimits()

  if (!usage) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const isNearLimit = storagePercentage >= 80 || uploadsPercentage >= 80 || apiCallsPercentage >= 80

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Usage Overview</span>
          </CardTitle>
          <CardDescription>
            Track your current usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Storage</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatBytes(usage.storageUsed)} / {limits.storageLimit === -1 ? "Unlimited" : formatBytes(limits.storageLimit)}
              </div>
            </div>
            {limits.storageLimit !== -1 && (
              <div className="space-y-1">
                <Progress value={storagePercentage} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span className={getUsageColor(storagePercentage)}>
                    {storagePercentage}% used
                  </span>
                  {storagePercentage >= 90 && (
                    <span className="text-red-600 font-medium">
                      Almost full!
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Uploads */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Monthly Uploads</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {usage.monthlyUploads} / {limits.monthlyUploads === -1 ? "Unlimited" : limits.monthlyUploads}
              </div>
            </div>
            {limits.monthlyUploads !== -1 && (
              <div className="space-y-1">
                <Progress value={uploadsPercentage} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span className={getUsageColor(uploadsPercentage)}>
                    {uploadsPercentage}% used
                  </span>
                  {uploadsPercentage >= 90 && (
                    <span className="text-red-600 font-medium">
                      Limit approaching!
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* API Calls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">API Calls</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {usage.apiCalls} / {limits.apiCalls === -1 ? "Unlimited" : limits.apiCalls}
              </div>
            </div>
            {limits.apiCalls !== -1 && (
              <div className="space-y-1">
                <Progress value={apiCallsPercentage} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span className={getUsageColor(apiCallsPercentage)}>
                    {apiCallsPercentage}% used
                  </span>
                  {apiCallsPercentage >= 90 && (
                    <span className="text-red-600 font-medium">
                      Limit approaching!
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upgrade Prompt */}
          {showUpgradePrompt && isNearLimit && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Approaching Usage Limits
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    You're close to your plan limits. Upgrade to continue using all features without interruption.
                  </p>
                  <Button size="sm" className="mt-3" asChild>
                    <Link href="/dashboard/billing">
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade Plan
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Usage Tips */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Usage resets monthly on your billing cycle</p>
            <p>• Deleted files don't immediately free up storage quota</p>
            <p>• API calls include both manual and automated requests</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Compact version for dashboard widgets
export function UsageWidget({ className }: { className?: string }) {
  const { storagePercentage, uploadsPercentage } = useSubscriptionLimits()

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Storage</span>
            <span>{storagePercentage}%</span>
          </div>
          <Progress value={storagePercentage} className="h-1" />
          
          <div className="flex items-center justify-between text-sm">
            <span>Uploads</span>
            <span>{uploadsPercentage}%</span>
          </div>
          <Progress value={uploadsPercentage} className="h-1" />
        </div>
      </CardContent>
    </Card>
  )
}
