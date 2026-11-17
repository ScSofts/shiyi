// 负责人：A
// 假数据。后端没通之前，所有页面都用这份数据开发。
// 后端通了以后，把页面里的 mockAssets 换成 api('/assets') 即可，字段完全一致。

import type { Album, Asset, MapPoint, Person } from '../api/types'

const CAMERAS = ['iPhone 15 Pro', 'Xiaomi 14', 'SONY A7M4', 'Canon R6']

const PLACES = [
  { city: '杭州', lat: 30.2741, lng: 120.1551 },
  { city: '厦门', lat: 24.4798, lng: 118.0894 },
  { city: '成都', lat: 30.5728, lng: 104.0668 },
  { city: '北京', lat: 39.9042, lng: 116.4074 },
]

function isoDaysAgo(days: number, hour = 14): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 30, 0, 0)
  return d.toISOString()
}

export const mockAssets: Asset[] = Array.from({ length: 24 }, (_, i) => {
  const place = PLACES[i % PLACES.length]
  const takenAt = isoDaysAgo(i * 3 + (i % 2), 8 + (i % 10))
  return {
    id: `a_${i + 1}`,
    originalName: `IMG_${String(1000 + i)}.jpg`,
    // 假图暂时不加载真实图片，PhotoGrid 会用色块占位
    takenAt,
    lat: i % 5 === 0 ? undefined : place.lat + (i % 7) * 0.01,
    lng: i % 5 === 0 ? undefined : place.lng + (i % 7) * 0.01,
    city: place.city,
    cameraModel: CAMERAS[i % CAMERAS.length],
    width: 4032,
    height: 3024,
    isFavorite: i % 6 === 0,
  }
})

export const mockPeople: Person[] = [
  { id: 'p_1', name: '张三', faceCount: 9, coverAssetId: 'a_1' },
  { id: 'p_2', name: null, faceCount: 6, coverAssetId: 'a_2' },
  { id: 'p_3', name: null, faceCount: 4, coverAssetId: 'a_3' },
]

export const mockMapPoints: MapPoint[] = PLACES.map((p, i) => ({
  lat: p.lat,
  lng: p.lng,
  count: 8 - i,
  city: p.city,
  sampleAssetId: `a_${i + 1}`,
}))

export const mockAlbums: Album[] = [
  { id: 'al_1', name: '毕业旅行', coverAssetId: 'a_1', count: 12 },
  { id: 'al_2', name: '校园活动', coverAssetId: 'a_2', count: 8 },
  { id: 'al_3', name: '家里的小猫', coverAssetId: 'a_3', count: 4 },
]

/** 时间轴分组：按 YYYY-MM 倒序 */
export function groupByMonth(assets: Asset[]): { month: string; items: Asset[] }[] {
  const map = new Map<string, Asset[]>()
  for (const a of assets) {
    const key = (a.takenAt ?? new Date().toISOString()).slice(0, 7)
    const list = map.get(key) ?? []
    list.push(a)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, items]) => ({
      month,
      items: items.slice().sort((a, b) => ((a.takenAt ?? '') < (b.takenAt ?? '') ? 1 : -1)),
    }))
}

/** 把 2026-11 显示成 "2026 年 11 月" */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${y} 年 ${Number(m)} 月`
}