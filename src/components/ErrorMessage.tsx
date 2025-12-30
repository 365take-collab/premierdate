interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-center py-12">
      <div className="text-red-400 mb-4">
        <svg
          className="w-16 h-16 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-lg font-semibold mb-2">
          {message || 'エラーが発生しました'}
        </p>
        <p className="text-gray-400 text-sm mb-6">
          しばらく時間をおいてから再度お試しください
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  )
}



