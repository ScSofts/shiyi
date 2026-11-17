// 负责人：B
// 分享页：/s/:key，免登录访问
// TODO(B): GET /api/share/:key

import { useParams } from 'react-router-dom'

import PhotoGrid from '../components/PhotoGrid'
import { mockAssets } from '../mocks/assets'

export default function Shared() {
  const { key } = useParams<{ key: string }>()

  return (
    <div className="mx-auto max-w-6xl p-8">
      <header className="mb-6 border-b border-white/10 pb-4">
        <div className="text-lg font-medium">拾忆 · 分享相册</div>
        <div className="text-xs text-slate-500">
          分享码 {key} · 无需登录即可查看
          {/* TODO(B): 接后端后显示相册名、有效期 */}
        </div>
      </header>

      <PhotoGrid assets={mockAssets.slice(0, 10)} />
    </div>
  )
}