// 负责人：B
// 相册详情 + 生成分享链接
// TODO(B): GET /api/albums/:id，按钮调 POST /api/albums/:id/share

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import PhotoGrid from '../components/PhotoGrid'
import { mockAlbums, mockAssets } from '../mocks/assets'

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const album = mockAlbums.find((a) => a.id === id)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  return (
    <div className="p-6">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/albums" className="text-sm text-slate-400 hover:text-slate-200">
            ← 相册
          </Link>
          <div>
            <h1 className="text-xl font-medium">{album?.name ?? '相册'}</h1>
            <p className="text-xs text-slate-500">{album?.count ?? 0} 张</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shareUrl ? (
            <code className="rounded bg-slate-800 px-3 py-2 text-xs text-indigo-300">{shareUrl}</code>
          ) : null}
          <button
            onClick={() => setShareUrl(`/s/${Math.random().toString(36).slice(2, 12)}`)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
          >
            生成分享链接
          </button>
        </div>
      </header>

      <PhotoGrid assets={mockAssets.slice(0, 12)} />
    </div>
  )
}