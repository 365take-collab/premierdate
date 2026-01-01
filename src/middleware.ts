import { NextRequest, NextResponse } from 'next/server';
import { detectAnomalousPattern, getClientIP } from '@/lib/security';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { PlanType } from '@prisma/client';

/**
 * アクセス拒否時のHTMLページを生成
 */
function getAccessDeniedHTML(message: string, showUtageOption: boolean = true, memberPageUrl?: string): string {
  // 会員ページURLを取得（環境変数から、またはデフォルト値）
  const utageMemberUrl = memberPageUrl || process.env.UTAGE_MEMBER_URL || 'https://utage-system.com/member';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>アクセスできません - プレミアデート</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #d70035 0%, #b8002e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #333;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1a1a1a;
    }
    .message {
      font-size: 16px;
      color: #666;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .instruction {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
      text-align: left;
    }
    .instruction-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }
    .instruction-steps {
      list-style: none;
      padding: 0;
    }
    .instruction-steps li {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      padding-left: 24px;
      position: relative;
    }
    .instruction-steps li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #d70035;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #d70035 0%, #b8002e 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(215, 0, 53, 0.4);
      margin: 8px;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(215, 0, 53, 0.5);
    }
    .button:active {
      transform: translateY(0);
    }
    .button-secondary {
      background: #f5f5f5;
      color: #333;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .button-secondary:hover {
      background: #e5e5e5;
    }
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #999;
    }
    .highlight {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 16px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #856404;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>アクセスできません</h1>
    <p class="message">${message}</p>
    ${showUtageOption ? `
    <div class="highlight">
      <strong>💡 解決方法</strong><br>
      ログイン済みで課金期間中でもアクセスできない場合は、会員ページから入り直してください。
    </div>
    <div class="instruction">
      <div class="instruction-title">会員ページから入り直す方法</div>
      <ol class="instruction-steps">
        <li>会員ページにアクセスしてください</li>
        <li>会員ページから「プレミアデートにログイン」をクリックしてください</li>
        <li>ログイン後、このページに再度アクセスしてください</li>
      </ol>
    </div>
    ` : ''}
    <div class="button-group">
      ${showUtageOption ? `<a href="${utageMemberUrl}" target="_blank" class="button">会員ページにアクセス</a>` : ''}
      ${showUtageOption ? '<a href="#" onclick="window.history.back(); return false;" class="button button-secondary">前のページに戻る</a>' : ''}
      <a href="/" class="button">トップページに戻る</a>
    </div>
    <div class="footer">
      お手数をおかけして申し訳ございません
    </div>
  </div>
</body>
</html>`;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 異常検出のための情報を取得
  const clientIP = getClientIP(request.headers);
  const userId = request.cookies.get('userId')?.value || 'anonymous';
  const pathname = request.nextUrl.pathname;
  const timestamp = Date.now();
  
  // NextAuthのセッションからプラン情報を取得
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const userPlanFromSession = token?.planType === 'FREE' ? 'free' : (token?.planType ? 'premium' : null);
  
  // 異常検出を実行（ログイン関連のパスは除外）
  if (!pathname.includes('/login-utage') && !pathname.includes('/auth/login-utage')) {
    const anomalyCheck = detectAnomalousPattern(userId, pathname, timestamp, clientIP);
    if (anomalyCheck.isAnomalous) {
      console.error('異常なアクセスパターンを検出:', {
        userId,
        pathname,
        ip: clientIP,
        reason: anomalyCheck.reason,
        timestamp: new Date(timestamp).toISOString(),
      });
      
      // 異常なアクセスの場合は、セッションを無効化
      response.cookies.delete('utage_access');
      response.cookies.delete('utage_access_timestamp');
      
      // 異常検出の場合は403を返す（開発環境では警告のみ）
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse(getAccessDeniedHTML('異常なアクセスパターンが検出されました。会員ページから再度ログインしてください。', true), {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }
  }

  // Utage側のURLが間違っている場合のリダイレクト
  // 例: /login-utage → /auth/login-utage
  const search = request.nextUrl.search;
  if (pathname === '/login-utage') {
    return NextResponse.redirect(
      new URL(`/auth/login-utage${search}`, request.url)
    );
  }

  // ngrokの警告ページをスキップするためのヘッダーを設定
  response.headers.set('ngrok-skip-browser-warning', 'true');

  // Utageからのアクセスかチェック（すべてのページで）
  const referer = request.headers.get('referer') || request.headers.get('referrer');
  const origin = request.headers.get('origin');
  const allowedUtageDomains = [
    'utage-system.com',
    'utage.jp',
    'utage.co.jp',
  ];

  const isFromUtage = (referer && allowedUtageDomains.some(domain => referer.includes(domain))) ||
                      (origin && allowedUtageDomains.some(domain => origin.includes(domain)));

  // セッション情報をチェック（クッキーから）
  const utageSession = request.cookies.get('utage_access')?.value === 'true';
  const existingSession = request.cookies.get('utage_access_timestamp');
  const sessionTimestamp = existingSession ? parseInt(existingSession.value, 10) : null;
  const now = Date.now();
  const sessionMaxAge = 24 * 60 * 60 * 1000; // 1日
  
  // セッションが有効かチェック（セッションクッキーがあり、タイムスタンプが有効期限内）
  const isValidSession = utageSession && sessionTimestamp && (now - sessionTimestamp < sessionMaxAge);

  // Utageからのアクセスか、有効なセッション情報がある場合
  // セッションがあれば、referer/originチェックをスキップしてURLから直接アクセス可能
  const hasUtageAccess = isFromUtage || isValidSession;

  // Utageからのアクセスまたは有効なセッションがある場合、セッション情報を更新
  if (hasUtageAccess) {
    response.headers.set('x-utage-access', 'true');
    
    if (isValidSession) {
      // 有効なセッションがある場合は、セッションを延長
      response.cookies.set('utage_access', 'true', {
        maxAge: 24 * 60 * 60, // 1日
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      // セッションタイムスタンプを更新（アクティビティがある場合は延長）
      response.cookies.set('utage_access_timestamp', now.toString(), {
        maxAge: 24 * 60 * 60, // 1日
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      console.log('有効なセッションでアクセス:', { 
        pathname: request.nextUrl.pathname,
        sessionAge: Math.floor((now - sessionTimestamp!) / 1000 / 60) + '分',
        accessType: 'direct_url' // URLから直接アクセス
      });
    } else if (isFromUtage) {
      // Utageからの新規アクセスの場合、セッションを設定
      response.cookies.set('utage_access', 'true', {
        maxAge: 24 * 60 * 60, // 1日
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      response.cookies.set('utage_access_timestamp', now.toString(), {
        maxAge: 24 * 60 * 60, // 1日
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      console.log('Utageからの新規アクセス: セッションを設定', { 
        referer, 
        origin, 
        pathname: request.nextUrl.pathname,
        accessType: 'from_utage'
      });
    }
  } else if (utageSession && sessionTimestamp) {
    // セッションが期限切れの場合は削除
    response.cookies.delete('utage_access');
    response.cookies.delete('utage_access_timestamp');
    response.cookies.delete('userId');
    console.log('セッション期限切れ: クッキーを削除', { 
      pathname: request.nextUrl.pathname,
      sessionAge: Math.floor((now - sessionTimestamp) / 1000 / 60) + '分'
    });
  }

  // /login-utage と /auth/login-utage へのアクセスをUtageからのみ許可
  if (pathname === '/login-utage' || pathname === '/auth/login-utage') {
    // 開発環境では、ngrok経由のアクセスを許可
    const isNgrok = request.nextUrl.hostname.includes('ngrok-free.app') || 
                    request.nextUrl.hostname.includes('ngrok.io') ||
                    request.nextUrl.hostname === 'localhost';
    
    if (isNgrok && process.env.NODE_ENV !== 'production') {
      // 開発環境でngrok経由の場合は許可（refererがない場合でも）
      console.log('開発環境: /login-utageへのngrok経由アクセスを許可:', { 
        hostname: request.nextUrl.hostname,
        pathname: request.nextUrl.pathname,
        referer,
        origin
      });
      return response;
    }
    
    // 有料会員の場合のみUtageからのアクセスを要求
    const userPlan = request.cookies.get('user_plan')?.value || 'free';
    const isPremiumUser = userPlan === 'premium';
    
    if (isPremiumUser && !hasUtageAccess) {
      return new NextResponse(getAccessDeniedHTML('有料会員のログインページへのアクセスは会員ページからのみ許可されています。会員ページからログインしてください。', true), {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // ユーザーのプラン情報を取得（有料会員かどうかを判定）
  // 優先順位: セッション > クッキー > デフォルト（無料）
  const userPlan = userPlanFromSession || request.cookies.get('user_plan')?.value || 'free';
  const isPremiumUser = userPlan === 'premium';
  
  // セッションからプラン情報が取得できた場合、クッキーに保存
  if (userPlanFromSession && userPlanFromSession !== request.cookies.get('user_plan')?.value) {
    response.cookies.set('user_plan', userPlanFromSession, {
      maxAge: 24 * 60 * 60, // 1日
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
  
  // 有料会員の場合、ログイン済みで課金期間中ならURLから直接アクセス可能
  let hasActiveSubscription = false;
  let subscriptionCheckError = false;
  if (isPremiumUser && token?.email) {
    try {
      const user = await prisma.users.findUnique({
        where: { email: token.email as string },
        select: {
          plan_type: true,
          subscription_end_date: true,
        },
      });
      
      if (user && user.plan_type !== PlanType.FREE && user.subscription_end_date) {
        const now = new Date();
        hasActiveSubscription = user.subscription_end_date > now;
        
        if (hasActiveSubscription) {
          console.log('有料会員: ログイン済みで課金期間中 - URLから直接アクセス許可', {
            email: token.email,
            planType: user.plan_type,
            subscriptionEndDate: user.subscription_end_date,
            pathname: request.nextUrl.pathname,
          });
        } else {
          console.log('有料会員: ログイン済みだが課金期間が終了', {
            email: token.email,
            planType: user.plan_type,
            subscriptionEndDate: user.subscription_end_date,
            now: now.toISOString(),
            pathname: request.nextUrl.pathname,
          });
        }
      } else if (user && user.plan_type === PlanType.FREE) {
        console.log('有料会員判定だが、データベースでは無料プラン', {
          email: token.email,
          planType: user.plan_type,
          pathname: request.nextUrl.pathname,
        });
      }
    } catch (error) {
      subscriptionCheckError = true;
      console.error('課金期間確認エラー:', error);
      // エラーが発生した場合は、Utage経由でのアクセスを促す
    }
  }
  
  // 有料会員のみUtageからのアクセス制限を適用
  // 無料ユーザーは自由にアクセス可能
  // ログイン済みで課金期間中の場合は、Utageからのアクセスでなくても許可
  // 課金期間確認でエラーが発生した場合も、Utage経由でのアクセスを促す
  if (isPremiumUser && !hasUtageAccess && !hasActiveSubscription && pathname !== '/login-utage' && pathname !== '/auth/login-utage') {
    // 開発環境では、ngrok経由のアクセスを許可
    const isNgrok = request.nextUrl.hostname.includes('ngrok-free.app') || 
                    request.nextUrl.hostname.includes('ngrok.io') ||
                    request.nextUrl.hostname === 'localhost';
    
    if (isNgrok && process.env.NODE_ENV !== 'production') {
      // 開発環境でngrok経由の場合は許可（refererがない場合でも）
      console.log('開発環境: ngrok経由のアクセスを許可:', { 
        hostname: request.nextUrl.hostname,
        pathname: request.nextUrl.pathname
      });
      return response;
    }
    
    console.warn('有料会員: Utage以外からのアクセスを拒否:', { 
      referer, 
      origin, 
      pathname: request.nextUrl.pathname,
      utageSession,
      hostname: request.nextUrl.hostname,
      userPlan
    });
    
    // セッションが期限切れか、セッションがない場合のメッセージ
    const isSessionExpired = utageSession && sessionTimestamp && (now - sessionTimestamp >= sessionMaxAge);
    const hasSessionButExpired = isSessionExpired;
    const isLoggedInButNoActiveSubscription = token?.email && !hasActiveSubscription;
    
    let message = '';
    if (subscriptionCheckError) {
      message = '課金状況の確認中にエラーが発生しました。会員ページから再度ログインしてください。';
    } else if (hasSessionButExpired) {
      message = 'セッションの有効期限が切れています。会員ページから再度ログインしてください。';
    } else if (isLoggedInButNoActiveSubscription) {
      message = 'ログインは確認できましたが、課金期間が終了しているか、確認できませんでした。会員ページから入り直してください。';
    } else {
      message = 'このアプリへのアクセスにはログインが必要です。会員ページからログインしてください。';
    }
    
    return new NextResponse(getAccessDeniedHTML(message, true), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  
  // 無料ユーザーは自由にアクセス可能（ログは記録しない）
  if (!isPremiumUser) {
    console.log('無料ユーザー: アクセス許可', {
      pathname: request.nextUrl.pathname,
      userPlan
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
