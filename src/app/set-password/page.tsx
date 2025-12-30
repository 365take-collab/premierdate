'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'email' | 'password'>('email')

  useEffect(() => {
    // URLパラメータからメールアドレスまたはトークンを取得
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('token')

    if (tokenParam) {
      setToken(tokenParam)
      setStep('password')
    } else if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'エラーが発生しました')
      } else {
        // 開発環境ではトークンが返される
        if (data.token) {
          setToken(data.token)
          setStep('password')
        } else {
          setSuccess(true)
        }
      }
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'エラーが発生しました')
      } else {
        setSuccess(true)
        // 3秒後にログインページにリダイレクト
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください')
    } finally {
      setIsLoading(false)
    }
  }

  if (success && step === 'email') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">メールを送信しました</h2>
        <p className="text-gray-400 mb-6">
          {email} にパスワード設定リンクを送信しました。<br />
          メールを確認してください。
        </p>
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          トップページに戻る
        </Link>
      </div>
    )
  }

  if (success && step === 'password') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">パスワードを設定しました</h2>
        <p className="text-gray-400 mb-6">
          ログインページに移動します...
        </p>
        <Link
          href="/login"
          className="inline-block bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          今すぐログイン
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6 text-white tracking-tight text-center">
        {step === 'email' ? 'パスワード設定' : 'パスワードを入力'}
      </h1>

      {step === 'email' ? (
        <form onSubmit={handleRequestToken} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            プレミアデートにご登録いただいたメールアドレスを入力してください。
            パスワード設定リンクをお送りします。
          </p>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="example@email.com"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '送信中...' : 'パスワード設定リンクを送信'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSetPassword} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            新しいパスワードを入力してください。
          </p>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="8文字以上"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="もう一度入力"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '設定中...' : 'パスワードを設定'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ログインページに戻る
        </Link>
      </div>
    </>
  )
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10">
            <Suspense fallback={
              <div className="text-center text-gray-400">読み込み中...</div>
            }>
              <SetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
