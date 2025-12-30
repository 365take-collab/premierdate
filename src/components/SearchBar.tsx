'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/search')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="店舗名、エリア、用途などで検索"
          className="w-full px-5 py-4 pl-14 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white placeholder-gray-500"
        />
        <button
          type="submit"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}

