import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

// プランタイプとStripe Price IDのマッピング
// 実際のPrice IDはStripe Dashboardで作成したものを使用
export const STRIPE_PRICE_IDS = {
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_monthly_placeholder',
  PREMIUM_YEARLY: process.env.STRIPE_PRICE_ID_YEARLY || 'price_yearly_placeholder',
} as const
