'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        // ログイン
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('メールアドレスまたはパスワードが正しくありません')
        } else {
          router.push('/search')
          router.refresh()
        }
      } else {
        // サインアップ
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'サインアップに失敗しました')
        } else {
          // サインアップ後、自動ログイン
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          })

          if (result?.error) {
            setError('アカウントは作成されましたが、ログインに失敗しました')
          } else {
            router.push('/search')
            router.refresh()
          }
        }
      }
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10">
            <h1 className="text-2xl font-semibold mb-6 text-white tracking-tight text-center">
              {isLogin ? 'ログイン' : '新規登録'}
            </h1>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isLogin
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                ログイン
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  !isLogin
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                新規登録
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                    お名前
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="山田太郎"
                  />
                </div>
              )}

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
                {isLoading ? '処理中...' : isLogin ? 'ログイン' : '新規登録'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                新規登録で、7日間無料トライアルを開始できます
              </p>
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                トップページに戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}



