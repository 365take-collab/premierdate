import Stripe from 'stripe'

// Utageのみを使用する場合は、Stripeキーはオプション
// Stripeを使用する場合のみ環境変数を設定
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null

// プランタイプとStripe Price IDのマッピング
// 実際のPrice IDはStripe Dashboardで作成したものを使用
export const STRIPE_PRICE_IDS = {
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_monthly_placeholder',
  PREMIUM_YEARLY: process.env.STRIPE_PRICE_ID_YEARLY || 'price_yearly_placeholder',
} as const
