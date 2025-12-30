export default function SkeletonCard() {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg overflow-hidden animate-pulse border border-gray-800/50">
      {/* 画像スケルトン */}
      <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900"></div>
      {/* コンテンツスケルトン */}
      <div className="p-5 space-y-3">
        <div className="h-6 bg-white/5 rounded w-3/4"></div>
        <div className="h-4 bg-white/5 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded w-full"></div>
          <div className="h-3 bg-white/5 rounded w-2/3"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 bg-white/5 rounded-full w-16"></div>
          <div className="h-5 bg-white/5 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  )
}

