import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'
import crypto from 'crypto'

// ワンタイムトークンの管理（インメモリ）
// 本番環境では、Redisなどの共有キャッシュを使用することを推奨
const usedTokens = new Map<string, number>() // tokenHash -> timestamp

// トークンのハッシュを計算
function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// レート制限の管理（インメモリ）
// 本番環境では、Redisなどの共有キャッシュを使用することを推奨
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// レート制限をチェック
function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// 定数時間比較（タイミングアタック対策）
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// メールアドレスをマスク
function maskEmail(email: string): string {
  if (!email || email.length < 3) return '***'
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const maskedLocal = local.substring(0, 2) + '***'
  return `${maskedLocal}@${domain}`
}

// メールアドレスの形式を検証
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Utageからのログインリクエストを処理
 * 
 * セキュリティ対策:
 * 1. メールアドレスでユーザーを検索
 * 2. データベースで課金状況を確認
 * 3. 課金が有効な場合のみ、ログインを許可
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    if (!email || !token) {
      const isDevelopment = process.env.NODE_ENV === 'development'
      return NextResponse.json(
        { error: isDevelopment ? 'Email and token are required' : 'Authentication failed' },
        { status: 400 }
      )
    }

    // メールアドレスの形式を検証
    if (!isValidEmail(email)) {
      const isDevelopment = process.env.NODE_ENV === 'development'
      return NextResponse.json(
        { error: isDevelopment ? 'Invalid email format' : 'Authentication failed' },
        { status: 400 }
      )
    }

    // レート制限をチェック
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const rateLimitKey = `login:${clientIp}`
    const maxRequests = 10 // 1分間に10回まで
    const windowMs = 60 * 1000 // 1分
    
    if (!checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
      console.warn('Rate limit exceeded:', maskEmail(email), { clientIp })
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // トークンの検証（開発環境では緩和）
    // 注意: 本番環境では、Utage APIから取得したHMAC署名されたトークンを使用
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    try {
      let tokenData: { email: string; timestamp: number }
      
      // まず、base64デコードを試行
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      
      try {
        // 形式1: { data: "...", signature: "..." } 形式（本番環境用）
        const parsed = JSON.parse(decoded)
        if (parsed.data && parsed.signature) {
          // 開発環境では、署名チェックをスキップ
          if (!isDevelopment) {
            // 本番環境では、HMAC署名の検証を厳密に行う
            const secret = process.env.UTAGE_TOKEN_SECRET || 'your-secret-key'
            const expectedSignature = crypto
              .createHmac('sha256', secret)
              .update(parsed.data)
              .digest('hex')
            
            if (!constantTimeEquals(parsed.signature, expectedSignature)) {
              console.warn('Invalid token signature:', maskEmail(email), {
                received: parsed.signature.substring(0, 20) + '...',
              })
              return NextResponse.json(
                { error: isDevelopment ? 'Invalid token' : 'Authentication failed' },
                { status: 401 }
              )
            }
          }
          
          // dataフィールドからトークンデータを取得
          tokenData = JSON.parse(parsed.data)
        } else {
          // 形式2: { email: "...", timestamp: ... } 形式（開発環境用の簡易形式）
          tokenData = parsed
        }
      } catch (parseError) {
        // base64デコード後のJSONパースに失敗した場合
        console.error('Failed to parse token:', maskEmail(email))
        return NextResponse.json(
          { error: isDevelopment ? 'Invalid token format' : 'Authentication failed' },
          { status: 401 }
        )
      }

      // トークンの有効期限を確認（開発環境では24時間、本番環境では5分）
      const maxAge = isDevelopment ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000
      const now = Date.now()
      const tokenAge = now - tokenData.timestamp

      if (tokenAge > maxAge) {
        console.warn('Token expired:', maskEmail(email), { tokenAge, maxAge })
        return NextResponse.json(
          { error: isDevelopment ? 'Token expired' : 'Authentication failed' },
          { status: 401 }
        )
      }

      // メールアドレスの一致を確認
      if (tokenData.email !== email) {
        console.warn('Email mismatch:', { 
          provided: maskEmail(email), 
          token: maskEmail(tokenData.email) 
        })
        return NextResponse.json(
          { error: isDevelopment ? 'Email mismatch' : 'Authentication failed' },
          { status: 401 }
        )
      }
      
      console.log('Token verification passed:', maskEmail(email), {
        isDevelopment,
        tokenFormat: tokenData.email ? 'simple' : 'signed',
      })
      
      // ワンタイムトークンの検証：使用済みかどうかを確認
      const tokenHash = getTokenHash(token)
      const usedAt = usedTokens.get(tokenHash)
      
      if (usedAt) {
        // 24時間以上経過したトークンは削除
        const tokenMaxAge = 24 * 60 * 60 * 1000 // 24時間
        if (now - usedAt > tokenMaxAge) {
          usedTokens.delete(tokenHash)
        } else {
          console.warn('Token already used:', maskEmail(email), { tokenHash: tokenHash.substring(0, 16) + '...' })
          return NextResponse.json(
            { error: isDevelopment ? 'Token already used. Please generate a new link from Utage.' : 'Authentication failed' },
            { status: 401 }
          )
        }
      }
      
      // トークンを使用済みとしてマーク（ワンタイムトークン）
      usedTokens.set(tokenHash, now)
      console.log('Token marked as used:', maskEmail(email), { tokenHash: tokenHash.substring(0, 16) + '...' })
      
      // メモリリークを防ぐため、古いトークンハッシュを定期的にクリア
      if (usedTokens.size > 1000) {
        const tokenMaxAge = 24 * 60 * 60 * 1000 // 24時間
        for (const [hash, timestamp] of usedTokens.entries()) {
          if (now - timestamp > tokenMaxAge) {
            usedTokens.delete(hash)
          }
        }
      }
    } catch (error) {
      const isDevelopment = process.env.NODE_ENV === 'development'
      console.error('Token verification failed:', maskEmail(email))
      return NextResponse.json(
        { error: isDevelopment ? 'Invalid token format' : 'Authentication failed' },
        { status: 401 }
      )
    }

    // ユーザーを検索
    let user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      // 本番環境で開発環境用の設定が有効になっている場合の警告
      if (!isDevelopment && process.env.UTAGE_AUTO_CREATE_USER === 'true') {
        console.error('SECURITY WARNING: UTAGE_AUTO_CREATE_USER is set in production! This should never happen.')
      }
      
      // 開発環境では、ユーザーが見つからない場合は一時的に作成（テスト用）
      if (isDevelopment && process.env.UTAGE_AUTO_CREATE_USER === 'true') {
        console.warn('User not found in development mode, creating temporary user:', email)
        
        const now = new Date()
        const subscriptionEndDate = new Date(now)
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1) // 1ヶ月間有効
        
        user = await prisma.users.create({
          data: {
            id: crypto.randomUUID(),
            email: email,
            name: null,
            password: null, // Utage経由の場合はパスワードなし
            plan_type: PlanType.PREMIUM_MONTHLY,
            subscription_start_date: now,
            subscription_end_date: subscriptionEndDate,
            email_verified: now, // Utage経由なのでメール認証済み
            updated_at: now,
          },
        })
        
        console.log('Temporary user created for development:', user.id, {
          email,
          subscriptionEndDate: subscriptionEndDate.toISOString(),
        })
      } else {
        console.warn('User not found:', email)
        return NextResponse.json(
          { error: 'User not found. Please purchase the subscription first. The Utage webhook should create the user automatically.' },
          { status: 404 }
        )
      }
    }

    console.log('User found:', {
      email: user.email,
      planType: user.plan_type,
      subscriptionEndDate: user.subscription_end_date,
      subscriptionStartDate: user.subscription_start_date,
    })

    // 課金状況を確認
    const now = new Date()
    const isSubscriptionActive = 
      user.plan_type !== PlanType.FREE &&
      user.subscription_end_date &&
      user.subscription_end_date > now

    // 開発環境では、ユーザーが存在する場合は一時的に許可（テスト用）
    const allowInDevelopment = isDevelopment && process.env.UTAGE_ALLOW_DEV_LOGIN === 'true'

    if (!isSubscriptionActive && !allowInDevelopment) {
      console.warn('Subscription expired or inactive:', email, {
        planType: user.plan_type,
        subscriptionEndDate: user.subscription_end_date,
        now: now.toISOString(),
        isFree: user.plan_type === PlanType.FREE,
        hasEndDate: !!user.subscription_end_date,
        isExpired: user.subscription_end_date ? user.subscription_end_date <= now : true,
      })
      return NextResponse.json(
        { 
          error: 'Subscription expired',
          message: '課金が終了しています。Utageで再度購入してください。',
          planType: user.plan_type,
          subscriptionEndDate: user.subscription_end_date,
          debug: {
            isFree: user.plan_type === PlanType.FREE,
            hasEndDate: !!user.subscription_end_date,
            isExpired: user.subscription_end_date ? user.subscription_end_date <= now : true,
            now: now.toISOString(),
          },
        },
        { status: 403 }
      )
    }

    if (allowInDevelopment) {
      console.warn('Development mode: Allowing login without active subscription', email)
    }

    // ログイン成功
    // Utage認証用の一時トークンを生成（NextAuthで使用）
    const utageToken = crypto.randomBytes(32).toString('hex')
    
    // トークンをデータベースに保存（オプション、セキュリティ向上のため）
    // 実際の実装では、Redisなどのキャッシュに保存することを推奨
    
    console.log('Login successful:', email, {
      planType: user.plan_type,
      subscriptionEndDate: user.subscription_end_date,
    })

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planType: user.plan_type,
        subscriptionEndDate: user.subscription_end_date,
      },
      utageToken, // NextAuthで使用する一時トークン
      redirectUrl: '/search', // ログイン後のリダイレクト先
    });

    // セッションクッキーを設定（ログイン成功時）
    const sessionNow = Date.now();
    response.cookies.set('utage_access', 'true', {
      maxAge: 24 * 60 * 60, // 1日
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // セッションタイムスタンプを保存
    response.cookies.set('utage_access_timestamp', sessionNow.toString(), {
      maxAge: 24 * 60 * 60, // 1日
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // ユーザーIDをクッキーに保存（異常検出用）
    response.cookies.set('userId', user.id, {
      maxAge: 24 * 60 * 60, // 1日
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // プラン情報をクッキーに保存（有料会員かどうかを判定するため）
    const isPremium = user.plan_type !== 'FREE';
    response.cookies.set('user_plan', isPremium ? 'premium' : 'free', {
      maxAge: 24 * 60 * 60, // 1日
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    console.log('ログイン成功: セッションクッキーを設定', {
      userId: user.id,
      email: maskEmail(email),
      planType: user.plan_type,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed', details: String(error) },
      { status: 500 }
    )
  }
}

// GETメソッドでトークン検証（オプション）
// シンプル版: メールアドレスのみでログイン（開発環境用）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  // シンプル版: メールアドレスのみでログイン（開発環境用）
  const isDevelopment = process.env.NODE_ENV === 'development'
  const allowSimpleLogin = isDevelopment && process.env.UTAGE_ALLOW_SIMPLE_LOGIN === 'true'

  if (allowSimpleLogin && email && !token) {
    // メールアドレスのみでログイン（開発環境用）
    console.log('Simple login mode (development):', email)
    
    try {
      const user = await prisma.users.findUnique({
        where: { email },
      })

      if (!user) {
        return NextResponse.redirect(
          new URL(`/auth/login-utage?error=user_not_found&email=${encodeURIComponent(email)}`, request.url)
        )
      }

      // 開発環境では、課金状況に関係なくログインを許可
      const utageToken = crypto.randomBytes(32).toString('hex')
      
      console.log('Simple login successful:', email)

      // フロントエンドページにリダイレクト（トークン付き）
      return NextResponse.redirect(
        new URL(`/auth/login-utage?email=${encodeURIComponent(email)}&token=${utageToken}&simple=true`, request.url)
      )
    } catch (error) {
      console.error('Simple login error:', error)
      return NextResponse.redirect(
        new URL(`/auth/login-utage?error=login_failed&email=${encodeURIComponent(email || '')}`, request.url)
      )
    }
  }

  // 通常のトークン検証
  if (!email || !token) {
    return NextResponse.json(
      { error: 'Email and token are required' },
      { status: 400 }
    )
  }

  // POSTメソッドと同じ処理を実行
  const response = await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ email, token }),
      headers: { 'Content-Type': 'application/json' },
    })
  )

  return response
}
