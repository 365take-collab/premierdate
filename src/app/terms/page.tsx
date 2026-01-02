import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">利用規約</h1>
        <p className="text-sm text-gray-400 mb-12">最終更新日: 2025年12月31日</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. はじめに</h2>
            <p className="text-gray-400 leading-relaxed">
              本利用規約（以下「本規約」）は、プレミアデート（以下「当サービス」）の利用条件を定めるものです。当サービスを利用するすべてのお客様（以下「ユーザー」）は、本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. 利用規約の適用</h2>
            <p className="text-gray-400 leading-relaxed">
              本規約は、当サービスの利用に関する一切の事項に適用されます。当サービスを利用することにより、ユーザーは本規約に同意したものとみなされます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. サービスの内容</h2>
            <p className="text-gray-400 mb-3">当サービスは、デートに特化した情報を提供するグルメ検索サービスです。</p>
            <p className="text-gray-400 mb-3 italic text-sm bg-gray-900 p-3 rounded border border-gray-800">
              ※本サービスは、アポ系サービスや出会い系サービスではありません。デートのお店選びをサポートするグルメ情報サイトです。
            </p>
            <p className="text-gray-400 mb-3">当サービスは、以下のサービスを提供します。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>デートに特化したグルメ情報の検索</li>
              <li>店舗情報の提供（横並び席の有無、客層情報、帰宅時間など）</li>
              <li>用途別検索（誕生日用、初デート用、デート用など）</li>
              <li>ランキング機能</li>
              <li>レビュー機能</li>
              <li>お気に入り機能</li>
              <li>その他、当サービスが提供するサービス</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. 利用規約の変更</h2>
            <p className="text-gray-400 leading-relaxed">
              当サービスは、必要に応じて、本規約を変更することがあります。変更後の利用規約は、当サービスに掲載した時点で効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. アカウント登録</h2>
            <p className="text-gray-400 mb-3">当サービスを利用するには、アカウント登録が必要です。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>アカウント登録時には、正確な情報を入力してください</li>
              <li>アカウント情報は、ユーザー自身が責任を持って管理してください</li>
              <li>アカウント情報の漏洩、不正使用などによる損害について、当サービスは一切の責任を負いません</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. サブスクリプション</h2>
            <p className="text-gray-400 mb-3">当サービスは、有料サブスクリプションサービスを提供しています。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>月額プラン: ¥980（税込）</li>
              <li>年額プラン: ¥8,800（税込）</li>
              <li>初回登録時、7日間の無料トライアル期間を提供します</li>
              <li>無料トライアル期間中にキャンセルすれば、料金は一切かかりません</li>
              <li>サブスクリプションは、自動更新されます</li>
              <li>キャンセルは、マイページからいつでも可能です</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7. 禁止事項</h2>
            <p className="text-gray-400 mb-3">ユーザーは、以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>当サービスのサービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセス、クラッキング、その他の不正行為</li>
              <li>当サービスのサービスを営利目的で利用する行為</li>
              <li>当サービスのサービスを複製、改変、転載、配布する行為</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">8. 免責事項</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">8-1. 情報の正確性</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスの情報は、可能な限り正確な情報を提供するよう努めていますが、情報の正確性、完全性、有用性について、一切の保証をするものではありません。
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">8-2. サービスの中止・中断</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスは、システムのメンテナンス、不具合、その他の理由により、サービスを一時的に中止または中断することがあります。
              この場合、当サービスは事前に通知するよう努めますが、緊急の場合には通知なくサービスを中止または中断することがあります。
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">8-3. 損害の免責</h3>
            <p className="text-gray-400 leading-relaxed">
              当サービスの利用により、ユーザーに生じた損害について、当サービスは一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">9. 知的財産権</h2>
            <p className="text-gray-400 leading-relaxed">
              当サービスに掲載されているすべてのコンテンツ（文章、画像、ロゴ、デザインなど）の知的財産権は、当サービスまたは正当な権利者に帰属します。
              ユーザーは、当サービスのコンテンツを無断で複製、改変、転載、配布することはできません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">10. 退会</h2>
            <p className="text-gray-400 mb-3">ユーザーは、いつでもアカウントを削除（退会）することができます。</p>
            <p className="text-gray-400 leading-relaxed">
              退会後、ユーザーのアカウント情報は削除されますが、既に投稿されたレビューなどのコンテンツは削除されない場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">11. お問い合わせ</h2>
            <p className="text-gray-400 mb-3 leading-relaxed">
              本利用規約に関するお問い合わせは、以下の連絡先までお願いいたします。
            </p>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <p className="text-white font-semibold mb-2">メールアドレス: <a href="mailto:info@sendright.jp" className="text-blue-400 hover:underline">info@sendright.jp</a></p>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              ※ お問い合わせはメールでの対応を推奨しております。<br />
              ※ お問い合わせへの返信は、通常2営業日以内に行います。<br />
              ※ 電話でのお問い合わせは受け付けておりません。<br />
              ※ お問い合わせの際は、件名に「利用規約に関するお問い合わせ」と記載してください。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
