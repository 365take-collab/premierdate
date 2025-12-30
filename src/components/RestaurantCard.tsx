'use client'

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
  }
  rank?: number
  getPriceRangeLabel: (priceRange: string) => string
}

export default function RestaurantCard({ restaurant, rank, getPriceRangeLabel }: RestaurantCardProps) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group bg-gray-900/50 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-gray-900/80 transition-all duration-300 block border border-gray-800/50 hover:border-gray-700"
    >
      {/* 画像 */}
      <div className="relative w-full h-48 bg-gray-900 overflow-hidden">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* ランキング表示 */}
        {rank !== undefined && rank <= 3 && (
          <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md text-white font-bold px-3 py-1 rounded-full text-sm border border-white/20">
            {rank}位
          </div>
        )}
        {/* お気に入りボタン */}
        <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
          <FavoriteButton restaurantId={restaurant.id} />
        </div>
      </div>

      {/* 店舗情報 */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-white mb-3 line-clamp-1 tracking-tight">
          {restaurant.name}
        </h3>
        
        {/* 評価・レビュー数 */}
        <div className="flex items-center gap-3 mb-3">
          {restaurant.avgRating !== undefined ? (
            <>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-base">★</span>
                <span className="text-white font-medium text-sm">
                  {restaurant.avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                レビュー{restaurant._count.reviews}件
              </span>
            </>
          ) : (
            <span className="text-gray-500 text-xs">
              レビュー {restaurant._count.reviews}件
            </span>
          )}
        </div>

        {/* エリア・価格帯 */}
        <div className="text-gray-500 text-xs mb-4 space-y-1">
          <div>{restaurant.area}</div>
          <div>{getPriceRangeLabel(restaurant.price_range)}</div>
        </div>

        {/* 用途タグ */}
        {(restaurant.restaurant_purposes || restaurant.restaurantPurposes) && 
         (restaurant.restaurant_purposes || restaurant.restaurantPurposes || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(restaurant.restaurant_purposes || restaurant.restaurantPurposes || []).slice(0, 3).map((rp, idx) => (
              <span
                key={idx}
                className="bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-full text-xs"
              >
                {(rp as any).purpose_categories?.name || (rp as any).purposeCategory?.name || ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

