// 负责人：D
// 语义搜索：把中文描述转发给 AI 服务，拿回资产 id 列表再查库
// 接口定义见 docs/api-contract.md 第 5 节

import { Router } from 'express'

import { semanticSearch } from '../lib/ai'
import { prisma } from '../lib/prisma'
import { thumbnailUrl } from '../lib/storage'
import { requireAuth } from '../middleware/auth'

export const searchRouter = Router()

searchRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (!q) {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: '搜索词不能为空' } })
      return
    }
    const topK = Math.min(50, Number(req.query.topK ?? 20))

    const aiResult = await semanticSearch(q, topK)
    if (!aiResult || aiResult.results.length === 0) {
      // AI 服务没起或没有命中：退化成按文件名/城市模糊匹配，保证页面不空白
      const fallback = await prisma.asset.findMany({
        where: { ownerId: req.userId!, originalName: { contains: q } },
        take: topK,
      })
      res.json({
        data: fallback.map((a) => ({
          assetId: a.id,
          score: 0,
          asset: { id: a.id, thumbUrl: thumbnailUrl(a.thumbPath), originalName: a.originalName ?? undefined },
        })),
      })
      return
    }

    const ids = aiResult.results.map((r) => r.assetId)
    const assets = await prisma.asset.findMany({ where: { id: { in: ids }, ownerId: req.userId! } })
    const byId = new Map(assets.map((a) => [a.id, a]))
    const scoreById = new Map(aiResult.results.map((r) => [r.assetId, r.score]))

    res.json({
      data: ids
        .map((id) => byId.get(id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
        .map((a) => ({
          assetId: a.id,
          score: scoreById.get(a.id) ?? 0,
          asset: { id: a.id, thumbUrl: thumbnailUrl(a.thumbPath), originalName: a.originalName ?? undefined },
        })),
    })
  } catch (err) {
    next(err)
  }
})
