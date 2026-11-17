// 负责人：B
// 搜索页：输入中文描述，找相关照片
// TODO(B): 把本地过滤换成 api(`/search?q=${encodeURIComponent(q)}`)
// 注意：假数据阶段只能按城市/文件名过滤，真实语义搜索由 D 的 AI 服务提供

import { useMemo, useState } from 'react'

import PhotoGrid from '../components/PhotoGrid'
import { mockAssets } from '../mocks/assets'

export default function Search() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')

  const results = useMemo(() => {
    if (!submitted.trim()) return []
    const key = submitted.trim()
    return mockAssets.filter(
      (a) => (a.city ?? '').includes(key) || (a.originalName ?? '').includes(key) || key.length === 0,
    )
  }, [submitted])

  return (
    <div className="p-6">
      <header className="mb-5">
        <h1 className="text-xl font-medium">搜索</h1>
        <p className="text-xs text-slate-500">用一句话描述你想找的照片，例如"海边日落""毕业照"</p>
      </header>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(q)
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="试试输入：海边日落"
          className="flex-1 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-3 text-sm text-white hover:bg-indigo-500">
          搜索
        </button>
      </form>

      {submitted ? (
        <section>
          <h2 className="mb-3 text-sm text-slate-400">
            "{submitted}" 的结果 · {results.length} 张
            <span className="ml-2 text-xs text-slate-600">（假数据阶段按城市/文件名过滤，语义搜索由 AI 服务提供）</span>
          </h2>
          <PhotoGrid assets={results} emptyText="没有找到相关照片" />
        </section>
      ) : (
        <div className="rounded-lg bg-slate-800/40 p-4 text-xs leading-relaxed text-slate-500">
          语义搜索的工作方式：把"海边日落"编码成一个 512 维向量，再和每张照片的图片向量算余弦相似度，取最像的前 20 张。
          <br />
          实现在 <code className="text-slate-400">ai/clip.py</code> 和 <code className="text-slate-400">api/src/routes/search.ts</code>。
        </div>
      )}
    </div>
  )
}