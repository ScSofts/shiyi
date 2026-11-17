// 负责人：C
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { JWT_SECRET } from '../env'

export type JwtPayload = { sub: string; email: string }

export function signToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email } satisfies JwtPayload, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } })
    return
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '登录已过期，请重新登录' } })
  }
}