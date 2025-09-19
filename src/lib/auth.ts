import { SignJWT, jwtVerify } from 'jose'
import type { Context } from 'hono'

export interface User {
  id: number
  email: string
  name: string
  role: string
  avatar_url?: string
}

export interface JWTPayload {
  sub: string // user id
  email: string
  name: string
  role: string
  exp?: number
}

// JWT token generation
export async function generateToken(user: User, secret: string): Promise<string> {
  const jwt = await new SignJWT({
    sub: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(new TextEncoder().encode(secret))

  return jwt
}

// JWT token verification
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    )
    return payload as JWTPayload
  } catch {
    return null
  }
}

// Get user from database
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const user = await db.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first<User>()
  
  return user
}

// Create or update user
export async function upsertUser(
  db: D1Database, 
  email: string, 
  name: string, 
  avatar_url?: string
): Promise<User> {
  // Check if user exists
  let user = await getUserByEmail(db, email)
  
  if (user) {
    // Update existing user
    await db.prepare(
      'UPDATE users SET name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?'
    ).bind(name, avatar_url || null, email).run()
    
    user = await getUserByEmail(db, email)
  } else {
    // Create new user
    const result = await db.prepare(
      'INSERT INTO users (email, name, avatar_url, role) VALUES (?, ?, ?, ?)'
    ).bind(email, name, avatar_url || null, 'sharoushi').run()
    
    user = {
      id: result.meta.last_row_id as number,
      email,
      name,
      role: 'sharoushi',
      avatar_url
    }
  }
  
  return user!
}

// Middleware to check authentication
export async function requireAuth(c: Context, next: Function) {
  const token = c.req.cookie('auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const payload = await verifyToken(token, c.env.JWT_SECRET)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  // Add user info to context
  c.set('user', payload)
  
  await next()
}