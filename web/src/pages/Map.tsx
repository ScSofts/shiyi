// 负责人：B
// 地图页：把有 GPS 的照片打到地图上，点标记点看那里的照片
// 技术：Leaflet + OpenStreetMap 免费瓦片；用 CircleMarker 避免 Marker 图标打包问题
// 数据：GET /api/map/points（聚合点）+ GET /api/assets（按城市筛选照片）

import { useMemo, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'

import { useAssets, useMapPoints } from '../api/hooks'
import type { MapPoint } from '../api/types'
import PhotoGrid from '../components/PhotoGrid'

const DEFAULT_CENTER: [number, number] = [31.5, 114.0]

export default function MapPage() {
  const [active, setActive] = useState<MapPoint | null>(null)

  const pointsQuery = useMapPoints()
  const assetsQuery = useAssets()

  const allAssets = useMemo(
    () => assetsQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [assetsQuery.data],
  )

  const points = pointsQuery.data ?? []

  const cityAssets = useMemo(() => {
    if (!active) return []
    return allAssets.filter((asset) => {
      if (active.city) return asset.city === active.city
      if (asset.lat == null || asset.lng == null) return false
      return Math.abs(asset.lat - active.lat) < 0.1 && Math.abs(asset.lng - active.lng) < 0.1
    })
  }, [active, allAssets])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between p-6 pb-3">
        <div>
          <h1 className="text-xl font-medium">地图</h1>
          <p className="text-xs text-slate-500">
            {pointsQuery.isLoading
              ? '正在读取位置信息…'
              : `${points.length} 个地点 · ${allAssets.length} 张照片（含 GPS 的才会出现在地图上）`}
          </p>
        </div>
        {active ? (
          <button onClick={() => setActive(null)} className="text-sm text-slate-400 hover:text-slate-200">
            ← 返回全部
          </button>
        ) : null}
      </header>

      <div className={active ? 'h-64 px-6' : 'flex-1 px-6'}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={5}
          style={{ height: '100%', width: '100%', borderRadius: 12 }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <CircleMarker
              key={`${p.lat}-${p.lng}`}
              center={[p.lat, p.lng]}
              radius={Math.min(10 + p.count * 2, 26)}
              pathOptions={{ color: '#818cf8', fillColor: '#6366f1', fillOpacity: 0.6 }}
              eventHandlers={{ click: () => setActive(p) }}
            >
              <Tooltip>
                {p.city ?? '未知地点'} · {p.count} 张
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {active ? (
        <section className="flex-1 overflow-y-auto p-6">
          <h2 className="mb-3 text-sm font-medium text-slate-300">
            {active.city ?? '这个地点'} · {cityAssets.length} 张
          </h2>
          <PhotoGrid assets={cityAssets} emptyText="这个地点还没有照片" />
        </section>
      ) : null}
    </div>
  )
}