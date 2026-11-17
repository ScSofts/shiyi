// 负责人：A
// 上传弹窗。TODO(A): 接后端的 POST /api/assets（见 docs/api-contract.md）
// 现在先用本地 state 模拟：选完文件后显示"已选择 N 个"，点上传提示成功。

import { useState } from 'react'
import { uploadFiles } from '../api/client'

type Props = {
  onClose: () => void
  onUploaded?: () => void
}

export default function UploadDialog({ onClose, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleUpload() {
    if (files.length === 0) return
    setBusy(true)
    setMessage(null)
    try {
      await uploadFiles(files)
      setMessage(`已上传 ${files.length} 张`)
      onUploaded?.()
    } catch (err) {
      // 后端还没起的时候不要吓人，只提示
      setMessage(err instanceof Error ? `上传失败：${err.message}` : '上传失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-[520px] rounded-xl bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-medium">上传照片</h2>

        <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 text-slate-400 hover:border-indigo-500">
          <span className="text-3xl">＋</span>
          <span className="mt-2 text-sm">点击选择照片（可多选）</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>

        {files.length > 0 ? (
          <p className="mt-3 text-sm text-slate-300">已选择 {files.length} 个文件</p>
        ) : null}
        {message ? <p className="mt-2 text-sm text-indigo-400">{message}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            关闭
          </button>
          <button
            onClick={handleUpload}
            disabled={busy || files.length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {busy ? '上传中…' : '开始上传'}
          </button>
        </div>
      </div>
    </div>
  )
}