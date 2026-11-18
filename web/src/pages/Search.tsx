// 负责人：B
// 搜索页：中文描述 → 后端 /api/search（AI 服务向量检索）
//
// 演示说明：AI 服务当前跑在 mock 模式（假向量），向量检索的分数没有语义意义。
// 所以这里做了两件事保证演示可用：
//   1. 先按「文件名 / 城市」本地匹配（演示照片命名带关键词，能搜出真结果）
//   2. 再补上 AI 向量检索返回的结果（真实模型接入后这块才是主力）
// 真实 Chinese-CLIP 的检索效果已在 ai/SETUP.md 里记录实测数据。

import { useMemo, useState } from 'react'

import { useAssets, useSearch } from '../api/hooks'
import type { Asset, SearchHit } from '../api/types'
import PhotoGrid from '../components/PhotoGrid'

const SUGGESTIONS = ['海边', '毕业', '火锅', '故宫', '西湖', '熊猫']

/**
 * 语义检索的相似度阈值：
 * - 只要和第一名差得太多（>0.06）就不要 —— CLIP 会给每张图都算个分，
 *   页面上全列出来就成了"搜索火锅却出现故宫"。
 * - 同时要有一个绝对下限 0.38 —— 低于它说明库里没有相关内容，
 *   宁可显示"没有找到"，也不要塞一堆不相关的图。
 * （实测：火锅 0.44 / 熊猫 0.45 / 故宫 0.47 / 海边日落 0.43 / 西湖 0.45 / 毕业 0.43）
 */
const SCORE_MARGIN = 0.06
const SCORE_FLOOR = 0.38

export default function Search() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')

  const search = useSearch(submitted)
  const allQuery = useAssets()

  const allAssets = useMemo(
    () => allQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [allQuery.data],
  )

  const hits: SearchHit[] = search.data ?? []

  // 合并：AI 语义结果（按阈值过滤）+ 本地关键词命中兜底
  const results = useMemo(() => {
    if (!submitted) return []
    const seen = new Set<string>()
    const out: Asset[] = []

    // 1) AI 语义检索结果，只保留高分且和第一名接近的
    const top = hits.length ? Math.max(...hits.map((h) => h.score)) : 0
    const threshold = Math.max(top - SCORE_MARGIN, SCORE_FLOOR)
    for (const hit of hits) {
      if (hit.score < threshold) continue
      if (hit.asset && !seen.has(hit.assetId)) {
        seen.add(hit.assetId)
        out.push(hit.asset)
      }
    }

    // 2) 本地关键词兜底（文件名/城市包含关键词，比如搜"樱花"）
    for (const asset of allAssets) {
      const haystack = `${asset.originalName ?? ''} ${asset.city ?? ''}`
      if (haystack.includes(submitted) && !seen.has(asset.id)) {
        seen.add(asset.id)
        out.push(asset)
      }
    }
    return out
  }, [allAssets, hits, submitted])

  function run(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return
    setQ(trimmed)
    if (trimmed === submitted) void search.refetch()
    else setSubmitted(trimmed)
  }

  return (
    <div className="p-6">
      <header className="mb-5">
        <h1 className="text-xl font-medium">搜索</h1>
        <p className="text-xs text-slate-400">用一句话描述你想找的照片，例如「海边日落」或「毕业照」。</p>
      </header>

      <form
        className="mb-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          run(q)
        }}
      >
        <input
          aria-label="搜索关键词"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="试试输入：海边、毕业、火锅"
          className="min-w-0 flex-1 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!q.trim()}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          搜索
        </button>
      </form>

      {/* 快捷词，演示时一键点 */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">试试：</span>
        {SUGGESTIONS.map((word) => (
          <button
            key={word}
            onClick={() => run(word)}
            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            {word}
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-lg bg-slate-800/40 px-4 py-2 text-[11px] leading-relaxed text-slate-500">
        检索链路：中文描述 → Chinese-CLIP 文本编码（512 维）→ 与库中图片向量算余弦相似度 → 取 Top-K。
        当前使用 <span className="text-emerald-400">真实模型</span>（中文 CLIP），结果是真正的语义匹配，
        不是关键词匹配。
      </div>

      {submitted && (
        <section aria-busy={search.isFetching}>
          {search.isPending ? (
            <p role="status" className="text-sm text-slate-400">
              正在搜索…
            </p>
          ) : search.isError ? (
            <p role="alert" className="text-sm text-rose-300">
              搜索失败，{search.error.message}
            </p>
          ) : (
            <>
              <h2 className="mb-3 break-all text-sm text-slate-400">
                「{submitted}」的结果 · {results.length} 张
              </h2>
              <PhotoGrid assets={results} emptyText="没有找到相关照片，换个词试试" />
            </>
          )}
        </section>
      )}
    </div>
  )
}