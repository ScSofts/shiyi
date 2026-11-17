// 负责人：C
import type { NextFunction, Request, Response } from 'express'

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: '接口不存在' } })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : '服务器内部错误'
  console.error('[error]', err)
  res.status(500).json({ error: { code: 'INTERNAL', message } })
}