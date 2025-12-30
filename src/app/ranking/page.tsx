'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkeletonCard from '@/components/SkeletonCard'
import ErrorMessage from '@/components/ErrorMessage'
import Header from '@/components/Header'

interface Restaurant {
  id: string
  name: string
  area: string
  priceRange: string
  restaurantPurposes: Array<{
    purposeCategory: {
      name: string
    }
  }>
  _count: {
    reviews: number
    favorites: number
  }
}

const PURPOSES = ['初デート', '誕生日', '記念日', 'カジュアルデート', '夜のデート']
const AREAS = ['渋谷', '新宿', '新大久保', '上野', '池袋', '表参道', '恵比寿', '六本木', '銀座', '東京駅周辺', '横浜']

export default function RankingPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankingType, setRankingType] = useState<'purpose' | 'area'>('purpose')
  const [selectedFilter, setSelectedFilter] = useState('初デート')

  useEffect(() => {
    fetchRanking()
  }, [rankingType, selectedFilter])

  const fetchRanking = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (rankingType === 'purpose') {
        params.append('purpose', selectedFilter)
      } else {
        params.append('area', selectedFilter)
      }
      params.append('limit', '20')

      const response = await fetch(`/api/restaurants?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('ランキングデータの取得に失敗しました')
      }
      
      const data = await response.json()
      setRestaurants(data.restaurants || [])
    } catch (error) {
      console.error('Error fetching ranking:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">ランキング</h1>

        {/* ランキングタイプの選択 */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                setRankingType('purpose')
                setSelectedFilter('初デート')
              }}
              className={`px-4 py-2 rounded ${
                rankingType === 'purpose'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-white'
              }`}
            >
              用途別ランキング
            </button>
            <button
              onClick={() => {
                setRankingType('area')
                setSelectedFilter('渋谷')
              }}
              className={`px-4 py-2 rounded ${
                rankingType === 'area'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-white'
              }`}
            >
              エリア別ランキング
            </button>
          </div>

          {/* フィルター選択 */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              {rankingType === 'purpose' ? '用途を選択' : 'エリアを選択'}
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full md:w-auto bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
            >
              {(rankingType === 'purpose' ? PURPOSES : AREAS).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ランキング結果 */}
        {error ? (
          <ErrorMessage message={error} onRetry={fetchRanking} />
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">該当する店舗が見つかりませんでした</p>
            <p className="text-sm">別の条件で検索してお試しください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant, index) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition flex items-center gap-6"
              >
                <div className="text-3xl font-bold text-gray-600 w-12">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">
                    {restaurant.name}
                  </h2>
                  <div className="text-gray-400 text-sm">
                    <div>{restaurant.area}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {restaurant.restaurantPurposes.map((rp, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-800 px-2 py-1 rounded text-xs"
                        >
                          {rp.purposeCategory.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right text-gray-400 text-sm">
                  <div>レビュー {restaurant._count.reviews}件</div>
                  <div>お気に入り {restaurant._count.favorites}件</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

