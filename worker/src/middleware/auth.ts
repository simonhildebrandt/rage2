import { createMiddleware } from 'hono/factory'
import { jwtVerify } from 'jose'
import type { Env } from '../types'

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const auth = c.req.header('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const secret = new TextEncoder().encode(c.env.LOGIN_WITH_LINK_SECRET)
    const { payload } = await jwtVerify(token, secret)
    c.set('user' as never, payload)
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }

  await next()
})
