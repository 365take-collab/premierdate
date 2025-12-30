'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-white tracking-tight hover:opacity-80 transition-opacity">
            デートガイド
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/search"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              店舗を探す
            </Link>
            <Link
              href="/ranking"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              ランキング
            </Link>
            <Link
              href="/date-courses"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              デートコース
            </Link>
            {status === 'loading' ? (
              <div className="w-20 h-6 bg-white/5 rounded animate-pulse"></div>
            ) : session ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/favorites"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  お気に入り
                </Link>
                <Link
                  href="/subscription"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  プラン
                </Link>
                <span className="text-sm text-gray-400">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

