import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-20 bg-black">
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">© 2025 プレミアデート</p>
          <div className="flex flex-wrap gap-6">
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/legal"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              特定商取引法に基づく表示
            </Link>
            <Link
              href="/about"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              運営者情報
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

