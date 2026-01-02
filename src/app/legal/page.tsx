import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">特定商取引法に基づく表示</h1>
        <p className="text-sm text-gray-400 mb-12">最終更新日: 2025年1月1日（法的確認に基づく修正完了）</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">事業者名</h2>
            <p className="text-gray-400">プレミアデート運営事務局（個人事業主・川村健志）</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">所在地</h2>
            <p className="text-gray-400">〒160-0022<br />東京都新宿区新宿1-36-2<br />新宿第七葉山ビル（METSオフィス新宿御苑）</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">電話番号</h2>
            <p className="text-gray-400 mb-2">お問い合わせはメールでの対応を推奨しております。<br />
            メールアドレス: <a href="mailto:info@sendright.jp" className="text-blue-400 hover:underline">info@sendright.jp</a><br />
            返信期間: 通常2営業日以内</p>
            <p className="text-gray-500 text-sm mt-2">
              ※ 電話でのお問い合わせは受け付けておりません。<br />
              ※ お問い合わせはメールにてお願いいたします。<br />
              ※ 電話番号が必要な場合は、メールにてお問い合わせください。遅滞なく開示いたします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">メールアドレス</h2>
            <p className="text-gray-400"><a href="mailto:info@sendright.jp" className="text-blue-400 hover:underline">info@sendright.jp</a></p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">商品・サービスの内容</h2>
            <p className="text-gray-400 mb-3 leading-relaxed">
              <strong>サービス名</strong>: プレミアデート
            </p>
            <p className="text-gray-400 mb-3 leading-relaxed">
              <strong>サービス内容</strong>:<br />
              デート特化のグルメ検索サービス。横並び席の有無、客層情報、ホテルまでの距離など、デートに必要な情報を1つの画面で確認できます。
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">主な機能</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>横並び席の有無</li>
              <li>客層情報</li>
              <li>ホテルまでの距離</li>
              <li>用途別検索（誕生日用、初デート用など）</li>
              <li>価格帯別・エリア別ランキング</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">販売価格</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>月額プラン: ¥980（税込）</li>
              <li>年額プラン: ¥8,800（税込）</li>
            </ul>
            <p className="text-gray-400 mt-3 text-sm">※価格はすべて税込表示です。</p>
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">7日間無料トライアルについて</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>初回お申し込み時、7日間無料でお試しいただけます</li>
              <li>クレジットカードの登録は必要ですが、7日間は一切料金がかかりません</li>
              <li>7日間の無料トライアル期間中にキャンセルすれば、料金は一切かかりません</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">支払方法</h2>
            <p className="text-gray-400">クレジットカード決済（VISA、Mastercard、JCB、American Express、Diners Club）</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">支払時期</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>月額プラン: お申し込み時、および毎月の自動更新時</li>
              <li>年額プラン: お申し込み時、および1年後の自動更新時</li>
            </ul>
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">自動更新について</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>月額プランは毎月自動更新されます</li>
              <li>年額プランは1年ごとに自動更新されます</li>
              <li>自動更新を停止したい場合は、マイページからキャンセル手続きを行ってください</li>
              <li>キャンセル後も、次回の更新日までサービスをご利用いただけます</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">サービス提供時期</h2>
            <p className="text-gray-400">お申し込み後、即時利用可能</p>
            <p className="text-gray-500 text-sm mt-2">※ 決済完了後、すぐにサービスをご利用いただけます。</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">返品・キャンセルポリシー</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">キャンセルについて</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>7日間無料トライアル期間中にキャンセルすれば、料金は一切かかりません</li>
              <li>キャンセルは簡単。マイページからいつでもキャンセルできます</li>
              <li>キャンセル後も、7日間の無料トライアル期間は最後までご利用いただけます</li>
              <li>月額プラン・年額プランともに、いつでもキャンセル可能です</li>
              <li>キャンセル後は、次回の更新日までサービスをご利用いただけます</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">キャンセル方法</h3>
            <ol className="list-decimal list-inside text-gray-400 space-y-2 ml-4">
              <li>マイページにログイン</li>
              <li>「アカウント設定」または「サブスクリプション設定」を開く</li>
              <li>「キャンセル」ボタンをクリック</li>
              <li>確認画面で「キャンセルを確定」をクリック</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">返品について</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              本サービスはデジタルサービス（オンラインサービス）のため、返品はお受けできません。
              ただし、7日間無料トライアル期間中にキャンセルしていただければ、料金は一切かかりません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7日間無料トライアルについて</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>初回お申し込み時、7日間無料でお試しいただけます</li>
              <li>クレジットカードの登録は必要ですが、7日間は一切料金がかかりません</li>
              <li>7日間の無料トライアル期間中にキャンセルすれば、料金は一切かかりません</li>
              <li>無料トライアル期間中は、すべての機能をご利用いただけます</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">自動更新について</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>月額プランは毎月自動更新されます</li>
              <li>年額プランは1年ごとに自動更新されます</li>
              <li>自動更新を停止したい場合は、マイページからキャンセル手続きを行ってください</li>
              <li>キャンセル後も、次回の更新日までサービスをご利用いただけます</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">お問い合わせ</h2>
            <p className="text-gray-400 mb-3 leading-relaxed">
              ご不明な点がございましたら、以下の連絡先までお問い合わせください。
            </p>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <p className="text-white font-semibold mb-2">メールアドレス: <a href="mailto:info@sendright.jp" className="text-blue-400 hover:underline">info@sendright.jp</a></p>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              ※ お問い合わせはメールでの対応を推奨しております。<br />
              ※ お問い合わせへの返信は、通常2営業日以内に行います。<br />
              ※ 電話でのお問い合わせは受け付けておりません。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
