'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'

interface DateCourse {
  id: string
  courseName: string
  description: string | null
  isPublic: boolean
  createdAt: string
  restaurant: {
    id: string
    name: string
    area: string
    imageUrl: string | null
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
  user: {
    id: string
    name: string | null
    email: string
  } | null
}

export default function DateCoursesPage() {
  const [dateCourses, setDateCourses] = useState<DateCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDateCourses()
  }, [])

  const fetchDateCourses = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/date-courses')

      if (!response.ok) {
        throw new Error('デートコースの取得に失敗しました')
      }

      const data = await response.json()
      setDateCourses(data.dateCourses || [])
    } catch (error) {
      console.error('Error fetching date courses:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">デートコース提案</h1>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={fetchDateCourses} />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : dateCourses.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">
              デートコースがまだありません
            </p>
            <p className="text-gray-600 text-sm">
              店舗詳細ページからデートコースを提案できます
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dateCourses.map((course) => (
              <Link
                key={course.id}
                href={`/date-courses/${course.id}`}
                className="block bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition"
              >
                <div className="flex gap-6">
                  {/* 画像 */}
                  <div className="w-32 h-32 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {course.restaurant.imageUrl ? (
                      <img
                        src={course.restaurant.imageUrl}
                        alt={course.restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{course.courseName}</h2>
                    <div className="text-gray-400 text-sm mb-2">
                      <Link
                        href={`/restaurants/${course.restaurant.id}`}
                        className="hover:text-white transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {course.restaurant.name}
                      </Link>
                      <span className="mx-2">・</span>
                      <span>{course.restaurant.area}</span>
                    </div>
                    {course.description && (
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>レビュー {course.restaurant._count.reviews}件</span>
                      <span>お気に入り {course.restaurant._count.favorites}件</span>
                      {course.user && (
                        <span>提案者: {course.user.name || course.user.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}



