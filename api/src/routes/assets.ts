// 负责人：C
// 上传 / 列表 / 详情 / 收藏 / 删除
// 接口定义见 docs/api-contract.md 第 2 节

import path from 'node:path'
import { randomUUID } from 'node:crypto'

import { Router } from 'express'
import multer from 'multer'
import type { Prisma } from '@prisma/client'

import { MAX_UPLOAD_MB, UPLOAD_DIR } from '../env'
import { embedImage } from '../lib/ai'
import { guessCity, readExif } from '../lib/exif'
import { syncFacesFromAi } from '../lib/faces'
import { prisma } from '../lib/prisma'
import { publicUrl, thumbnailUrl } from '../lib/storage'
import { makeThumb } from '../lib/thumb'
import { requireAuth } from '../middleware/auth'

export const assetsRouter = Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
      cb(null, `${randomUUID()}${ext}`)
    },
  }),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

function toDto(a: {
  id: string
  thumbPath: string | null
  filePath: string
  originalName: string | null
  takenAt: Date | null
  lat: number | null
  lng: number | null
  cameraModel: string | null
  width: number | null
  height: number | null
  isFavorite: boolean
}) {
  return {
    id: a.id,
    thumbUrl: thumbnailUrl(a.thumbPath),
    fileUrl: a.filePath,
    originalName: a.originalName ?? undefined,
    takenAt: a.takenAt?.toISOString(),
    lat: a.lat ?? undefined,
    lng: a.lng ?? undefined,
    city: guessCity(a.lat, a.lng) ?? undefined,
    cameraModel: a.cameraModel ?? undefined,
    width: a.width ?? undefined,
    height: a.height ?? undefined,
    isFavorite: a.isFavorite,
  }
}

/** POST /api/assets —— 上传（可多张） */
assetsRouter.post('/', requireAuth, upload.array('files', 20), async (req, res, next) => {
  try {
    const files = (req.files ?? []) as Express.Multer.File[]
    if (files.length === 0) {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: '没有收到文件' } })
      return
    }

    const created = []
    for (const file of files) {
      const exif = await readExif(file.path)
      const asset = await prisma.asset.create({
        data: {
          ownerId: req.userId!,
          filePath: publicUrl(file.path),
          originalName: file.originalname,
          mimeType: file.mimetype,
          takenAt: exif.takenAt ?? new Date(),
          lat: exif.lat,
          lng: exif.lng,
          cameraModel: exif.cameraModel,
          width: exif.width,
          height: exif.height,
        },
      })

      const thumb = await makeThumb(file.path, asset.id).catch(() => null)
      const updated = await prisma.asset.update({
        where: { id: asset.id },
        data: {
          thumbPath: thumb ? publicUrl(thumb.thumbAbsPath) : null,
          width: asset.width ?? thumb?.width ?? null,
          height: asset.height ?? thumb?.height ?? null,
        },
      })
      created.push(toDto(updated))

      // AI 处理放在后台，不要阻塞上传响应（AI 服务没起也不影响）
      void (async () => {
        const result = await embedImage(asset.id, file.path)
        await syncFacesFromAi(req.userId!, asset.id, result)
      })()
    }

    res.json({ data: created })
  } catch (err) {
    next(err)
  }
})

/** GET /api/assets?page&pageSize&month&personId&albumId */
assetsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 50)))
    const { month, personId, albumId } = req.query as Record<string, string | undefined>

    const where: Prisma.AssetWhereInput = { ownerId: req.userId! }

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const start = new Date(`${month}-01T00:00:00.000Z`)
      const end = new Date(start)
      end.setUTCMonth(end.getUTCMonth() + 1)
      where.takenAt = { gte: start, lt: end }
    }
    if (personId) where.persons = { some: { personId } }
    if (albumId) where.albums = { some: { albumId } }

    const [total, rows] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        orderBy: { takenAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    res.json({ data: rows.map(toDto), meta: { page, pageSize, total } })
  } catch (err) {
    next(err)
  }
})

/** GET /api/assets/:id */
assetsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, ownerId: req.userId! },
      include: { persons: { include: { person: true } } },
    })
    if (!asset) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '照片不存在' } })
      return
    }
    res.json({
      data: {
        ...toDto(asset),
        persons: asset.persons.map((p) => ({ id: p.person.id, name: p.person.name })),
      },
    })
  } catch (err) {
    next(err)
  }
})

/** PATCH /api/assets/:id —— 目前只有收藏 */
assetsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { isFavorite } = (req.body ?? {}) as { isFavorite?: unknown }
    const updated = await prisma.asset.updateMany({
      where: { id: req.params.id, ownerId: req.userId! },
      data: { isFavorite: Boolean(isFavorite) },
    })
    if (updated.count === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '照片不存在' } })
      return
    }
    res.json({ data: { ok: true } })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/assets/:id */
assetsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await prisma.asset.deleteMany({ where: { id: req.params.id, ownerId: req.userId! } })
    if (deleted.count === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '照片不存在' } })
      return
    }
    res.json({ data: { ok: true } })
  } catch (err) {
    next(err)
  }
})
