import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planType = session.metadata?.planType as PlanType

        if (userId && planType) {
          const now = new Date()
          const subscriptionEndDate = new Date(now)

          if (planType === PlanType.PREMIUM_MONTHLY) {
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
          } else if (planType === PlanType.PREMIUM_YEARLY) {
            subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
          }

          await prisma.users.update({
            where: { id: userId },
            data: {
              plan_type: planType,
              subscription_start_date: now,
              subscription_end_date: subscriptionEndDate,
            },
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const planType = subscription.metadata?.planType as PlanType

        if (userId && planType) {
          const now = new Date()
          const subscriptionEndDate = new Date(subscription.current_period_end * 1000)

          await prisma.users.update({
            where: {
              stripe_customer_id: subscription.customer as string,
            },
            data: {
              plan_type: planType,
              subscription_start_date: now,
              subscription_end_date: subscriptionEndDate,
              stripe_subscription_id: subscription.id,
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          await prisma.users.update({
            where: { id: userId },
            data: {
              plan_type: PlanType.FREE,
              subscription_start_date: null,
              subscription_end_date: null,
              stripe_subscription_id: null,
            },
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId
          const planType = subscription.metadata?.planType as PlanType

          if (userId && planType) {
            const subscriptionEndDate = new Date(subscription.current_period_end * 1000)

            await prisma.users.update({
              where: { id: userId },
              data: {
                subscription_end_date: subscriptionEndDate,
              },
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId

          if (userId) {
            // 支払い失敗時は通知を送る（将来的に実装）
            console.log(`Payment failed for user ${userId}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
