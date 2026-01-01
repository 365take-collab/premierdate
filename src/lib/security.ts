import crypto from 'crypto';

// 異常検出用のアクセス記録
interface AccessRecord {
  userId: string;
  path: string;
  timestamp: number;
  ip?: string;
}

const accessRecords: Map<string, AccessRecord[]> = new Map();

/**
 * 異常なアクセスパターンを検出
 * @param userId ユーザーID
 * @param requestPath リクエストパス
 * @param timestamp タイムスタンプ
 * @param ip IPアドレス（オプション）
 * @returns 異常なパターンの場合はtrue
 */
export function detectAnomalousPattern(
  userId: string,
  requestPath: string,
  timestamp: number,
  ip?: string
): { isAnomalous: boolean; reason?: string } {
  const now = timestamp;
  const key = `access:${userId}`;
  
  // 過去のアクセス記録を取得
  let records = accessRecords.get(key) || [];
  
  // 5分以上前の記録を削除（メモリ節約）
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  records = records.filter(r => r.timestamp > fiveMinutesAgo);
  
  // 現在のアクセスを記録
  records.push({
    userId,
    path: requestPath,
    timestamp: now,
    ip,
  });
  
  // 最新100件のみ保持
  if (records.length > 100) {
    records = records.slice(-100);
  }
  
  accessRecords.set(key, records);
  
  // 異常検出のチェック
  
  // 1. 短時間に大量のリクエスト（1分間に30回以上）
  const oneMinuteAgo = now - 60 * 1000;
  const recentRequests = records.filter(r => r.timestamp > oneMinuteAgo);
  if (recentRequests.length > 30) {
    console.warn('異常検出: 短時間に大量のリクエスト', {
      userId,
      count: recentRequests.length,
      path: requestPath,
    });
    return { isAnomalous: true, reason: 'too_many_requests' };
  }
  
  // 2. 不自然なパスへの連続アクセス（同じパスに1秒以内に5回以上）
  const oneSecondAgo = now - 1000;
  const samePathRequests = records.filter(
    r => r.timestamp > oneSecondAgo && r.path === requestPath
  );
  if (samePathRequests.length > 5) {
    console.warn('異常検出: 同じパスへの連続アクセス', {
      userId,
      path: requestPath,
      count: samePathRequests.length,
    });
    return { isAnomalous: true, reason: 'rapid_same_path_access' };
  }
  
  // 3. 複数のIPアドレスからの同時アクセス（5分以内に3つ以上の異なるIP）
  if (ip) {
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentIPs = new Set(
      records
        .filter(r => r.timestamp > fiveMinutesAgo && r.ip)
        .map(r => r.ip!)
    );
    if (recentIPs.size > 3) {
      console.warn('異常検出: 複数のIPアドレスからの同時アクセス', {
        userId,
        ipCount: recentIPs.size,
        ips: Array.from(recentIPs),
      });
      return { isAnomalous: true, reason: 'multiple_ips' };
    }
  }
  
  // 4. 不自然なパスパターン（APIエンドポイントへの異常なアクセス）
  const suspiciousPaths = [
    '/api/auth/login-utage',
    '/api/webhooks/utage',
  ];
  if (suspiciousPaths.includes(requestPath)) {
    // これらのパスへの異常に頻繁なアクセスをチェック
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const suspiciousRequests = records.filter(
      r => r.timestamp > tenMinutesAgo && suspiciousPaths.includes(r.path)
    );
    if (suspiciousRequests.length > 20) {
      console.warn('異常検出: 機密APIへの異常なアクセス', {
        userId,
        path: requestPath,
        count: suspiciousRequests.length,
      });
      return { isAnomalous: true, reason: 'suspicious_api_access' };
    }
  }
  
  return { isAnomalous: false };
}

/**
 * IPアドレスを取得（プロキシ経由の場合も考慮）
 * @param requestHeaders リクエストヘッダー
 * @returns IPアドレス
 */
export function getClientIP(requestHeaders: Headers): string {
  // X-Forwarded-Forヘッダーから取得（最初のIPがクライアントのIP）
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }
  
  // X-Real-IPヘッダーから取得
  const realIP = requestHeaders.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}
