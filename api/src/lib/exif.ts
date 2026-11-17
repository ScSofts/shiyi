// 负责人：C
// EXIF 提取：拍摄时间、经纬度、相机型号
//
// 注意：EXIF 里没有时区信息，exifr 会按本机时区解析成 Date。
// 我们统一按 Asia/Shanghai 理解，存成 UTC（数据库里 DateTime 就是 UTC）。

import exifr from 'exifr'

export type ExifInfo = {
  takenAt: Date | null
  lat: number | null
  lng: number | null
  cameraModel: string | null
  width: number | null
  height: number | null
}

export async function readExif(absPath: string): Promise<ExifInfo> {
  try {
    const data = await exifr.parse(absPath, { gps: true, tiff: true, exif: true })
    if (!data) return empty()
    return {
      takenAt: data.DateTimeOriginal ?? data.CreateDate ?? null,
      lat: typeof data.latitude === 'number' ? data.latitude : null,
      lng: typeof data.longitude === 'number' ? data.longitude : null,
      cameraModel: [data.Make, data.Model].filter(Boolean).join(' ') || null,
      width: data.ExifImageWidth ?? data.ImageWidth ?? null,
      height: data.ExifImageHeight ?? data.ImageHeight ?? null,
    }
  } catch {
    // 手机截屏、下载的图经常没有 EXIF，不要因此报错
    return empty()
  }
}

function empty(): ExifInfo {
  return { takenAt: null, lat: null, lng: null, cameraModel: null, width: null, height: null }
}

/** 国内粗略反查城市：先按经纬度就近匹配几个常用城市，够演示用 */
const CITIES = [
  { name: '北京', lat: 39.9042, lng: 116.4074 },
  { name: '杭州', lat: 30.2741, lng: 120.1551 },
  { name: '上海', lat: 31.2304, lng: 121.4737 },
  { name: '成都', lat: 30.5728, lng: 106.6302 },
  { name: '厦门', lat: 24.4798, lng: 118.0894 },
  { name: '广州', lat: 23.1291, lng: 113.2644 },
  { name: '西安', lat: 34.3416, lng: 108.9398 },
]

export function guessCity(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null
  let best: { name: string; d: number } | null = null
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2
    if (!best || d < best.d) best = { name: c.name, d }
  }
  // 大约 0.5 度以内才算匹配上
  return best && best.d < 0.25 ? best.name : null
}