// 负责人：B
// 相册列表
// TODO(B): 换成 api('/albums') + POST 创建

import { Link } from 'react-router-dom'

import { mockAlbums } from '../mocks/assets'

export default function Albums() {
  return (
    <div className="p-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">相册</h1>
          <p className="text-xs text-slate-500">把照片整理成旅行、聚会、校园活动</p>
        </div>
        {/* TODO(B): 新建相册弹窗，POST /api/albums */}
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">新建相册</button>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {mockAlbums.map((album) => (
          <Link
            key={album.id}
            to={`/albums/${album.id}`}
            className="group overflow-hidden rounded-xl bg-slate-800/50 hover:bg-slate-800"
          >
            <div className="flex h-32 items-center justify-center bg-slate-700/50 text-3xl">📚</div>
            <div className="p-3">
              <div className="text-sm text-slate-200">{album.name}</div>
              <div className="text-xs text-slate-500">{album.count} 张</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}