// 负责人：A
// ★ 全组共用组件：四个视图（时间轴 / 人物 / 地图下钻 / 搜索结果）都用它渲染。
// 改这个文件之前，先在群里说一声。

import { useMemo } from 'react'
import type { Asset } from '../api/types'

type Props = {
  assets: Asset[]
  /** 点某张照片时回调；不传就不可点 */
  onSelect?: (asset: Asset) => void
  emptyText?: string
}

const PALETTE = ['#5b6b8c', '#8c7a5b', '#5b8c74', '#7a5b8c', '#8c5b6b', '#5b8c8c']

function placeholderColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997
  return PALETTE[h % PALETTE.length]
}

export default function PhotoGrid({ assets, onSelect, emptyText = '还没有照片' }: Props) {
  const items = useMemo(() => assets, [assets])

  if (items.length === 0) {
    return <div className="py-16 text-center text-sm text-slate-500">{emptyText}</div>
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1.5">
      {items.map((asset) => (
        <button
          key={asset.id}
          type="button"
          onClick={() => onSelect?.(asset)}
          className="group relative aspect-square overflow-hidden rounded-md bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title={asset.originalName}
        >
          {asset.thumbUrl ? (
            <img
              src={asset.thumbUrl}
              alt={asset.originalName ?? ''}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center text-[11px] text-white/70"
              style={{ backgroundColor: placeholderColor(asset.id) }}
            >
              <span className="text-lg">🖼</span>
              <span>{(asset.takenAt ?? '').slice(0, 10)}</span>
            </div>
          )}
          {asset.isFavorite ? (
            <span className="absolute right-1.5 top-1.5 text-xs text-rose-400">♥</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}