// 负责人：C
import bcrypt from 'bcryptjs'
import { Router } from 'express'

import { prisma } from '../lib/prisma'
import { requireAuth, signToken } from '../middleware/auth'

export const authRouter = Router()

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown }
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: '邮箱和密码不能为空' } })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '邮箱或密码错误' } })
      return
    }

    res.json({ data: { token: signToken(user.id, user.email), user: { id: user.id, email: user.email } } })
  } catch (err) {
    next(err)
  }
})

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } })
      return
    }
    res.json({ data: { id: user.id, email: user.email } })
  } catch (err) {
    next(err)
  }
})