// 负责人：D
// 地图：有 GPS 的照片按坐标聚合成点
// 接口定义见 docs/api-contract.md 第 4 节

import { Router } from 'express'

import { guessCity } from '../lib/exif'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

export const mapRouter = Router()

/** GET /api/map/points */
mapRouter.get('/points', requireAuth, async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { ownerId: req.userId!, lat: { not: null }, lng: { not: null } },
      select: { id: true, lat: true, lng: true },
      take: 5000,
    })

    // 0.05 度网格约等于 5 公里，够用了
    const buckets = new Map<string, { lat: number; lng: number; count: number; sampleAssetId: string }>()
    for (const a of assets) {
      if (a.lat == null || a.lng == null) continue
      const key = `${a.lat.toFixed(2)},${a.lng.toFixed(2)}`
      const hit = buckets.get(key)
      if (hit) hit.count += 1
      else buckets.set(key, { lat: a.lat, lng: a.lng, count: 1, sampleAssetId: a.id })
    }

    res.json({
      data: [...buckets.values()].map((b) => ({ ...b, city: guessCity(b.lat, b.lng) ?? undefined })),
    })
  } catch (err) {
    next(err)
  }
})