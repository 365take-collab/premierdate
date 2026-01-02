'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

interface OnboardingStep {
  title: string;
  content: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'プレミアデートへようこそ！',
    content: 'プレミアデートは、デートに特化した情報を提供するグルメ検索サービスです。\n\nデートで失敗しない名店を、用途別・価格帯別・エリア別で簡単に見つけることができます。',
  },
  {
    title: '無料で検索できます',
    content: '検索機能は無料でご利用いただけます。\n\n店舗名、エリア、用途などで検索して、デートに最適なお店を見つけましょう。\n\n基本情報（エリア、価格帯、住所、用途タグ）は無料で確認できます。',
  },
  {
    title: 'プレミアムプランで詳細情報を',
    content: 'プレミアムプランに登録すると、以下の詳細情報がご利用いただけます：\n\n• 横並び席の有無\n• 客層・雰囲気\n• デート後の帰宅時間\n• デート特化のレビュー内容\n• 用途別・価格帯別ランキング\n\nデートで失敗しないお店選びができます。',
  },
  {
    title: 'お気に入りとレビュー',
    content: '気に入ったお店は「お気に入り」に保存できます。\n\n実際にデートで使ったお店のレビューを投稿すると、他のユーザーの参考になります。\n\nデート適性評価も確認できるので、安心してお店を選べます。',
  },
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // 初回訪問かチェック
    const hasSeenOnboarding = localStorage.getItem('premier-date-hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('premier-date-hasSeenOnboarding', 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-gray-900 rounded-2xl border border-gray-800 max-w-2xl w-full mx-4 p-8 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              {steps[currentStep].title}
            </h2>
            <span className="text-sm text-gray-400">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded ${
                    index <= currentStep ? 'bg-[#d70035]' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
              {steps[currentStep].content}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            スキップ
          </button>

          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                前へ
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-2 bg-[#d70035] text-white rounded-lg hover:bg-[#b8002e] transition-colors font-medium"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  始める
                </>
              ) : (
                <>
                  次へ
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
