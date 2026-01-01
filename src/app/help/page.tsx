'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, HelpCircle, Search, Star, Lock, Heart, MessageSquare, ChevronDown, ChevronUp, Crown } from 'lucide-react';

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>('search');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          ホームに戻る
        </Link>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 sm:p-12">
          <div className="flex items-center mb-8">
            <HelpCircle className="w-8 h-8 text-[#d70035] mr-4" />
            <h1 className="text-3xl font-bold text-white">使い方ガイド</h1>
          </div>

          {/* 検索方法 */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('search')}
              className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center">
                <Search className="w-5 h-5 text-[#d70035] mr-3" />
                <span className="text-lg font-semibold text-white">検索方法</span>
              </div>
              {openSection === 'search' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {openSection === 'search' && (
              <div className="mt-4 p-6 bg-gray-800/50 rounded-xl">
                <ol className="space-y-4 text-gray-300">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#d70035] rounded-full flex items-center justify-center text-white font-bold mr-3 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-white mb-1">検索バーで検索</p>
                      <p className="text-sm text-gray-400">店舗名、エリア、用途などで検索できます。検索は無料でご利用いただけます。</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#d70035] rounded-full flex items-center justify-center text-white font-bold mr-3 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-white mb-1">フィルターで絞り込み</p>
                      <p className="text-sm text-gray-400">エリア、価格帯、用途、横並び席の有無で絞り込めます。左サイドバーから設定できます。</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#d70035] rounded-full flex items-center justify-center text-white font-bold mr-3 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-white mb-1">店舗詳細を確認</p>
                      <p className="text-sm text-gray-400">気になるお店をクリックして、詳細情報を確認できます。基本情報は無料で確認できます。</p>
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* 無料機能と有料機能 */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('free-premium')}
              className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-[#d70035] mr-3" />
                <span className="text-lg font-semibold text-white">無料機能と有料機能</span>
              </div>
              {openSection === 'free-premium' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {openSection === 'free-premium' && (
              <div className="mt-4 p-6 bg-gray-800/50 rounded-xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      無料で使える機能
                    </h3>
                    <ul className="text-gray-300 text-sm space-y-2 ml-6">
                      <li>• 店舗検索</li>
                      <li>• 基本情報の閲覧（エリア、価格帯、住所、用途タグ）</li>
                      <li>• レビュー数の確認</li>
                      <li>• お気に入り（3件まで）</li>
                      <li>• レビュー投稿（月5件まで）</li>
                      <li>• デートコース提案（1件まで）</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                      プレミアムプランで使える機能
                    </h3>
                    <ul className="text-gray-300 text-sm space-y-2 ml-6">
                      <li>• デート特化情報（横並び席、客層、雰囲気、ホテルまでの距離）</li>
                      <li>• レビュー内容の閲覧</li>
                      <li>• 平均評価・デート適性評価の確認</li>
                      <li>• 用途別・価格帯別ランキング</li>
                      <li>• お気に入り無制限</li>
                      <li>• レビュー投稿無制限</li>
                      <li>• デートコース提案無制限</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* お気に入りとレビュー */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('favorites-reviews')}
              className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center">
                <Heart className="w-5 h-5 text-[#d70035] mr-3" />
                <span className="text-lg font-semibold text-white">お気に入りとレビュー</span>
              </div>
              {openSection === 'favorites-reviews' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {openSection === 'favorites-reviews' && (
              <div className="mt-4 p-6 bg-gray-800/50 rounded-xl">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      お気に入り機能
                    </h3>
                    <p className="text-gray-300 text-sm">
                      気に入ったお店は「お気に入り」に保存できます。無料プランでは3件まで、プレミアムプランでは無制限に保存できます。
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      「お気に入り」ページから、保存したお店を一覧で確認できます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      レビュー投稿
                    </h3>
                    <p className="text-gray-300 text-sm">
                      実際にデートで使ったお店のレビューを投稿できます。評価とデート適性評価を付けることができます。
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      無料プランでは月5件まで、プレミアムプランでは無制限に投稿できます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      レビューの閲覧
                    </h3>
                    <p className="text-gray-300 text-sm">
                      レビュー数は無料で確認できますが、レビュー内容の閲覧はプレミアムプランが必要です。
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      プレミアムプランでは、平均評価とデート適性評価も確認できます。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ランキング */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('ranking')}
              className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center">
                <Star className="w-5 h-5 text-[#d70035] mr-3" />
                <span className="text-lg font-semibold text-white">ランキング機能</span>
              </div>
              {openSection === 'ranking' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {openSection === 'ranking' && (
              <div className="mt-4 p-6 bg-gray-800/50 rounded-xl">
                <p className="text-gray-300 mb-4">
                  ランキング機能はプレミアムプランでのみご利用いただけます。
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-sm font-medium text-white mb-1">用途別ランキング</p>
                    <p className="text-xs text-gray-400">誕生日用、初デート用、記念日用など、用途別におすすめ店舗をランキング形式で表示します。</p>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-sm font-medium text-white mb-1">価格帯別ランキング</p>
                    <p className="text-xs text-gray-400">3000円以下、3000-5000円、5000-10000円、10000円以上など、価格帯別にランキングを表示します。</p>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-sm font-medium text-white mb-1">エリア別ランキング</p>
                    <p className="text-xs text-gray-400">東京、大阪、名古屋など、エリア別におすすめ店舗をランキング形式で表示します。</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* よくある質問 */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('faq')}
              className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center">
                <HelpCircle className="w-5 h-5 text-[#d70035] mr-3" />
                <span className="text-lg font-semibold text-white">よくある質問</span>
              </div>
              {openSection === 'faq' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {openSection === 'faq' && (
              <div className="mt-4 p-6 bg-gray-800/50 rounded-xl space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Q: 無料でどこまで使えますか？</h3>
                  <p className="text-gray-300 text-sm">
                    A: 検索機能と基本情報の閲覧は無料でご利用いただけます。お気に入りは3件まで、レビュー投稿は月5件まで無料で利用できます。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Q: プレミアムプランはいくらですか？</h3>
                  <p className="text-gray-300 text-sm">
                    A: 月額980円、年額8,800円（約25%OFF）です。7日間の無料トライアルが付いています。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Q: デート特化情報とは何ですか？</h3>
                  <p className="text-gray-300 text-sm">
                    A: 横並び席の有無、客層、雰囲気、ホテルまでの距離など、デートに必要な情報です。プレミアムプランでご確認いただけます。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Q: レビューは誰が書いていますか？</h3>
                  <p className="text-gray-300 text-sm">
                    A: 実際にデートで使ったユーザーが投稿しています。評価とデート適性評価が付いています。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Q: 無料トライアルは自動で課金されますか？</h3>
                  <p className="text-gray-300 text-sm">
                    A: 7日間の無料トライアル後、自動的に課金が開始されます。いつでもキャンセル可能です。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
