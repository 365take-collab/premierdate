'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import RestaurantCard from '@/components/RestaurantCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkeletonCard from '@/components/SkeletonCard'
import ErrorMessage from '@/components/ErrorMessage'
import UsageStatus from '@/components/UsageStatus'

interface Restaurant {
  id: string
  name: string
  area: string
  price_range: string
  image_url: string | null
  restaurant_purposes?: Array<{
    purpose_categories: {
      name: string
    }
  }>
  restaurantPurposes?: Array<{
    purposeCategory: {
      name: string
    }
  }>
  _count: {
    reviews: number
    favorites: number
  }
  avgRating?: number
  isPremiumUser?: boolean
}

const PRICE_RANGES = [
  { value: 'UNDER_3000', label: '3000円以下' },
  { value: 'BETWEEN_3000_5000', label: '3000-5000円' },
  { value: 'BETWEEN_5000_10000', label: '5000-10000円' },
  { value: 'OVER_10000', label: '10000円以上' },
]

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      setError('ログインが必要です')
      setLoading(false)
      return
    }
    fetchFavorites()
  }, [session, status])

  const fetchFavorites = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/favorites')

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('ログインが必要です')
        }
        throw new Error('お気に入りの取得に失敗しました')
      }

      const data = await response.json()
      const favoriteRestaurants = data.favorites.map((f: any) => {
        const restaurant = f.restaurants || f.restaurant
        return {
          ...restaurant,
          price_range: restaurant.price_range || restaurant.priceRange,
          image_url: restaurant.image_url || restaurant.imageUrl,
          restaurant_purposes: restaurant.restaurant_purposes || restaurant.restaurantPurposes?.map((rp: any) => ({
            purpose_categories: rp.purposeCategory ? { name: rp.purposeCategory.name } : rp.purpose_categories
          })),
        }
      })
      setRestaurants(favoriteRestaurants)
    } catch (error) {
      console.error('Error fetching favorites:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getPriceRangeLabel = (priceRange: string) => {
    const found = PRICE_RANGES.find((p) => p.value === priceRange)
    return found?.label || priceRange
  }

  const formatRestaurantForCard = (restaurant: any) => {
    return {
      ...restaurant,
      price_range: restaurant.price_range || restaurant.priceRange,
      image_url: restaurant.image_url || restaurant.imageUrl,
      restaurant_purposes: restaurant.restaurant_purposes || restaurant.restaurantPurposes?.map((rp: any) => ({
        purpose_categories: rp.purposeCategory ? { name: rp.purposeCategory.name } : rp.purpose_categories
      })),
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">ログインが必要です</h2>
            <p className="text-gray-400 mb-6">
              お気に入り機能をご利用いただくにはログインが必要です
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              ログインする
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">お気に入り</h1>

        {/* 使用状況表示 */}
        <UsageStatus />

        {error ? (
          <ErrorMessage message={error} onRetry={fetchFavorites} />
        ) : loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden">
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">
              お気に入りの店舗がまだありません
            </p>
            <p className="text-gray-600 text-sm mb-6">
              店舗をお気に入りに追加すると、ここに表示されます
            </p>
            <Link
              href="/search"
              className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              店舗を探す
            </Link>
          </div>
        ) : (
          <>
            <div className="text-gray-500 text-sm mb-6">
              全{restaurants.length}件
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={formatRestaurantForCard(restaurant)}
                  getPriceRangeLabel={getPriceRangeLabel}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

