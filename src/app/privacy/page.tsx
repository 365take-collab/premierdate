import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">プライバシーポリシー</h1>
        <p className="text-sm text-gray-400 mb-12">最終更新日: 2025年12月31日</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. 個人情報の取り扱いについて</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              プレミアデート（以下「当サービス」）は、お客様の個人情報の保護を重要視し、個人情報の保護に関する法律（個人情報保護法）に基づき、適切に取り扱います。
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">1-1. 個人情報の取得</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">当サービスでは、以下の場合に個人情報を取得することがあります。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>サービスへの登録時（メールアドレス、パスワードなど）</li>
              <li>サブスクリプション契約時（クレジットカード情報など）</li>
              <li>お問い合わせフォームからのお問い合わせ</li>
              <li>メールでのお問い合わせ</li>
              <li>その他、お客様が自ら提供する情報</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">1-2. 個人情報の利用目的</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">当サービスで取得した個人情報は、以下の目的で利用します。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>サービスの提供・運営</li>
              <li>サブスクリプション契約の管理・請求</li>
              <li>お問い合わせへの対応</li>
              <li>サービス改善のための分析</li>
              <li>新機能やサービスに関するお知らせ</li>
              <li>法令に基づく対応</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">1-3. 個人情報の第三者への提供</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">当サービスは、以下の場合を除き、お客様の個人情報を第三者に提供することはありません。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>お客様の同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要な場合</li>
              <li>サービス提供に必要な範囲で、信頼できる業務委託先に提供する場合（決済処理など）</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">1-4. 個人情報の管理</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスは、お客様の個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざん、漏洩などを防止するため、セキュリティ対策を講じています。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Cookie（クッキー）の使用について</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              当サービスでは、お客様により良いサービスを提供するため、Cookieを使用することがあります。
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">2-1. Cookieとは</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              Cookieとは、ウェブサイトを訪問した際に、ブラウザに保存される小さなテキストファイルです。
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">2-2. Cookieの使用目的</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">当サービスでは、以下の目的でCookieを使用します。</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>ログイン状態の維持</li>
              <li>サイトの利用状況の分析</li>
              <li>お客様の利便性向上</li>
              <li>広告配信の最適化</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">2-3. Cookieの無効化</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              お客様は、ブラウザの設定により、Cookieを無効にすることができます。ただし、Cookieを無効にした場合、一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. アクセス解析ツールについて</h2>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスでは、お客様の利用状況を分析するため、以下のアクセス解析ツールを使用しています。
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Google Analytics</li>
            </ul>
            <p className="text-gray-400 mt-3 leading-relaxed">
              これらのツールは、Cookieを使用して、お客様の利用状況を収集します。収集されたデータは、匿名化されており、個人を特定する情報は含まれません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. 決済情報の取り扱い</h2>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスでは、サブスクリプション契約の決済処理について、Stripe（ストライプ）を使用しています。
              クレジットカード情報などの決済情報は、当サービスでは保存せず、Stripeが安全に管理しています。
              決済情報の取り扱いについては、Stripeのプライバシーポリシーをご確認ください。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. 免責事項</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">5-1. 情報の正確性</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスの情報は、可能な限り正確な情報を提供するよう努めていますが、情報の正確性、完全性、有用性について、一切の保証をするものではありません。
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-white">5-2. 損害の免責</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスの利用により、お客様に生じた損害について、当サービスは一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. プライバシーポリシーの変更</h2>
            <p className="text-gray-400 mb-3 leading-relaxed">
              当サービスは、必要に応じて、本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、当サービスに掲載した時点で効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7. お問い合わせ</h2>
            <p className="text-gray-400 mb-3 leading-relaxed">
              本プライバシーポリシーに関するお問い合わせは、以下の連絡先までお願いいたします。
            </p>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <p className="text-white font-semibold mb-2">メールアドレス: <a href="mailto:info@sendright.jp" className="text-blue-400 hover:underline">info@sendright.jp</a></p>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              ※ お問い合わせはメールでの対応を推奨しております。<br />
              ※ お問い合わせへの返信は、通常2営業日以内に行います。<br />
              ※ 電話でのお問い合わせは受け付けておりません。<br />
              ※ お問い合わせの際は、件名に「プライバシーポリシーに関するお問い合わせ」と記載してください。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
