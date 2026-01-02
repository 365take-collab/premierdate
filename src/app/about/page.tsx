import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">運営者情報</h1>
        <p className="text-sm text-gray-400 mb-12">最終更新日: 2025年1月1日（法的確認に基づく修正完了）</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">サービスについて</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              プレミアデートは、デートに特化した情報を提供するグルメ検索サービスです。
            </p>
            <p className="text-gray-400 mb-4 leading-relaxed italic bg-gray-900 p-3 rounded border border-gray-800">
              ※本サービスは、アポ系サービスや出会い系サービスではありません。デートのお店選びをサポートするグルメ情報サイトです。
            </p>
            <p className="text-gray-400 leading-relaxed">
              デートのお店選びに必要な情報（横並び席の有無、客層情報、帰宅時間など）を1つの画面で確認できることで、
              デートの準備時間を短縮し、より良いデート体験を実現することを目指しています。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">事業者情報</h2>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <dl className="space-y-4">
                <div>
                  <dt className="text-white font-semibold mb-1">事業者名</dt>
                  <dd className="text-gray-400">プレミアデート運営事務局（個人事業主・川村健志）</dd>
                </div>
                <div>
                  <dt className="text-white font-semibold mb-1">所在地</dt>
                  <dd className="text-gray-400">〒160-0022<br />東京都新宿区新宿1-36-2<br />新宿第七葉山ビル（METSオフィス新宿御苑）</dd>
                </div>
                <div>
                  <dt className="text-white font-semibold mb-1">電話番号</dt>
                  <dd className="text-gray-400">お問い合わせはメールでの対応を推奨しております</dd>
                </div>
                <div>
                  <dt className="text-white font-semibold mb-1">メールアドレス</dt>
                  <dd className="text-gray-400"><a href="mailto:info@sendright.jp" className="text-blue-400 hover:underline">info@sendright.jp</a></dd>
                </div>
              </dl>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">お問い合わせ</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              サービスに関するお問い合わせやご意見・ご要望がございましたら、以下の連絡先までお気軽にお問い合わせください。
            </p>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <p className="text-white font-semibold mb-2">メールアドレス: <a href="mailto:info@sendright.jp" className="text-blue-400 hover:underline">info@sendright.jp</a></p>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              ※ お問い合わせはメールでの対応を推奨しております。<br />
              ※ お問い合わせへの返信は、通常2営業日以内に行います。<br />
              ※ 電話でのお問い合わせは受け付けておりません。<br />
              ※ 電話番号が必要な場合は、メールにてお問い合わせください。遅滞なく開示いたします。<br />
              ※ お問い合わせの際は、件名に「プレミアデートに関するお問い合わせ」と記載してください。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
