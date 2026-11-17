// 负责人：C
// 缩略图：sharp 生成 600px webp（只要一档就够，比三档省事）

import path from 'node:path'

import sharp from 'sharp'

import { THUMB_DIR } from '../env'

export type ThumbResult = { thumbAbsPath: string; width: number; height: number }

export async function makeThumb(originalAbsPath: string, assetId: string): Promise<ThumbResult> {
  const outAbs = path.join(THUMB_DIR, `${assetId}.webp`)
  const info = await sharp(originalAbsPath)
    .rotate() // 按 EXIF 方向自动转正
    .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(outAbs)

  return { thumbAbsPath: outAbs, width: info.width, height: info.height }
}