'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface DateCourseFormProps {
  restaurantId: string
  restaurantName: string
  onCourseCreated?: () => void
}

export default function DateCourseForm({
  restaurantId,
  restaurantName,
  onCourseCreated,
}: DateCourseFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [courseName, setCourseName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
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
      const response = await fetch('/api/date-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          courseName: courseName.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'デートコースの作成に失敗しました')
        return
      }

      // フォームをリセット
      setCourseName('')
      setDescription('')
      setIsPublic(true)
      setError('')

      // 親コンポーネントに通知
      if (onCourseCreated) {
        onCourseCreated()
      } else {
        // デートコース一覧ページにリダイレクト
        router.push('/date-courses')
      }
    } catch (error) {
      console.error('Error creating date course:', error)
      setError('デートコースの作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400 mb-4">デートコースを提案するにはログインが必要です</p>
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
      <h3 className="text-xl font-semibold mb-4">
        この店舗でデートコースを提案
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        店舗: {restaurantName}
      </p>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="courseName" className="block text-sm font-medium mb-2">
          コース名 <span className="text-red-500">*</span>
        </label>
        <input
          id="courseName"
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/50"
          placeholder="例: 初デートにおすすめのコース"
          maxLength={100}
          required
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {courseName.length} / 100
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/50"
          placeholder="このコースの詳細やおすすめポイントを入力してください"
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {description.length} / 500
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isPublic"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-white focus:ring-white/50"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-300">
          他のユーザーに公開する
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !courseName.trim()}
        className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '作成中...' : 'デートコースを提案'}
      </button>
    </form>
  )
}



