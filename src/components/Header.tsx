'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { HelpCircle } from 'lucide-react'

export default function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="bg-black border-b border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-[#d70035] tracking-tight hover:opacity-80 transition-opacity">
              プレミアデート
            </Link>
            <Link
              href="/help"
              className="text-gray-400 hover:text-white transition-colors"
              title="使い方ガイド"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/search"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              店舗を探す
            </Link>
            {status === 'loading' ? (
              <div className="w-20 h-6 bg-gray-800 rounded animate-pulse"></div>
            ) : session ? (
              <>
                <Link
                  href="/ranking"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium relative"
                >
                  ランキング
                  <span className="ml-1 text-xs text-[#d70035] font-bold">有料</span>
                </Link>
                <Link
                  href="/favorites"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  お気に入り
                </Link>
                <Link
                  href="/subscription"
                  className="bg-[#d70035] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#b8002e] transition-colors"
                >
                  プレミアム
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
              </>
            ) : (
              <>
                <Link
                  href="/ranking"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium relative"
                >
                  ランキング
                  <span className="ml-1 text-xs text-[#d70035] font-bold">有料</span>
                </Link>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  ログイン
                </Link>
                <Link
                  href="/subscription"
                  className="bg-[#d70035] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#b8002e] transition-colors"
                >
                  プレミアム登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

