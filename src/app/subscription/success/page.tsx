'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id') // Stripe用
  const email = searchParams.get('email') // Utage用
  const orderId = searchParams.get('order_id') // Utage用
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Utage経由またはStripe経由のどちらかでアクセス
    if (!sessionId && !email && !orderId) {
      // セッションIDもメールアドレスもない場合は、Webhookで処理されるまで待つ
      // または、単純に成功メッセージを表示
      setLoading(false)
      return
    }

    // セッションIDまたはメールアドレスから決済情報を確認（オプション）
    // 実際にはWebhookで処理されるので、ここでは表示のみ
    setLoading(false)
  }, [sessionId, email, orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="bg-gray-900 rounded-lg p-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-red-400">エラーが発生しました</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link
              href="/subscription"
              className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              プランページに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 py-20">
        <div className="bg-gray-900 rounded-lg p-12 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">決済が完了しました！</h1>
            <p className="text-gray-400 mb-6">
              プレミアムプランへのアップグレードが完了しました。
              <br />
              すべての機能がご利用いただけます。
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/search"
              className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              店舗を探す
            </Link>
            <div>
              <Link
                href="/subscription"
                className="text-gray-400 hover:text-white transition text-sm"
              >
                プラン詳細を確認
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-400">読み込み中...</p>
          </div>
        </main>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
