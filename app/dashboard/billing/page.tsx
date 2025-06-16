"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation } from "@tanstack/react-query"
import { createSupabaseClient } from "@/lib/supabase"
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/stripe"
import { formatBytes, formatDate } from "@/lib/utils"
import { 
  CreditCard, 
  Check, 
  Zap, 
  Crown, 
  Building,
  Calendar,
  Download,
  ExternalLink,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"

export default function BillingPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState<string | null>(null)

  // Fetch user profile and subscription
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

  // Fetch subscription details
  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single()
      
      if (error && error.code !== "PGRST116") throw error
      return data
    },
    enabled: !!user,
  })

  // Fetch usage analytics
  const { data: usage } = useQuery({
    queryKey: ["usage-analytics", user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const { data, error } = await supabase
        .from("usage_analytics")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString())
      
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create checkout session")
      }

      const { url } = await response.json()
      return url
    },
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      })
      setLoading(null)
    },
  })

  // Create portal session mutation
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create portal session")
      }

      const { url } = await response.json()
      return url
    },
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: (error: Error) => {
      toast({
        title: "Portal access failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleUpgrade = (planId: string) => {
    setLoading(planId)
    checkoutMutation.mutate(planId)
  }

  const handleManageBilling = () => {
    portalMutation.mutate()
  }

  const currentPlan = profile?.subscription_tier || "free"
  const storageUsedPercentage = profile 
    ? Math.round((profile.storage_used / profile.storage_limit) * 100)
    : 0

  const monthlyUploads = usage?.filter(u => u.action_type === "document_upload").length || 0
  const apiCalls = usage?.filter(u => u.action_type === "api_call").length || 0

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "pro": return <Zap className="h-5 w-5" />
      case "enterprise": return <Building className="h-5 w-5" />
      default: return <Crown className="h-5 w-5" />
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                {getPlanIcon(currentPlan)}
                <span>{SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS].name} Plan</span>
              </CardTitle>
              <CardDescription>
                {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS].description}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatPrice(SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS].price)}
                {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS].price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                )}
              </div>
              {subscription && (
                <div className="text-sm text-muted-foreground">
                  {subscription.status === "active" ? "Active" : subscription.status}
                  {subscription.current_period_end && (
                    <span> until {formatDate(subscription.current_period_end)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Plan Features</h4>
              <ul className="space-y-1 text-sm">
                {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS].features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              {subscription && subscription.status === "active" && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={portalMutation.isPending}
                  className="w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
              )}
              {currentPlan === "free" && (
                <Button
                  onClick={() => handleUpgrade("pro")}
                  disabled={loading === "pro"}
                  className="w-full"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Used</span>
                <span>{formatBytes(profile?.storage_used || 0)}</span>
              </div>
              <Progress value={storageUsedPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{storageUsedPercentage}% used</span>
                <span>{formatBytes(profile?.storage_limit || 0)} total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{monthlyUploads}</div>
              <div className="text-xs text-muted-foreground">
                {currentPlan === "free" ? "50" : 
                 currentPlan === "pro" ? "1,000" : "Unlimited"} allowed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{apiCalls}</div>
              <div className="text-xs text-muted-foreground">
                {currentPlan === "free" ? "100" : 
                 currentPlan === "pro" ? "10,000" : "Unlimited"} allowed
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
            <Card 
              key={planId} 
              className={cn(
                "relative",
                planId === currentPlan && "border-primary",
                planId === "pro" && "border-primary shadow-lg"
              )}
            >
              {planId === "pro" && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center space-x-2">
                  {getPlanIcon(planId)}
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price)}
                  {plan.price > 0 && <span className="text-sm font-normal">/month</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {planId === currentPlan ? (
                  <Badge variant="outline" className="w-full justify-center py-2">
                    Current Plan
                  </Badge>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(planId)}
                    disabled={loading === planId}
                    className="w-full"
                    variant={planId === "pro" ? "default" : "outline"}
                  >
                    {loading === planId ? "Processing..." : 
                     planId === "free" ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View and download your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Access your complete billing history and invoices through the customer portal.
              </p>
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={portalMutation.isPending}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Billing History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Warnings */}
      {storageUsedPercentage > 80 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Storage Almost Full
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You're using {storageUsedPercentage}% of your storage. Consider upgrading your plan.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="#plans">Upgrade Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
