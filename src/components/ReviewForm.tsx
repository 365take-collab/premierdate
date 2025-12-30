'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ReviewFormProps {
  restaurantId: string
  onReviewSubmitted?: () => void
}

export default function ReviewForm({ restaurantId, onReviewSubmitted }: ReviewFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [dateAppropriateness, setDateAppropriateness] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          dateAppropriateness,
          reviewText: reviewText.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'レビューの投稿に失敗しました')
        return
      }

      // フォームをリセット
      setRating(5)
      setDateAppropriateness(5)
      setReviewText('')
      setError('')

      // 親コンポーネントに通知
      if (onReviewSubmitted) {
        onReviewSubmitted()
      } else {
        // ページをリロードして新しいレビューを表示
        router.refresh()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setError('レビューの投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400 mb-4">レビューを投稿するにはログインが必要です</p>
        <a
          href="/login"
          className="inline-block bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          ログインする
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-semibold mb-4">レビューを投稿</h3>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          評価 <span className="text-gray-500">(1-5)</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`w-10 h-10 rounded ${
                rating >= value
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              } transition`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          デート適性 <span className="text-gray-500">(1-5)</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDateAppropriateness(value)}
              className={`w-10 h-10 rounded ${
                dateAppropriateness >= value
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              } transition`}
            >
              ❤
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium mb-2">
          レビュー本文
        </label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={5}
          className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/50"
          placeholder="この店舗のレビューを入力してください（10文字以上1000文字以下）"
          minLength={10}
          maxLength={1000}
          required
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {reviewText.length} / 1000
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || reviewText.length < 10}
        className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '投稿中...' : 'レビューを投稿'}
      </button>
    </form>
  )
}



