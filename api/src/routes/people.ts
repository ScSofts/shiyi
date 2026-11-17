// 负责人：D
// 人物：列表 / 命名 / 合并 / 拆分
// 接口定义见 docs/api-contract.md 第 3 节

import { Router } from 'express'

import { mergePersons, splitPerson } from '../lib/ai'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

export const peopleRouter = Router()

/** GET /api/people */
peopleRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const people = await prisma.person.findMany({
      where: { ownerId: req.userId! },
      orderBy: { faceCount: 'desc' },
    })
    res.json({
      data: people.map((p) => ({ id: p.id, name: p.name, coverAssetId: p.coverAssetId, faceCount: p.faceCount })),
    })
  } catch (err) {
    next(err)
  }
})

/** PATCH /api/people/:id —— 命名 */
peopleRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { name } = (req.body ?? {}) as { name?: unknown }
    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: '名字不能为空' } })
      return
    }
    const updated = await prisma.person.updateMany({
      where: { id: req.params.id, ownerId: req.userId! },
      data: { name: name.trim() },
    })
    if (updated.count === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '人物不存在' } })
      return
    }
    res.json({ data: { ok: true } })
  } catch (err) {
    next(err)
  }
})

/** POST /api/people/merge —— 把 mergeId 合并进 keepId */
peopleRouter.post('/merge', requireAuth, async (req, res, next) => {
  try {
    const { keepId, mergeId } = (req.body ?? {}) as { keepId?: string; mergeId?: string }
    if (!keepId || !mergeId) {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: '缺少 keepId 或 mergeId' } })
      return
    }

    const [keep, merge] = await Promise.all([
      prisma.person.findFirst({ where: { id: keepId, ownerId: req.userId! } }),
      prisma.person.findFirst({ where: { id: mergeId, ownerId: req.userId! } }),
    ])
    if (!keep || !merge) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '人物不存在' } })
      return
    }

    const faces = await prisma.assetPerson.findMany({ where: { personId: mergeId } })
    for (const f of faces) {
      await prisma.assetPerson
        .create({ data: { assetId: f.assetId, personId: keepId } })
        .catch(() => undefined) // 已经有这个关联就跳过
    }
    await prisma.person.delete({ where: { id: mergeId } })
    const count = await prisma.assetPerson.count({ where: { personId: keepId } })
    await prisma.person.update({ where: { id: keepId }, data: { faceCount: count } })

    void mergePersons(keep.aiPersonId, merge.aiPersonId)
    res.json({ data: { ok: true } })
  } catch (err) {
    next(err)
  }
})

/** POST /api/people/:id/split —— 把某张照片从这个人物里拆出去 */
peopleRouter.post('/:id/split', requireAuth, async (req, res, next) => {
  try {
    const { assetId } = (req.body ?? {}) as { assetId?: string }
    if (!assetId) {
      res.status(400).json({ error: { code: 'INVALID_PARAMS', message: '缺少 assetId' } })
      return
    }
    const person = await prisma.person.findFirst({ where: { id: req.params.id, ownerId: req.userId! } })
    if (!person) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: '人物不存在' } })
      return
    }

    await prisma.assetPerson.deleteMany({ where: { personId: person.id, assetId } })
    const count = await prisma.assetPerson.count({ where: { personId: person.id } })
    await prisma.person.update({ where: { id: person.id }, data: { faceCount: count } })

    void splitPerson(person.aiPersonId, assetId)
    res.json({ data: { ok: true } })
  } catch (err) {
    next(err)
  }
})