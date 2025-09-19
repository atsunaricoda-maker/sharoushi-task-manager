import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'

export async function requireAuth(c: Context, next: Next) {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401)
  }
  
  const payload = await verifyToken(token, c.env.JWT_SECRET || 'dev-secret')
  
  if (!payload) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401)
  }
  
  // ユーザー情報をコンテキストに設定
  c.set('user', {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role || 'user',
    organizationId: payload.organizationId || 1
  })
  
  await next()
}