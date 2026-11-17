// 负责人：A
// 登录页。默认账号在 api/src/index.ts 里自动创建：demo@shiyi.local / demo1234

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api, setToken } from '../api/client'

type LoginResp = { token: string; user: { id: string; email: string } }

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@shiyi.local')
  const [password, setPassword] = useState('demo1234')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await api<LoginResp>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(data.token)
      navigate('/timeline')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <form onSubmit={submit} className="w-[360px] rounded-2xl bg-slate-900 p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold">拾忆</h1>
        <p className="mb-6 text-xs text-slate-500">个人影像管理与智能检索</p>

        <label className="mb-1 block text-xs text-slate-400">邮箱</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <label className="mb-1 block text-xs text-slate-400">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {error ? <p className="mb-3 text-xs text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? '登录中…' : '登录'}
        </button>

        <p className="mt-4 text-center text-[11px] text-slate-600">默认账号 demo@shiyi.local / demo1234</p>
      </form>
    </div>
  )
}