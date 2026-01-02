'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import FavoriteButton from './FavoriteButton'

interface RestaurantCardProps {
  restaurant: {
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
  rank?: number
  getPriceRangeLabel: (priceRange: string) => string
}

export default function RestaurantCard({ restaurant, rank, getPriceRangeLabel }: RestaurantCardProps) {
  const [userPlan, setUserPlan] = useState<'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | null>(null)
  const isPremium = userPlan === 'PREMIUM_MONTHLY' || userPlan === 'PREMIUM_YEARLY' || restaurant.isPremiumUser

  useEffect(() => {
    fetchUserPlan()
  }, [])

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
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 block border border-gray-800 hover:border-[#d70035]"
    >
      <div className="flex gap-4 p-4">
        {/* 画像 */}
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-800 overflow-hidden rounded">
          {restaurant.image_url ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* ランキング表示 */}
          {rank !== undefined && rank <= 3 && (
            <div className="absolute top-2 left-2 bg-[#d70035] text-white font-bold px-2 py-1 rounded text-xs">
              {rank}位
            </div>
          )}
        </div>

        {/* 店舗情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg text-white line-clamp-1 group-hover:text-[#d70035] transition-colors">
              {restaurant.name}
            </h3>
            <div className="ml-2 flex-shrink-0" onClick={(e) => e.preventDefault()}>
              <FavoriteButton restaurantId={restaurant.id} />
            </div>
          </div>
          
          {/* エリア・価格帯（無料でも表示） */}
          <div className="text-gray-400 text-sm mb-2">
            <span>{restaurant.area}</span>
            <span className="mx-2">·</span>
            <span>{getPriceRangeLabel(restaurant.price_range)}</span>
          </div>

          {/* 評価・レビュー数（無料でも表示 - 食べログが無料で提供している情報） */}
          {restaurant.avgRating !== undefined ? (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <span className="text-[#ff6b35] text-lg">★</span>
                <span className="text-white font-bold text-base">
                  {restaurant.avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                レビュー{restaurant._count.reviews}件
              </span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm mb-2">
              レビュー {restaurant._count.reviews}件
            </div>
          )}

          {/* 用途タグ（無料でも表示 - 食べログが無料で提供しているカテゴリ情報） */}
          {(restaurant.restaurant_purposes || restaurant.restaurantPurposes) && 
           (restaurant.restaurant_purposes || restaurant.restaurantPurposes || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(restaurant.restaurant_purposes || restaurant.restaurantPurposes || []).slice(0, 3).map((rp, idx) => (
                <span
                  key={idx}
                  className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700"
                >
                  {(rp as any).purpose_categories?.name || (rp as any).purposeCategory?.name || ''}
                </span>
              ))}
            </div>
          )}

          {/* デート特化情報は有料（課金を促すメッセージ） */}
          {!isPremium && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="bg-gradient-to-r from-[#d70035]/20 to-[#d70035]/10 border border-[#d70035]/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-300 mb-1">
                      <span className="text-[#d70035] font-bold">🔒</span> デート特化情報（横並び席・客層・デート後の帰宅時間など）を見るには
                    </p>
                    <p className="text-xs text-[#d70035] font-bold">
                      プレミアムプランが必要です
                    </p>
                  </div>
                  <Link
                    href="/subscription"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-3 bg-[#d70035] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#b8002e] transition whitespace-nowrap"
                  >
                    今すぐ登録
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

