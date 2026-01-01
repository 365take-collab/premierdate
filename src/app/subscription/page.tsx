'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'

interface UserPlan {
  planType: 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'
  subscriptionEndDate?: string | null
}

const PLANS = {
  FREE: {
    name: '無料プラン',
    price: 0,
    period: '',
    features: [
      'お気に入り: 3件まで',
      'レビュー投稿: 月5件まで',
      'デートコース提案: 1件まで',
    ],
  },
  PREMIUM_MONTHLY: {
    name: 'プレミアムプラン（月額）',
    price: 980,
    period: '月',
    features: [
      'お気に入り: 無制限',
      'レビュー投稿: 無制限',
      'デートコース提案: 無制限',
      'すべての機能が使い放題',
    ],
  },
  PREMIUM_YEARLY: {
    name: 'プレミアムプラン（年額）',
    price: 8800,
    period: '年',
    originalPrice: 11760, // 980円 × 12ヶ月
    discountRate: 25, // 約25%オフ
    features: [
      'お気に入り: 無制限',
      'レビュー投稿: 無制限',
      'デートコース提案: 無制限',
      'すべての機能が使い放題',
      '月額プランよりお得（約25%OFF）',
    ],
  },
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      setLoading(false)
      return
    }
    fetchUserPlan()
  }, [session, status])

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/user/plan')
      if (response.ok) {
        const data = await response.json()
        setUserPlan(data)
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
      setError('プラン情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planType: 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY') => {
    if (!session) {
      window.location.href = '/login'
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Stripe Checkout Sessionを作成
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout Sessionの作成に失敗しました')
      }

      // Stripe Checkoutにリダイレクト
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Checkout URLが取得できませんでした')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setError(error instanceof Error ? error.message : '決済処理の開始に失敗しました')
      setLoading(false)
    }
  }

  if (status === 'loading' || (loading && session)) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const currentPlanType = userPlan?.planType || 'FREE'
  const isPremium = currentPlanType === 'PREMIUM_MONTHLY' || currentPlanType === 'PREMIUM_YEARLY'

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">プラン選択</h1>

          {/* 現在のプラン表示 */}
          {session && userPlan && (
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">現在のプラン</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold mb-2">
                    {PLANS[currentPlanType].name}
                  </div>
                  {isPremium && userPlan.subscriptionEndDate && (
                    <div className="text-gray-400 text-sm">
                      有効期限: {new Date(userPlan.subscriptionEndDate).toLocaleDateString('ja-JP')}
                    </div>
                  )}
                </div>
                {isPremium && (
                  <div className="text-green-400 font-semibold">
                    アクティブ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ログインしていない場合のメッセージ */}
          {!session && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6 mb-8 text-center">
              <p className="text-blue-400 mb-4">
                プランを選択するにはログインが必要です
              </p>
              <Link
                href="/login"
                className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                ログインする
              </Link>
            </div>
          )}

          {/* プラン比較 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 月額プラン */}
            <div className={`bg-gray-900 rounded-lg p-8 border-2 ${
              currentPlanType === 'PREMIUM_MONTHLY' 
                ? 'border-white' 
                : 'border-gray-800'
            }`}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  {PLANS.PREMIUM_MONTHLY.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">¥{PLANS.PREMIUM_MONTHLY.price.toLocaleString()}</span>
                  <span className="text-gray-400">/{PLANS.PREMIUM_MONTHLY.period}</span>
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  7日間無料トライアル
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {PLANS.PREMIUM_MONTHLY.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {session && currentPlanType === 'PREMIUM_MONTHLY' ? (
                <div className="text-center py-3 bg-gray-800 rounded-lg text-gray-400">
                  現在のプラン
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!session) {
                      window.location.href = '/login?redirect=/subscription'
                      return
                    }
                    handleUpgrade('PREMIUM_MONTHLY')
                  }}
                  disabled={loading}
                  className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '処理中...' : 'このプランを選択'}
                </button>
              )}
            </div>

            {/* 年額プラン */}
            <div className={`bg-gray-900 rounded-lg p-8 border-2 ${
              currentPlanType === 'PREMIUM_YEARLY' 
                ? 'border-white' 
                : 'border-yellow-500/50'
            } relative`}>
              {currentPlanType !== 'PREMIUM_YEARLY' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                  お得
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  {PLANS.PREMIUM_YEARLY.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">¥{PLANS.PREMIUM_YEARLY.price.toLocaleString()}</span>
                  <span className="text-gray-400">/{PLANS.PREMIUM_YEARLY.period}</span>
                </div>
                {PLANS.PREMIUM_YEARLY.originalPrice && (
                  <div className="mb-4">
                    <span className="text-gray-500 line-through text-sm">
                      ¥{PLANS.PREMIUM_YEARLY.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-yellow-400 text-sm ml-2">
                      {PLANS.PREMIUM_YEARLY.discountRate}%OFF
                    </span>
                  </div>
                )}
                <div className="text-sm text-gray-400 mb-4">
                  7日間無料トライアル
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {PLANS.PREMIUM_YEARLY.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {session && currentPlanType === 'PREMIUM_YEARLY' ? (
                <div className="text-center py-3 bg-gray-800 rounded-lg text-gray-400">
                  現在のプラン
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!session) {
                      window.location.href = '/login?redirect=/subscription'
                      return
                    }
                    handleUpgrade('PREMIUM_YEARLY')
                  }}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '処理中...' : 'このプランを選択'}
                </button>
              )}
            </div>
          </div>

          {/* 無料プラン */}
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {PLANS.FREE.name}
                </h3>
                <ul className="space-y-2 text-gray-400">
                  {PLANS.FREE.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {session && currentPlanType === 'FREE' ? (
                <div className="text-gray-400 font-semibold">
                  現在のプラン
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  無料
                </div>
              )}
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* 注意事項 */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>※ 7日間無料トライアル後、自動的に課金が開始されます</p>
            <p className="mt-2">※ いつでもキャンセル可能です</p>
            <p className="mt-2">※ 決済はUtage経由で安全に処理されます</p>
          </div>
        </div>
      </main>
    </div>
  )
}



