'use client'

export type SortOption = 'default' | 'rating' | 'reviews' | 'newest'

interface SortSelectorProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'おすすめ順' },
  { value: 'rating', label: '評価の高い順' },
  { value: 'reviews', label: 'レビュー数の多い順' },
  { value: 'newest', label: '新着順' },
]

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-500 text-xs">並び順</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all hover:border-white/20"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

