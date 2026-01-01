'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      const email = searchParams.get('email')

      if (!token || !email) {
        setStatus('error')
        setMessage('無効なリンクです')
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.error || '認証に失敗しました')
          return
        }

        // 認証成功後、自動ログイン
        setStatus('success')
        setMessage('登録が完了しました。ログインしています...')

        // メール認証トークンで自動ログイン
        const result = await signIn('credentials', {
          email: data.email,
          token: token,
          redirect: false,
        })

        if (result?.error) {
          setStatus('error')
          setMessage('ログインに失敗しました。ログインページから再度お試しください。')
        } else {
          setTimeout(() => {
            router.push('/search')
            router.refresh()
          }, 1500)
        }
      } catch (error) {
        console.error('Verify email error:', error)
        setStatus('error')
        setMessage('エラーが発生しました。もう一度お試しください')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            {status === 'loading' && (
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-400">メールアドレスを確認しています...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h1 className="text-2xl font-bold mb-4">登録完了</h1>
                <p className="text-gray-400 mb-6">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <h1 className="text-2xl font-bold mb-4">エラー</h1>
                <p className="text-gray-400 mb-6">{message}</p>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-[#d70035] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#b8002e] transition"
                >
                  ログインページに戻る
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
