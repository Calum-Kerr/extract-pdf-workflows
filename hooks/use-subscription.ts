"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/components/auth-provider"
import { createSupabaseClient } from "@/lib/supabase"
import { SUBSCRIPTION_PLANS } from "@/lib/stripe"

export interface SubscriptionLimits {
  maxFileSize: number
  storageLimit: number
  monthlyUploads: number
  apiCalls: number
  collaborators: number
  features: {
    advancedPdf: boolean
    realTimeCollaboration: boolean
    digitalSignatures: boolean
    apiAccess: boolean
    prioritySupport: boolean
    customBranding: boolean
    sso: boolean
    auditLogs: boolean
  }
}

export function useSubscription() {
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  // Fetch user profile and subscription data
  const {
    data: subscriptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscription-data", user?.id],
    queryFn: async () => {
      if (!user) return null

      // Get profile with subscription tier
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError

      // Get active subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      // Get current month usage
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: usage, error: usageError } = await supabase
        .from("usage_analytics")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString())

      if (usageError) throw usageError

      return {
        profile,
        subscription: subscriptionError ? null : subscription,
        usage: usage || [],
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Calculate subscription limits and features
  const getSubscriptionLimits = (): SubscriptionLimits => {
    const tier = subscriptionData?.profile?.subscription_tier || "free"
    
    switch (tier) {
      case "pro":
        return {
          maxFileSize: 100 * 1024 * 1024, // 100MB
          storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
          monthlyUploads: 1000,
          apiCalls: 10000,
          collaborators: 10,
          features: {
            advancedPdf: true,
            realTimeCollaboration: true,
            digitalSignatures: true,
            apiAccess: true,
            prioritySupport: true,
            customBranding: false,
            sso: false,
            auditLogs: false,
          },
        }
      
      case "enterprise":
        return {
          maxFileSize: 1024 * 1024 * 1024, // 1GB
          storageLimit: -1, // Unlimited
          monthlyUploads: -1, // Unlimited
          apiCalls: -1, // Unlimited
          collaborators: -1, // Unlimited
          features: {
            advancedPdf: true,
            realTimeCollaboration: true,
            digitalSignatures: true,
            apiAccess: true,
            prioritySupport: true,
            customBranding: true,
            sso: true,
            auditLogs: true,
          },
        }
      
      default: // free
        return {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          storageLimit: 100 * 1024 * 1024, // 100MB
          monthlyUploads: 50,
          apiCalls: 100,
          collaborators: 0,
          features: {
            advancedPdf: false,
            realTimeCollaboration: false,
            digitalSignatures: false,
            apiAccess: false,
            prioritySupport: false,
            customBranding: false,
            sso: false,
            auditLogs: false,
          },
        }
    }
  }

  // Calculate current usage
  const getCurrentUsage = () => {
    if (!subscriptionData) return null

    const uploads = subscriptionData.usage.filter(u => u.action_type === "document_upload").length
    const apiCalls = subscriptionData.usage.filter(u => u.action_type === "api_call").length

    return {
      storageUsed: subscriptionData.profile.storage_used || 0,
      monthlyUploads: uploads,
      apiCalls: apiCalls,
    }
  }

  // Check if user can perform an action
  const canPerformAction = (action: string, amount = 1): boolean => {
    if (!subscriptionData) return false

    const limits = getSubscriptionLimits()
    const usage = getCurrentUsage()

    if (!usage) return false

    switch (action) {
      case "upload":
        if (limits.monthlyUploads === -1) return true
        return usage.monthlyUploads + amount <= limits.monthlyUploads

      case "api_call":
        if (limits.apiCalls === -1) return true
        return usage.apiCalls + amount <= limits.apiCalls

      case "storage":
        if (limits.storageLimit === -1) return true
        return usage.storageUsed + amount <= limits.storageLimit

      default:
        return true
    }
  }

  // Check if user has access to a feature
  const hasFeature = (feature: keyof SubscriptionLimits["features"]): boolean => {
    const limits = getSubscriptionLimits()
    return limits.features[feature]
  }

  // Get upgrade suggestions
  const getUpgradeSuggestion = () => {
    const tier = subscriptionData?.profile?.subscription_tier || "free"
    
    if (tier === "free") {
      return {
        suggestedPlan: "pro",
        reason: "Unlock advanced features and increased limits",
        benefits: [
          "100MB file uploads",
          "10GB storage",
          "Real-time collaboration",
          "Digital signatures",
          "API access"
        ]
      }
    }
    
    if (tier === "pro") {
      return {
        suggestedPlan: "enterprise",
        reason: "Scale your business with unlimited resources",
        benefits: [
          "Unlimited storage",
          "Unlimited uploads",
          "Custom branding",
          "SSO integration",
          "Audit logs"
        ]
      }
    }

    return null
  }

  return {
    // Data
    profile: subscriptionData?.profile || null,
    subscription: subscriptionData?.subscription || null,
    usage: getCurrentUsage(),
    limits: getSubscriptionLimits(),
    
    // Status
    isLoading,
    error,
    isSubscribed: !!subscriptionData?.subscription,
    tier: subscriptionData?.profile?.subscription_tier || "free",
    
    // Utilities
    canPerformAction,
    hasFeature,
    getUpgradeSuggestion,
    
    // Plan info
    currentPlan: SUBSCRIPTION_PLANS[subscriptionData?.profile?.subscription_tier as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free,
    allPlans: SUBSCRIPTION_PLANS,
  }
}

// Hook for checking specific limits
export function useSubscriptionLimits() {
  const { limits, usage, canPerformAction } = useSubscription()

  return {
    limits,
    usage,
    canUpload: (fileSize: number) => canPerformAction("upload") && canPerformAction("storage", fileSize),
    canMakeApiCall: () => canPerformAction("api_call"),
    storagePercentage: limits.storageLimit === -1 ? 0 : Math.round(((usage?.storageUsed || 0) / limits.storageLimit) * 100),
    uploadsPercentage: limits.monthlyUploads === -1 ? 0 : Math.round(((usage?.monthlyUploads || 0) / limits.monthlyUploads) * 100),
    apiCallsPercentage: limits.apiCalls === -1 ? 0 : Math.round(((usage?.apiCalls || 0) / limits.apiCalls) * 100),
  }
}

// Hook for feature flags
export function useFeatureFlags() {
  const { hasFeature } = useSubscription()

  return {
    hasAdvancedPdf: hasFeature("advancedPdf"),
    hasRealTimeCollaboration: hasFeature("realTimeCollaboration"),
    hasDigitalSignatures: hasFeature("digitalSignatures"),
    hasApiAccess: hasFeature("apiAccess"),
    hasPrioritySupport: hasFeature("prioritySupport"),
    hasCustomBranding: hasFeature("customBranding"),
    hasSSO: hasFeature("sso"),
    hasAuditLogs: hasFeature("auditLogs"),
  }
}
