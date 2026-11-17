// 负责人：C
// 文件存储：本地磁盘 data/uploads/{原图,thumbs}

import fs from 'node:fs'
import path from 'node:path'

import { THUMB_DIR, UPLOAD_DIR } from '../env'

export function ensureDirs() {
  for (const dir of [UPLOAD_DIR, THUMB_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
}

/** 对外可访问的相对路径，例如 /uploads/themes/xxx.webp */
export function publicUrl(absPath: string): string {
  const rel = path.relative(path.join(UPLOAD_DIR, '..'), absPath).split(path.sep).join('/')
  return `/${rel}`
}