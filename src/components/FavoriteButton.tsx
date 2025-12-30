'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  restaurantId: string
  className?: string
}

export default function FavoriteButton({ restaurantId, className = '' }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (session && restaurantId) {
      checkFavoriteStatus()
    } else {
      setIsChecking(false)
    }
  }, [session, restaurantId])

  const checkFavoriteStatus = async () => {
    if (!session) {
      setIsChecking(false)
      return
    }

    try {
      const response = await fetch(`/api/favorites/check?restaurantId=${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite || false)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setIsLoading(true)

    try {
      if (isFavorite) {
        // お気に入りから削除
        const response = await fetch(`/api/favorites?restaurantId=${restaurantId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setIsFavorite(false)
        } else {
          const data = await response.json()
          alert(data.error || 'お気に入りの削除に失敗しました')
        }
      } else {
        // お気に入りに追加
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ restaurantId }),
        })

        if (response.ok) {
          setIsFavorite(true)
        } else {
          const data = await response.json()
          if (data.upgradeRequired) {
            // アップグレードが必要な場合の特別な処理
            if (confirm(`${data.error}\n\nプレミアムプランのページに移動しますか？`)) {
              window.location.href = '/subscription'
            }
          } else {
            alert(data.error || 'お気に入りの追加に失敗しました')
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('お気に入りの操作に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <button
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
      >
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`${className} transition-colors ${
        isFavorite
          ? 'text-red-500 hover:text-red-400'
          : 'text-gray-400 hover:text-red-500'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <svg
        className="w-5 h-5"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}

