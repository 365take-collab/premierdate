'use client'

import Link from 'next/link'

interface UpgradePromptProps {
  feature: string
  currentLimit: number
  className?: string
}

export default function UpgradePrompt({ feature, currentLimit, className = '' }: UpgradePromptProps) {
  return (
    <div className={`bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-700/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-yellow-400 text-xl">⭐</div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">プレミアムプランにアップグレード</h3>
          <p className="text-sm text-gray-300 mb-3">
            {feature}の{currentLimit}件の制限に達しました。プレミアムプランにアップグレードすると、無制限にご利用いただけます。
          </p>
          <Link
            href="/subscription"
            className="inline-block bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
          >
            プレミアムプランを確認する
          </Link>
        </div>
      </div>
    </div>
  )
}



