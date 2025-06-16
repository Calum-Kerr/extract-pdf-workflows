import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Basic PDF operations',
    price: 0,
    priceId: null,
    features: [
      'Up to 100MB storage',
      'Basic PDF viewing',
      'Simple annotations',
      'PDF merge/split (up to 5 files)',
      'Community support'
    ],
    limits: {
      storageLimit: 100 * 1024 * 1024, // 100MB
      monthlyUploads: 50,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      collaborators: 0,
      apiCalls: 100
    }
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced PDF manipulation',
    price: 9.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Up to 10GB storage',
      'Advanced PDF editing',
      'OCR text extraction',
      'Digital signatures',
      'Form creation and filling',
      'Real-time collaboration',
      'Priority support',
      'API access'
    ],
    limits: {
      storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
      monthlyUploads: 1000,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      collaborators: 10,
      apiCalls: 10000
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited PDF processing',
    price: 49.99,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      'Unlimited storage',
      'All Pro features',
      'Advanced security',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Custom branding',
      'Advanced analytics'
    ],
    limits: {
      storageLimit: -1, // Unlimited
      monthlyUploads: -1, // Unlimited
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      collaborators: -1, // Unlimited
      apiCalls: -1 // Unlimited
    }
  }
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS

// Helper functions
export const createCheckoutSession = async (
  priceId: string,
  customerId?: string,
  metadata?: Record<string, string>
) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })

  return session
}

export const createPortalSession = async (customerId: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings`,
  })

  return session
}

export const createCustomer = async (email: string, name?: string) => {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      created_via: 'pdf_app',
    },
  })

  return customer
}

export const getCustomer = async (customerId: string) => {
  const customer = await stripe.customers.retrieve(customerId)
  return customer
}

export const getSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

export const cancelSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
  return subscription
}

export const reactivateSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
  return subscription
}

export const updateSubscription = async (
  subscriptionId: string,
  priceId: string
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  })

  return updatedSubscription
}

// Webhook helpers
export const constructWebhookEvent = (body: string, signature: string) => {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

// Usage tracking
export const recordUsage = async (
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
) => {
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: 'increment',
    }
  )

  return usageRecord
}

// Plan utilities
export const getPlanByPriceId = (priceId: string) => {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.priceId === priceId)
}

export const getPlanLimits = (planId: SubscriptionPlan) => {
  return SUBSCRIPTION_PLANS[planId].limits
}

export const canPerformAction = (
  planId: SubscriptionPlan,
  action: keyof typeof SUBSCRIPTION_PLANS.FREE.limits,
  currentUsage: number
) => {
  const limits = getPlanLimits(planId)
  const limit = limits[action]
  
  // -1 means unlimited
  if (limit === -1) return true
  
  return currentUsage < limit
}

// Price formatting
export const formatPrice = (price: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}
