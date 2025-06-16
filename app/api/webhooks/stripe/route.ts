import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get the customer to find the user
  const customer = await stripe.customers.retrieve(customerId)
  if (!customer || customer.deleted) {
    throw new Error('Customer not found')
  }

  const email = customer.email
  if (!email) {
    throw new Error('Customer email not found')
  }

  // Find the user by email
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    throw new Error('User profile not found')
  }

  // Determine the subscription tier based on the price ID
  const priceId = subscription.items.data[0]?.price.id
  let subscriptionTier = 'free'
  
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    subscriptionTier = 'pro'
  } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    subscriptionTier = 'enterprise'
  }

  // Update or create subscription record
  const { error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      plan_id: priceId || 'free',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_subscription_id'
    })

  if (subscriptionError) {
    throw subscriptionError
  }

  // Update user profile with new subscription tier
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: subscriptionTier,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)

  if (updateError) {
    throw updateError
  }

  console.log(`Subscription updated for user ${profile.id}: ${subscriptionTier}`)
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    throw error
  }

  // Update user profile to free tier
  const { data: subscriptionData } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (subscriptionData) {
    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.user_id)
  }

  console.log(`Subscription canceled: ${subscription.id}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (subscriptionId) {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      throw error
    }
  }

  console.log(`Payment succeeded for invoice: ${invoice.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (subscriptionId) {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      throw error
    }
  }

  console.log(`Payment failed for invoice: ${invoice.id}`)
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // This is mainly for logging purposes
  // The actual customer-user relationship is established during subscription creation
  console.log(`Customer created: ${customer.id} - ${customer.email}`)
}
