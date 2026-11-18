// 负责人：D
// 相册：创建 / 列表 / 详情 / 加照片 / 生成分享链接
// 接口定义见 docs/api-contract.md 第 6、7 节

import { randomBytes } from 'node:crypto'

import { Router } from 'express'

import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

export const albumsRouter = Router()

/** POST /api/albums */
albumsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name } = (req.body ?? {}) as { name?: unknown }
    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: '相册名不能为空' } })
      return
    }
    const album = await prisma.album.create({ data: { ownerId: req.userId!, name: name.trim() } })
    res.json({ data: { id: album.id, name: album.name, count: 0 } })
  } catch (err) {
    next(err)
  }
})

/** GET /api/albums */
albumsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const albums = await prisma.album.findMany({
      where: { ownerId: req.userId! },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { assets: true } } },
    })
    res.json({
      data: albums.map((a) => ({ id: a.id, name: a.name, coverAssetId: a.coverAssetId, count: a._count.assets })),
    })
  } catch (err) {
    next(err)
  }
})

/** POST /api/albums/:id/assets */
albumsRouter.post('/:id/assets', requireAuth, async (req, res, next) => {
  try {
    const album = await prisma.album.findFirst({ where: { id: req.params.id, ownerId: req.userId! } })
    if (!album) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '相册不存在' } })
      return
    }
    const { assetIds } = (req.body ?? {}) as { assetIds?: unknown }
    if (!Array.isArray(assetIds)) {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: 'assetIds 必须是数组' } })
      return
    }

    for (const assetId of assetIds) {
      if (typeof assetId !== 'string') continue
      await prisma.albumAsset
        .create({ data: { albumId: album.id, assetId } })
        .catch(() => undefined) // 重复添加直接忽略
    }
    const count = await prisma.albumAsset.count({ where: { albumId: album.id } })
    if (!album.coverAssetId) {
      await prisma.album.update({ where: { id: album.id }, data: { coverAssetId: String(assetIds[0]) } })
    }
    res.json({ data: { ok: true, count } })
  } catch (err) {
    next(err)
  }
})

/** GET /api/albums/:id */
albumsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const album = await prisma.album.findFirst({
      where: { id: req.params.id, ownerId: req.userId! },
      include: { assets: { include: { asset: true } } },
    })
    if (!album) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '相册不存在' } })
      return
    }
    res.json({
      data: {
        id: album.id,
        name: album.name,
        assets: album.assets.map(({ asset }) => ({
          id: asset.id,
          thumbUrl: asset.thumbPath ?? undefined,
          fileUrl: asset.filePath,
          originalName: asset.originalName ?? undefined,
          takenAt: asset.takenAt?.toISOString(),
          isFavorite: asset.isFavorite,
        })),
      },
    })
  } catch (err) {
    next(err)
  }
})

/** POST /api/albums/:id/share */
albumsRouter.post('/:id/share', requireAuth, async (req, res, next) => {
  try {
    const album = await prisma.album.findFirst({ where: { id: req.params.id, ownerId: req.userId! } })
    if (!album) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '相册不存在' } })
      return
    }
    const { expiresInDays } = (req.body ?? {}) as { expiresInDays?: unknown }
    const expiresAt =
      typeof expiresInDays === 'number'
        ? new Date(Date.now() + expiresInDays * 24 * 3600 * 1000)
        : null

    const key = randomBytes(12).toString('base64url').slice(0, 20)
    await prisma.share.create({ data: { key, albumId: album.id, expiresAt } })
    res.json({ data: { key, url: `/s/${key}` } })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/albums/:id —— 删除相册（照片本身不删，只解除关联；分享链接一起失效） */
albumsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const album = await prisma.album.findFirst({ where: { id: req.params.id, ownerId: req.userId! } })
    if (!album) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '相册不存在' } })
      return
    }
    // AlbumAsset / Share 关系在 schema 里配了 onDelete: Cascade，删相册会自动清理
    await prisma.album.delete({ where: { id: album.id } })
    res.json({ data: { ok: true } })
  } catch (err) {
    next(err)
  }
})