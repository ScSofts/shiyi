// 负责人：A
// 大图查看器：← → 切换，Esc 关闭，显示 EXIF。
// TODO(A): 加缩放 / 拖拽（P2，时间不够可以不做）

import { useEffect } from 'react'
import type { Asset } from '../api/types'

type Props = {
  asset: Asset
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function fmt(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('zh-CN', { hour12: false })
}

export default function Viewer({ asset, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div className="fixed inset-0 z-50 flex bg-black/90">
      <div className="relative flex flex-1 items-center justify-center p-8">
        {asset.fileUrl ? (
          <img src={asset.fileUrl} alt={asset.originalName ?? ''} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="flex h-2/3 w-2/3 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
            原图（后端接好后这里显示照片）
          </div>
        )}
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20"
        >
          ‹
        </button>
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20"
        >
          ›
        </button>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-white">
          ✕
        </button>
      </div>

      <aside className="w-72 shrink-0 overflow-y-auto border-l border-white/10 bg-slate-900 p-4 text-sm">
        <h3 className="mb-3 font-medium text-slate-200">照片信息</h3>
        <dl className="space-y-2 text-slate-400">
          <div>
            <dt className="text-xs text-slate-500">文件名</dt>
            <dd>{asset.originalName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">拍摄时间</dt>
            <dd>{fmt(asset.takenAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">相机</dt>
            <dd>{asset.cameraModel ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">尺寸</dt>
            <dd>
              {asset.width ?? '?'} × {asset.height ?? '?'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">位置</dt>
            <dd>{asset.city ?? (asset.lat && asset.lng ? `${asset.lat.toFixed(3)}, ${asset.lng.toFixed(3)}` : '无定位信息')}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}