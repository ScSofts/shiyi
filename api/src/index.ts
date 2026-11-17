// 负责人：C
// 服务入口：装中间件、挂路由、建默认账号、起服务

import 'dotenv/config'

import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import path from 'node:path'

import { CORS_ORIGIN, DATA_DIR, PORT } from './env'
import { aiHealth } from './lib/ai'
import { prisma } from './lib/prisma'
import { ensureDirs } from './lib/storage'
import { errorHandler, notFound } from './middleware/error'
import { albumsRouter } from './routes/albums'
import { assetsRouter } from './routes/assets'
import { authRouter } from './routes/auth'
import { mapRouter } from './routes/map'
import { peopleRouter } from './routes/people'
import { searchRouter } from './routes/search'
import { shareRouter } from './routes/share'

const app = express()

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

// 照片和缩略图的静态访问
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')))
app.use('/thumbs', express.static(path.join(DATA_DIR, 'thumbs')))

app.get('/api/health', async (_req, res) => {
  const ai = await aiHealth()
  res.json({ data: { status: 'ok', ai: ai ?? { status: 'down', mode: 'unknown' } } })
})

app.use('/api/auth', authRouter)
app.use('/api/assets', assetsRouter)
app.use('/api/people', peopleRouter)
app.use('/api/map', mapRouter)
app.use('/api/search', searchRouter)
app.use('/api/albums', albumsRouter)
app.use('/api/share', shareRouter)

app.use(notFound)
app.use(errorHandler)

/** 第一次启动时自动建一个演示账号：demo@shiyi.local / demo1234 */
async function ensureDemoUser() {
  const count = await prisma.user.count()
  if (count > 0) return
  await prisma.user.create({
    data: { email: 'demo@shiyi.local', passwordHash: bcrypt.hashSync('demo1234', 10) },
  })
  console.log('[init] 已创建演示账号 demo@shiyi.local / demo1234')
}

async function main() {
  ensureDirs()
  await ensureDemoUser()
  app.listen(PORT, () => {
    console.log(`[api] http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('[api] 启动失败', err)
  process.exit(1)
})