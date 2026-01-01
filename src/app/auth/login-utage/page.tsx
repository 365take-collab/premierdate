'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function LoginUtagePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loginUtage = async () => {
      const token = searchParams.get('token')
      let email = searchParams.get('email')
      const simple = searchParams.get('simple') === 'true'

      // Utageの%mail%変数が展開されていない場合の処理
      if (email === '%mail%' || !email || email === '') {
        // ページ内のメールアドレス要素から取得を試みる
        const emailEl = document.querySelector('[data-email], .email, input[type="email"]')
        if (emailEl) {
          email = emailEl.value || emailEl.textContent || null
        }
        
        // まだ取得できていない場合
        if (!email || email === '%mail%') {
          setStatus('error')
          setMessage('メールアドレスが取得できませんでした。Utage側の設定を確認してください。')
          return
        }
      }

      // シンプルログインモード（開発環境用）
      if (simple && email && token) {
        try {
          // 直接NextAuthでログイン（開発環境用）
          const result = await signIn('credentials', {
            email: email,
            utageToken: token,
            redirect: false,
          })

          if (result?.error) {
            setStatus('error')
            setMessage('ログインに失敗しました。管理者にお問い合わせください。')
            console.error('Login error:', result.error)
          } else {
            setStatus('success')
            setMessage('ログインしています...')
            setTimeout(() => {
              router.push('/search')
              router.refresh()
            }, 1500)
          }
        } catch (error) {
          console.error('Simple login error:', error)
          setStatus('error')
          setMessage('エラーが発生しました。もう一度お試しください')
        }
        return
      }

      // 通常のログイン（トークン検証あり）
      if (!token || !email) {
        setStatus('error')
        setMessage('無効なリンクです。Utageの会員サイトから再度アクセスしてください。')
        return
      }

      try {
        // APIエンドポイントでトークンと課金状況を確認
        const response = await fetch('/api/auth/login-utage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.message || data.error || 'ログインに失敗しました')
          
          // 課金が終了している場合の特別なメッセージ
          if (response.status === 403) {
            setMessage('課金が終了しています。Utageで再度購入してください。')
          }
          return
        }

        // 認証成功後、NextAuthでログイン
        setStatus('success')
        setMessage('ログインしています...')

        // NextAuthのCredentialsプロバイダーでログイン
        // Utage認証トークンを使用（パスワード不要）
        const result = await signIn('credentials', {
          email: data.user.email,
          utageToken: data.utageToken, // Utage認証トークン
          redirect: false,
        })

        if (result?.error) {
          setStatus('error')
          setMessage('ログインに失敗しました。管理者にお問い合わせください。')
          console.error('Login error:', result.error)
        } else {
          setTimeout(() => {
            router.push(data.redirectUrl || '/search')
            router.refresh()
          }, 1500)
        }
      } catch (error) {
        console.error('Login Utage error:', error)
        setStatus('error')
        setMessage('エラーが発生しました。もう一度お試しください')
      }
    }

    loginUtage()
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
                <p className="mt-4 text-gray-400">ログインしています...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h1 className="text-2xl font-bold mb-4">ログイン成功</h1>
                <p className="text-gray-400 mb-6">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <h1 className="text-2xl font-bold mb-4">ログイン失敗</h1>
                <p className="text-gray-400 mb-6">{message}</p>
                {message.includes('メールアドレスが取得できませんでした') && (
                  <div className="text-sm text-gray-500 mt-4 space-y-2 text-left bg-gray-800 p-4 rounded-lg">
                    <p className="font-semibold mb-2">Utage側の設定を確認してください：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>URLパラメータでメールアドレスを渡しているか確認</li>
                      <li>Utageの変数 <code className="bg-gray-900 px-1 rounded">%mail%</code> が正しく展開されているか確認</li>
                      <li>会員サイトのページにメールアドレスが表示されているか確認</li>
                    </ul>
                  </div>
                )}
                <div className="space-y-3 mt-6">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full bg-[#d70035] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#b8002e] transition"
                  >
                    ログインページに戻る
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
                  >
                    再試行
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
