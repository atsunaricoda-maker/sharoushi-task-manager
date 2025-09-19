/**
 * セキュリティ設定
 */

export function getCorsOrigins(env: any): string[] {
  // 本番環境
  if (env.ENVIRONMENT === 'production') {
    return [
      env.APP_URL || 'https://sharoushi-task-manager.pages.dev'
    ]
  }
  
  // 開発環境
  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://*.pages.dev',
    'https://*.e2b.dev' // Sandbox環境
  ]
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Content Type Options
    'X-Content-Type-Options': 'nosniff',
    
    // Frame Options (Clickjacking対策)
    'X-Frame-Options': 'DENY',
    
    // Content Security Policy
    'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net;",
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  }
}

// Rate Limiting設定
export const RATE_LIMIT_CONFIG = {
  // APIエンドポイントのレート制限
  api: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 100 // 1分あたり100リクエストまで
  },
  
  // 認証エンドポイントのレート制限（より厳しく）
  auth: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 5 // 15分あたり5回まで
  },
  
  // AI生成エンドポイントのレート制限（コスト対策）
  ai: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 10 // 1分あたり10リクエストまで
  }
}