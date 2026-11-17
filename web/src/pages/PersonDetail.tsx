// 负责人：B
// 某个人物的所有照片
// TODO(B): 把 mockAssets.mockPeople 换成 api('/assets?personId=xxx')

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import PhotoGrid from '../components/PhotoGrid'
import Viewer from '../components/Viewer'
import { mockAssets, mockPeople } from '../mocks/assets'
import type { Asset } from '../api/types'

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const [selected, setSelected] = useState<Asset | null>(null)

  const person = mockPeople.find((p) => p.id === id)
  // 假数据里没有真实关联，这里按 id 取一部分照片演示
  const assets = useMemo(() => {
    const n = id === 'p_1' ? 9 : id === 'p_2' ? 6 : 4
    return mockAssets.slice(0, n)
  }, [id])

  return (
    <div className="p-6">
      <header className="mb-5 flex items-center gap-3">
        <Link to="/people" className="text-sm text-slate-400 hover:text-slate-200">
          ← 人物
        </Link>
        <div>
          <h1 className="text-xl font-medium">{person?.name ?? '未命名人物'}</h1>
          <p className="text-xs text-slate-500">{assets.length} 张照片</p>
        </div>
        {/* TODO(B): 加"重命名"按钮，调 PATCH /api/people/:id */}
      </header>

      <PhotoGrid assets={assets} onSelect={setSelected} />

      {selected ? (
        <Viewer asset={selected} onClose={() => setSelected(null)} onPrev={() => undefined} onNext={() => undefined} />
      ) : null}
    </div>
  )
}