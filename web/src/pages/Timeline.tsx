// 负责人：A
// 首页时间轴：按月分组 + 大图查看器 + 上传入口
// TODO(A): 把 mockAssets 换成 api('/assets')（见 docs/api-contract.md 第 2 节）

import { useMemo, useState } from 'react'

import PhotoGrid from '../components/PhotoGrid'
import UploadDialog from '../components/UploadDialog'
import Viewer from '../components/Viewer'
import { formatMonth, groupByMonth, mockAssets } from '../mocks/assets'
import type { Asset } from '../api/types'

export default function Timeline() {
  const [selected, setSelected] = useState<Asset | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const groups = useMemo(() => groupByMonth(mockAssets), [])
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const memories = useMemo(() => flat.slice(0, 4), [flat])

  const index = selected ? flat.findIndex((a) => a.id === selected.id) : -1

  function step(delta: number) {
    if (index < 0) return
    const next = flat[(index + delta + flat.length) % flat.length]
    if (next) setSelected(next)
  }

  return (
    <div className="p-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">时间轴</h1>
          <p className="text-xs text-slate-500">按拍摄时间自动分组</p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          上传照片
        </button>
      </header>

      {/* 往年今日 */}
      {memories.length > 0 ? (
        <section className="mb-6 rounded-xl bg-slate-800/50 p-4">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-200">往年今日</span>
            <span className="text-xs text-slate-500">示例数据 · {memories.length} 张</span>
          </div>
          <PhotoGrid assets={memories} onSelect={setSelected} />
        </section>
      ) : null}

      {groups.map((group) => (
        <section key={group.month} className="mb-6">
          <h2 className="month-sticky -mx-1 mb-2 px-1 py-2 text-sm font-medium text-slate-300">
            {formatMonth(group.month)}
            <span className="ml-2 text-xs text-slate-500">{group.items.length} 张</span>
          </h2>
          <PhotoGrid assets={group.items} onSelect={setSelected} />
        </section>
      ))}

      {uploadOpen ? (
        <UploadDialog
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            // TODO(A): 上传成功后刷新列表（接后端后改成 invalidateQueries）
          }}
        />
      ) : null}

      {selected ? (
        <Viewer
          asset={selected}
          onClose={() => setSelected(null)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      ) : null}
    </div>
  )
}