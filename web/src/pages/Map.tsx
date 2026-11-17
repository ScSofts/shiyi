// 负责人：B
// 地图页：把有 GPS 的照片打到地图上，点标记点看那里的照片
// 技术：Leaflet + OpenStreetMap 免费瓦片；用 CircleMarker 避免 Marker 图标打包问题
// TODO(B): 把 mockMapPoints 换成 api('/map/points')

import { useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'

import PhotoGrid from '../components/PhotoGrid'
import { mockAssets, mockMapPoints } from '../mocks/assets'

const DEFAULT_CENTER: [number, number] = [30.5, 112.0]

export default function MapPage() {
  const [activeCity, setActiveCity] = useState<string | null>(null)

  const cityAssets = activeCity ? mockAssets.filter((a) => a.city === activeCity) : []

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between p-6 pb-3">
        <div>
          <h1 className="text-xl font-medium">地图</h1>
          <p className="text-xs text-slate-500">点击地图上的点，查看在那里拍的照片</p>
        </div>
        {activeCity ? (
          <button onClick={() => setActiveCity(null)} className="text-sm text-slate-400 hover:text-slate-200">
            ← 返回全部
          </button>
        ) : null}
      </header>

      <div className={activeCity ? 'h-64 px-6' : 'flex-1 px-6'}>
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
          {mockMapPoints.map((p) => (
            <CircleMarker
              key={`${p.lat}-${p.lng}`}
              center={[p.lat, p.lng]}
              radius={Math.min(8 + p.count, 22)}
              pathOptions={{ color: '#818cf8', fillColor: '#6366f1', fillOpacity: 0.6 }}
              eventHandlers={{ click: () => setActiveCity(p.city ?? null) }}
            >
              <Tooltip>
                {p.city} · {p.count} 张
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {activeCity ? (
        <section className="flex-1 overflow-y-auto p-6">
          <h2 className="mb-3 text-sm font-medium text-slate-300">
            {activeCity} · {cityAssets.length} 张
          </h2>
          <PhotoGrid assets={cityAssets} emptyText="这个地点还没有照片" />
        </section>
      ) : null}
    </div>
  )
}