'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import Header from '@/components/Header'
import ReviewForm from '@/components/ReviewForm'
import FavoriteButton from '@/components/FavoriteButton'
import DateCourseForm from '@/components/DateCourseForm'

interface Restaurant {
  id: string
  name: string
  area: string
  address: string
  price_range: string
  atmosphere: string | null
  customer_segment: string | null
  side_by_side_seats: boolean
  hotel_distance_walk: number | null
  hotel_distance_train: number | null
  description: string | null
  image_url: string | null
  website_url: string | null
  reservation_url: string | null
  restaurant_purposes: Array<{
    purpose_categories: {
      name: string
    }
  }>
  reviews: Array<{
    id: string
    rating: number
    date_appropriateness: number
    review_text: string
    created_at: string
  }>
  avgRating: number
  avgDateAppropriateness: number
  isPremiumUser?: boolean
  _count: {
    reviews: number
    favorites: number
  }
}

const PRICE_RANGES = [
  { value: 'UNDER_3000', label: '3000円以下' },
  { value: 'BETWEEN_3000_5000', label: '3000-5000円' },
  { value: 'BETWEEN_5000_10000', label: '5000-10000円' },
  { value: 'OVER_10000', label: '10000円以上' },
]

export default function RestaurantDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchRestaurant(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (session) {
      fetchUserPlan()
    } else {
      setUserPlan('FREE')
    }
  }, [session])

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/user/plan')
      if (response.ok) {
        const data = await response.json()
        setUserPlan(data.planType || 'FREE')
      } else {
        setUserPlan('FREE')
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
      setUserPlan('FREE')
    }
  }

  const fetchRestaurant = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/restaurants/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('店舗が見つかりませんでした')
        }
        throw new Error('店舗データの取得に失敗しました')
      }
      const data = await response.json()
      setRestaurant(data)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getPriceRangeLabel = (priceRange: string) => {
    const found = PRICE_RANGES.find((p) => p.value === priceRange)
    return found?.label || priceRange
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-400">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <ErrorMessage
            message={error || '店舗が見つかりませんでした'}
            onRetry={() => params.id && fetchRestaurant(params.id as string)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <div className="text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-white">ホーム</Link>
          <span className="mx-2">/</span>
          <Link href="/search" className="hover:text-white">店舗を探す</Link>
          <span className="mx-2">/</span>
          <span>{restaurant.name}</span>
        </div>

        {/* 店舗基本情報 */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <FavoriteButton restaurantId={restaurant.id} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {/* エリア・価格帯・住所・説明文（無料でも表示 - 食べログが無料で提供している情報） */}
              <div className="text-gray-400 mb-2">
                <div>エリア: {restaurant.area}</div>
                <div>価格帯: {getPriceRangeLabel(restaurant.price_range)}</div>
                <div>住所: {restaurant.address}</div>
              </div>
              {restaurant.description && (
                <p className="text-gray-300 mt-4">{restaurant.description}</p>
              )}
            </div>
            <div>
              {/* デート特化情報 */}
              {(userPlan === 'PREMIUM_MONTHLY' || userPlan === 'PREMIUM_YEARLY' || restaurant.isPremiumUser) ? (
                <div className="bg-gray-800 rounded p-4">
                  <h3 className="font-semibold mb-3">デート特化情報</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">横並び席:</span>{' '}
                      <span>{restaurant.side_by_side_seats ? 'あり' : 'なし'}</span>
                    </div>
                    {restaurant.customer_segment && (
                      <div>
                        <span className="text-gray-400">客層:</span>{' '}
                        <span>{restaurant.customer_segment}</span>
                      </div>
                    )}
                    {restaurant.atmosphere && (
                      <div>
                        <span className="text-gray-400">雰囲気:</span>{' '}
                        <span>{restaurant.atmosphere}</span>
                      </div>
                    )}
                    {restaurant.hotel_distance_walk && (
                      <div>
                        <span className="text-gray-400">ホテルまでの距離:</span>{' '}
                        <span>徒歩{restaurant.hotel_distance_walk}分</span>
                        {restaurant.hotel_distance_train && (
                          <span> / 電車{restaurant.hotel_distance_train}分</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded p-4 border-2 border-dashed border-gray-700">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🔒</div>
                    <h3 className="font-semibold mb-2 text-white">デート特化情報</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      横並び席・客層・雰囲気・ホテルまでの距離などの詳細情報を見るには
                    </p>
                    <Link
                      href="/subscription"
                      className="inline-block bg-[#d70035] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#b8002e] transition"
                    >
                      プレミアムプランにアップグレード
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 用途タグ（無料でも表示 - 食べログが無料で提供しているカテゴリ情報） */}
          {restaurant.restaurant_purposes && restaurant.restaurant_purposes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">おすすめの用途</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.restaurant_purposes.map((rp, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-800 px-3 py-1 rounded text-sm"
                  >
                    {rp.purpose_categories.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* アクション */}
          <div className="mt-6 flex gap-4">
            {restaurant.reservation_url && (
              <a
                href={restaurant.reservation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                予約する
              </a>
            )}
            {restaurant.website_url && (
              <a
                href={restaurant.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-900 transition"
              >
                公式サイト
              </a>
            )}
          </div>
        </div>

        {/* デートコース提案フォーム */}
        <div className="mb-8">
          <DateCourseForm
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
          />
        </div>

        {/* レビュー投稿フォーム */}
        <div className="mb-8">
          <ReviewForm
            restaurantId={restaurant.id}
            onReviewSubmitted={() => {
              if (params.id) {
                fetchRestaurant(params.id as string)
              }
            }}
          />
        </div>

        {/* レビューセクション */}
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">レビュー</h2>
            {/* レビュー数は無料でも表示（食べログが無料で提供している情報） */}
            <div className="text-gray-400">
              レビュー数: {restaurant._count.reviews}件
              {(userPlan === 'PREMIUM_MONTHLY' || userPlan === 'PREMIUM_YEARLY' || restaurant.isPremiumUser) && (
                <>
                  <br />
                  平均評価: {restaurant.avgRating.toFixed(1)} / 5.0
                  <br />
                  デート適性: {restaurant.avgDateAppropriateness.toFixed(1)} / 5.0
                </>
              )}
            </div>
          </div>

          {/* レビュー内容は有料ユーザーのみ */}
          {(userPlan === 'PREMIUM_MONTHLY' || userPlan === 'PREMIUM_YEARLY' || restaurant.isPremiumUser) ? (
            restaurant.reviews.length === 0 ? (
              <p className="text-gray-400">レビューがまだありません</p>
            ) : (
              <div className="space-y-6">
                {restaurant.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-800 pb-6">
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="text-sm text-gray-400">
                          評価: {review.rating} / 5.0 | デート適性:{' '}
                          {review.date_appropriateness} / 5.0
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    <p className="text-gray-300">{review.review_text}</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-[#d70035]/20 to-[#d70035]/10 border border-[#d70035]/30 rounded-lg p-6">
                <p className="text-gray-300 mb-4">
                  <span className="text-[#d70035] font-bold text-xl">🔒</span>
                </p>
                <p className="text-gray-300 mb-2">
                  レビュー内容を閲覧するにはプレミアムプランへのアップグレードが必要です
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  プレミアムプランでは、{restaurant._count.reviews}件のレビューとデート適性評価を確認できます
                </p>
                <Link
                  href="/subscription"
                  className="inline-block bg-[#d70035] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#b8002e] transition"
                >
                  プレミアムプランにアップグレード
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

