import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20">
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center">
          <p className="text-gray-600 text-sm">© 2025 デートガイド</p>
          <div className="flex gap-8">
            <Link
              href="/terms"
              className="text-gray-600 hover:text-white transition-colors text-sm"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-white transition-colors text-sm"
            >
              プライバシーポリシー
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

