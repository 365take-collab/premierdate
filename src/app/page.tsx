import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SearchBar from '@/components/SearchBar'
import QuickRegisterForm from '@/components/QuickRegisterForm'
import OnboardingModal from '@/components/OnboardingModal'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <OnboardingModal />

      {/* メインコンテンツ */}
      <main>
        {/* ヒーローセクション - 簡潔に */}
        <section className="border-b border-gray-800 py-20 bg-gradient-to-b from-gray-900 to-black">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  デートで失敗しない名店が見つかる
                </h1>
                <Link
                  href="/help"
                  className="text-gray-400 hover:text-white transition-colors text-sm flex items-center"
                  title="使い方ガイド"
                >
                  <span className="hidden sm:inline mr-1">使い方</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              </div>
              <p className="text-lg md:text-xl text-gray-400 mb-6 leading-relaxed">
                デートに特化したグルメ検索サービス。用途別検索で5分で最適なお店が見つかります。
              </p>
              
              {/* 社会的証明 */}
              <div className="flex items-center justify-center gap-8 mb-8 text-sm text-gray-400">
                <div className="text-center">
                  <div className="text-[#d70035] text-2xl font-bold mb-1">1,000+</div>
                  <div>対象店舗</div>
                </div>
                <div className="w-px h-12 bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-[#d70035] text-2xl font-bold mb-1">5,000+</div>
                  <div>レビュー数</div>
                </div>
                <div className="w-px h-12 bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-[#d70035] text-2xl font-bold mb-1">95%</div>
                  <div>検索精度</div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-4">
                <Link
                  href="/search"
                  className="bg-[#d70035] text-white px-10 py-4 rounded-md font-bold hover:bg-[#b8002e] transition inline-block shadow-md"
                >
                  今すぐ無料で検索する
                </Link>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-2">
                    <span className="font-medium">検索は無料</span>
                    <span className="text-gray-600">·</span>
                    <span className="font-medium">ランキング・レビューは有料</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    「準備時間が1時間から5分に短縮できました」- 24歳・会社員
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 登録フォーム・検索バーセクション */}
        <section className="border-b border-gray-800 py-12 bg-black">
          <div className="container mx-auto px-4">
            {/* 簡単登録フォーム */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-bold mb-3 text-center text-white">
                  メールアドレスだけで無料登録
                </h3>
                <p className="text-sm text-gray-400 mb-4 text-center">
                  パスワード不要！メールアドレスを入力するだけで登録できます
                </p>
                <QuickRegisterForm />
              </div>
            </div>
            
            {/* 検索バー */}
            <div className="max-w-2xl mx-auto">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* こんな悩み、ありませんか？ */}
        <section className="container mx-auto px-4 py-20 bg-black">
          <h2 className="text-3xl font-bold text-center mb-16 text-white tracking-tight">
            こんな悩み、ありませんか？
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-sm hover:shadow-md hover:border-gray-700 transition-all">
              <h3 className="text-lg font-bold mb-4 text-white tracking-tight">
                デートのお店選びに毎回悩む
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                食べログやぐるなびで検索しても、デートに最適かどうかわからない。結局、いつものお店を選んでしまう。
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-sm hover:shadow-md hover:border-gray-700 transition-all">
              <h3 className="text-lg font-bold mb-4 text-white tracking-tight">
                準備に時間がかかりすぎる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                仕事で疲れているのに、毎回1時間以上かけて店を探す。もっと時間を有効に使いたい。
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-sm hover:shadow-md hover:border-gray-700 transition-all">
              <h3 className="text-lg font-bold mb-4 text-white tracking-tight">
                同じお店ばかり選んでしまう
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                相手に「またここ？」と思われそうで不安。もっと新鮮なお店を選びたい。
              </p>
            </div>
          </div>

          {/* プレミアデートなら解決できます */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white tracking-tight">
              プレミアデートなら、こんな未来が待っています
            </h2>
            <p className="text-gray-400 text-sm">
              デート特化の情報で、あなたの悩みを解決します
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-sm hover:shadow-md hover:border-gray-700 transition-all">
              <div className="w-12 h-1 bg-[#d70035] mb-6"></div>
              <h3 className="text-lg font-bold mb-4 text-white tracking-tight">
                5分で最適なお店が見つかる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm mb-6">
                用途別検索で「誕生日用」「初デート用」を選ぶだけ。準備時間が1時間から5分に短縮されます。
              </p>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                横並び席・客層・帰宅時間が一目で分かる
              </div>
            </div>
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-sm hover:shadow-md hover:border-gray-700 transition-all">
              <div className="w-12 h-1 bg-[#d70035] mb-6"></div>
              <h3 className="text-lg font-bold mb-4 text-white tracking-tight">
                毎回新しいお店を選べる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm mb-6">
                用途別・価格帯別・エリア別のランキングで、次々と新しいおすすめ店舗が見つかります。
              </p>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                「いつもいいお店選ぶね」と言われるように
              </div>
            </div>
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-sm hover:shadow-md hover:border-gray-700 transition-all">
              <div className="w-12 h-1 bg-[#d70035] mb-6"></div>
              <h3 className="text-lg font-bold mb-4 text-white tracking-tight">
                デートで失敗しないお店を選べる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm mb-6">
                デート特化のレビューで、実際にデートで使えるお店が分かります。安心してデートに臨めます。
              </p>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                相手もあなたも満足できるお店を見つけられる
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="container mx-auto px-4 py-20 bg-gray-900">
          <div className="bg-gray-900 rounded-lg p-16 text-center border border-gray-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-white tracking-tight">
              デートで失敗しない名店を見つけませんか
            </h2>
            <div className="flex items-center justify-center gap-4 mb-8 text-sm text-gray-400">
              <span className="font-medium">検索は無料</span>
              <span className="text-gray-600">·</span>
              <span className="font-medium">ランキング・レビューは有料</span>
            </div>
            <Link
              href="/search"
              className="bg-[#d70035] text-white px-10 py-4 rounded-md font-bold hover:bg-[#b8002e] transition inline-block shadow-md"
            >
              今すぐ無料で検索する
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
