import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SearchBar from '@/components/SearchBar'

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* メインコンテンツ */}
      <main>
        {/* ヒーローセクション */}
        <section className="border-b border-white/5 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h1 className="text-5xl font-semibold mb-6 text-white tracking-tight">
                デートで失敗しない名店が見つかる
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed mb-8">
                デートガイドは、デートに特化した情報を提供する唯一のグルメ検索サービスです。
              </p>
              
              {/* 社会的証明 */}
              <div className="flex items-center justify-center gap-8 mb-10 text-sm text-gray-500">
                <div className="text-center">
                  <div className="text-white text-2xl font-medium mb-1">1,000+</div>
                  <div>対象店舗</div>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-white text-2xl font-medium mb-1">5,000+</div>
                  <div>レビュー数</div>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-white text-2xl font-medium mb-1">95%</div>
                  <div>検索精度</div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-5">
                <Link
                  href="/search"
                  className="bg-white text-black px-10 py-4 rounded-lg font-medium hover:bg-gray-100 transition inline-block"
                >
                  今すぐ無料でお試しする
                </Link>
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <span className="text-white font-medium">7日間無料トライアル</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-white font-medium">いつでもキャンセル可能</span>
                  </div>
                  <p className="text-xs text-gray-700 italic">
                    「準備時間が1時間から5分に短縮できました」- 24歳・会社員
                  </p>
                </div>
              </div>
            </div>
            
            {/* 検索バー */}
            <div className="max-w-2xl mx-auto mt-12">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* こんな悩み、ありませんか？ */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-semibold text-center mb-16 text-white tracking-tight">
            こんな悩み、ありませんか？
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-white/10">
              <h3 className="text-lg font-medium mb-4 text-white tracking-tight">
                デートのお店選びに毎回悩む
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                食べログやぐるなびで検索しても、デートに最適かどうかわからない。結局、いつものお店を選んでしまう。
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-white/10">
              <h3 className="text-lg font-medium mb-4 text-white tracking-tight">
                準備に時間がかかりすぎる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                仕事で疲れているのに、毎回1時間以上かけて店を探す。もっと時間を有効に使いたい。
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-white/10">
              <h3 className="text-lg font-medium mb-4 text-white tracking-tight">
                同じお店ばかり選んでしまう
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                相手に「またここ？」と思われそうで不安。もっと新鮮なお店を選びたい。
              </p>
            </div>
          </div>

          {/* デートガイドなら解決できます */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4 text-white tracking-tight">
              デートガイドなら、こんな未来が待っています
            </h2>
            <p className="text-gray-500 text-sm">
              デート特化の情報で、あなたの悩みを解決します
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-px bg-white/20 mb-6"></div>
              <h3 className="text-lg font-medium mb-4 text-white tracking-tight">
                5分で最適なお店が見つかる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm mb-6">
                用途別検索で「誕生日用」「初デート用」を選ぶだけ。準備時間が1時間から5分に短縮されます。
              </p>
              <div className="text-xs text-gray-600 uppercase tracking-wider">
                横並び席・客層・ホテルまでの距離が一目で分かる
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-px bg-white/20 mb-6"></div>
              <h3 className="text-lg font-medium mb-4 text-white tracking-tight">
                毎回新しいお店を選べる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm mb-6">
                用途別・価格帯別・エリア別のランキングで、次々と新しいおすすめ店舗が見つかります。
              </p>
              <div className="text-xs text-gray-600 uppercase tracking-wider">
                「いつもいいお店選ぶね」と言われるように
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-px bg-white/20 mb-6"></div>
              <h3 className="text-lg font-medium mb-4 text-white tracking-tight">
                デートで失敗しないお店を選べる
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm mb-6">
                デート特化のレビューで、実際にデートで使えるお店が分かります。安心してデートに臨めます。
              </p>
              <div className="text-xs text-gray-600 uppercase tracking-wider">
                相手もあなたも満足できるお店を見つけられる
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-16 text-center border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-white tracking-tight">
              デートで失敗しない名店を見つけませんか
            </h2>
            <div className="flex items-center justify-center gap-4 mb-8 text-sm">
              <span className="text-white font-medium">7日間無料トライアル</span>
              <span className="text-gray-600">·</span>
              <span className="text-white font-medium">いつでもキャンセル可能</span>
            </div>
            <Link
              href="/search"
              className="bg-white text-black px-10 py-4 rounded-lg font-medium hover:bg-gray-100 transition inline-block"
            >
              今すぐ無料でお試しする
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
