'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import FilterSidebar from '@/components/FilterSidebar'
import SortSelector, { SortOption } from '@/components/SortSelector'
import RestaurantCard from '@/components/RestaurantCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkeletonCard from '@/components/SkeletonCard'
import ErrorMessage from '@/components/ErrorMessage'

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
  restaurant_purposes: Array<{
    purpose_categories: {
      name: string
    }
  }>
  _count: {
    reviews: number
    favorites: number
  }
  avgRating?: number
}

const PRICE_RANGES = [
  { value: 'UNDER_3000', label: '3000円以下' },
  { value: 'BETWEEN_3000_5000', label: '3000-5000円' },
  { value: 'BETWEEN_5000_10000', label: '5000-10000円' },
  { value: 'OVER_10000', label: '10000円以上' },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [filters, setFilters] = useState({
    area: '',
    priceRange: '',
    purpose: '',
    sideBySideSeats: false,
  })
  const [sortBy, setSortBy] = useState<SortOption>('default')

  useEffect(() => {
    setCurrentPage(1) // フィルター変更時は1ページ目にリセット
  }, [filters, sortBy, searchParams])

  useEffect(() => {
    fetchRestaurants()
  }, [filters, sortBy, searchParams, currentPage])

  const fetchRestaurants = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      const q = searchParams.get('q')
      if (q) params.append('q', q)
      if (filters.area) params.append('area', filters.area)
      if (filters.priceRange) params.append('priceRange', filters.priceRange)
      if (filters.purpose) params.append('purpose', filters.purpose)
      if (sortBy !== 'default') params.append('sort', sortBy)
      params.append('limit', itemsPerPage.toString())
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString())

      const response = await fetch(`/api/restaurants?${params.toString()}`)

      if (!response.ok) {
        throw new Error('店舗データの取得に失敗しました')
      }

      const data = await response.json()
      setRestaurants(data.restaurants || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getPriceRangeLabel = (priceRange: string) => {
    const found = PRICE_RANGES.find((p) => p.value === priceRange)
    return found?.label || priceRange
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* 検索バーセクション */}
      <div className="border-b border-white/5 py-8">
        <div className="container mx-auto px-4">
          <SearchBar />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左サイドバー: フィルター */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </aside>

          {/* メインコンテンツ */}
          <div className="flex-1">
            {/* ソート・件数表示 */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-gray-500 text-xs">
                {loading ? (
                  '検索中...'
                ) : (
                  <span className="font-medium text-white">
                    全{total}件中 {Math.min((currentPage - 1) * itemsPerPage + 1, total)}-{Math.min(currentPage * itemsPerPage, total)}件を表示
                  </span>
                )}
              </div>
              <SortSelector value={sortBy} onChange={setSortBy} />
            </div>

            {/* 検索結果 */}
            {error ? (
              <ErrorMessage message={error} onRetry={fetchRestaurants} />
            ) : loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-12 text-center border border-white/10">
                <p className="text-gray-400 text-base mb-2">
                  条件に一致する店舗が見つかりませんでした
                </p>
                <p className="text-gray-600 text-sm">
                  検索条件を変更してお試しください
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      getPriceRangeLabel={getPriceRangeLabel}
                    />
                  ))}
                </div>

                {/* ページネーション */}
                {total > itemsPerPage && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      前へ
                    </button>
                    
                    {Array.from({ length: Math.min(5, Math.ceil(total / itemsPerPage)) }, (_, i) => {
                      const totalPages = Math.ceil(total / itemsPerPage)
                      let pageNum: number
                      
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg transition ${
                            currentPage === pageNum
                              ? 'bg-white text-black font-semibold'
                              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(total / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(total / itemsPerPage) || loading}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      次へ
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
