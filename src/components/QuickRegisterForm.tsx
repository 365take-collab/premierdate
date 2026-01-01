'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickRegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/register-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || '登録に失敗しました')
        setIsSuccess(false)
      } else {
        setIsSuccess(true)
        setMessage(data.message || 'メールアドレス確認リンクを送信しました')
        
        // 開発環境ではURLを表示
        if (process.env.NODE_ENV === 'development' && data.url) {
          setMessage(`${data.message} 開発環境のため、以下のURLをクリックしてください: ${data.url}`)
        }
      }
    } catch (error) {
      setMessage('エラーが発生しました。もう一度お試しください')
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレスを入力"
          required
          className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#d70035] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#b8002e] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? '送信中...' : '無料で始める'}
        </button>
      </div>
      {message && (
        <div className={`mt-3 text-sm ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}
      {isSuccess && (
        <p className="mt-2 text-xs text-gray-400">
          メールをご確認いただき、リンクをクリックして登録を完了してください。
        </p>
      )}
    </form>
  )
}
