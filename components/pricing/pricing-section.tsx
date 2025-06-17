"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/stripe"
import { 
  Check, 
  Zap, 
  Crown, 
  Building,
  Star,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PricingSectionProps {
  showAnnualToggle?: boolean
  highlightPlan?: string
  className?: string
}

export function PricingSection({ 
  showAnnualToggle = true, 
  highlightPlan = "pro",
  className 
}: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "pro": return <Zap className="h-6 w-6" />
      case "enterprise": return <Building className="h-6 w-6" />
      default: return <Crown className="h-6 w-6" />
    }
  }

  const getAnnualPrice = (monthlyPrice: number) => {
    return monthlyPrice * 12 * 0.8 // 20% discount for annual
  }

  const getDisplayPrice = (planId: string, monthlyPrice: number) => {
    if (planId === "free") return formatPrice(0)
    
    if (isAnnual) {
      const annualPrice = getAnnualPrice(monthlyPrice)
      return formatPrice(Math.round(annualPrice / 12))
    }
    
    return formatPrice(monthlyPrice)
  }

  const plans = [
    {
      ...SUBSCRIPTION_PLANS.free,
      popular: false,
      cta: "Get Started",
      ctaVariant: "outline" as const,
    },
    {
      ...SUBSCRIPTION_PLANS.pro,
      popular: true,
      cta: "Start Free Trial",
      ctaVariant: "default" as const,
    },
    {
      ...SUBSCRIPTION_PLANS.enterprise,
      popular: false,
      cta: "Contact Sales",
      ctaVariant: "outline" as const,
    },
  ]

  return (
    <section className={cn("py-16", className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your PDF manipulation needs. 
            Start free and upgrade as you grow.
          </p>

          {/* Annual/Monthly Toggle */}
          {showAnnualToggle && (
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Label htmlFor="annual-toggle" className={!isAnnual ? "font-medium" : ""}>
                Monthly
              </Label>
              <Switch
                id="annual-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="annual-toggle" className={isAnnual ? "font-medium" : ""}>
                Annual
                <Badge variant="secondary" className="ml-2">
                  Save 20%
                </Badge>
              </Label>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={cn(
                "relative",
                plan.id === highlightPlan && "border-primary shadow-lg scale-105",
                plan.popular && "border-primary"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-6">
                  <div className="text-4xl font-bold">
                    {getDisplayPrice(plan.id, plan.price)}
                    {plan.price > 0 && (
                      <span className="text-lg font-normal text-muted-foreground">
                        /{isAnnual ? "month" : "month"}
                      </span>
                    )}
                  </div>
                  {isAnnual && plan.price > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Billed annually ({formatPrice(getAnnualPrice(plan.price))}/year)
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button 
                  variant={plan.ctaVariant}
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link href={plan.id === "enterprise" ? "/contact" : `/signup?plan=${plan.id}`}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                {/* Additional Info */}
                {plan.id === "free" && (
                  <p className="text-xs text-center text-muted-foreground">
                    No credit card required
                  </p>
                )}
                {plan.id === "pro" && (
                  <p className="text-xs text-center text-muted-foreground">
                    14-day free trial included
                  </p>
                )}
                {plan.id === "enterprise" && (
                  <p className="text-xs text-center text-muted-foreground">
                    Custom pricing available
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">Frequently Asked Questions</h3>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto text-left">
            <div>
              <h4 className="font-medium mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. 
                Changes take effect immediately with prorated billing.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers 
                for enterprise customers.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Is there a free trial?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, Pro and Enterprise plans include a 14-day free trial. 
                No credit card required to start.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What happens to my data if I cancel?</h4>
              <p className="text-sm text-muted-foreground">
                Your data remains accessible for 30 days after cancellation. 
                You can export all your documents during this period.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-4">Need something custom?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Our Enterprise plan can be tailored to your specific needs with 
                custom integrations, dedicated support, and volume discounts.
              </p>
              <Button size="lg" asChild>
                <Link href="/contact">
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
