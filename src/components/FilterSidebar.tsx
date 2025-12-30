'use client'

interface FilterSidebarProps {
  filters: {
    area: string
    priceRange: string
    purpose: string
    sideBySideSeats?: boolean
    customerSegment?: string
  }
  onFilterChange: (filters: any) => void
}

const AREAS = ['渋谷', '新宿', '新大久保', '上野', '池袋', '表参道', '恵比寿', '六本木', '銀座', '東京駅周辺', '横浜']
const PRICE_RANGES = [
  { value: 'UNDER_3000', label: '3000円以下' },
  { value: 'BETWEEN_3000_5000', label: '3000-5000円' },
  { value: 'BETWEEN_5000_10000', label: '5000-10000円' },
  { value: 'OVER_10000', label: '10000円以上' },
]
const PURPOSES = ['初デート', '誕生日', '記念日', 'カジュアルデート', '夜のデート']

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const handleChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-lg p-5 space-y-6">
      <h2 className="text-base font-semibold text-white mb-5 tracking-tight">検索条件</h2>

      {/* エリア */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          エリア
        </label>
        <div className="space-y-2">
          <button
            onClick={() => handleChange('area', '')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              filters.area === ''
                ? 'bg-white/10 border border-white/20 text-white font-medium'
                : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
            }`}
          >
            すべて
          </button>
          {AREAS.map((area) => (
            <button
              key={area}
              onClick={() => handleChange('area', area)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                filters.area === area
                  ? 'bg-white/10 border border-white/20 text-white font-medium'
                  : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* 価格帯 */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          価格帯
        </label>
        <div className="space-y-2">
          <button
            onClick={() => handleChange('priceRange', '')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              filters.priceRange === ''
                ? 'bg-white/10 border border-white/20 text-white font-medium'
                : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
            }`}
          >
            すべて
          </button>
          {PRICE_RANGES.map((pr) => (
            <button
              key={pr.value}
              onClick={() => handleChange('priceRange', pr.value)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                filters.priceRange === pr.value
                  ? 'bg-white/10 border border-white/20 text-white font-medium'
                  : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* 用途 */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          用途
        </label>
        <div className="space-y-2">
          <button
            onClick={() => handleChange('purpose', '')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              filters.purpose === ''
                ? 'bg-white/10 border border-white/20 text-white font-medium'
                : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
            }`}
          >
            すべて
          </button>
          {PURPOSES.map((purpose) => (
            <button
              key={purpose}
              onClick={() => handleChange('purpose', purpose)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                filters.purpose === purpose
                  ? 'bg-white/10 border border-white/20 text-white font-medium'
                  : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
              }`}
            >
              {purpose}
            </button>
          ))}
        </div>
      </div>

      {/* 横並び席 */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.sideBySideSeats || false}
            onChange={(e) => handleChange('sideBySideSeats', e.target.checked)}
            className="w-4 h-4 text-white bg-white/5 border-white/20 rounded focus:ring-white/30 focus:ring-2 cursor-pointer"
          />
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">横並び席あり</span>
        </label>
      </div>
    </div>
  )
}

