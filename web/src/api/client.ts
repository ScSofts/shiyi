// 负责人：A
// 统一的请求封装。所有页面都通过这里调后端，不要自己写 fetch。

import type { ApiEnvelope } from './types'

const BASE = '/api'

let authToken: string | null = localStorage.getItem('shiyi_token')

export function setToken(token: string | null) {
  authToken = token
  if (token) localStorage.setItem('shiyi_token', token)
  else localStorage.removeItem('shiyi_token')
}

export function getToken() {
  return authToken
}

export class RequestError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}

  if (!res.ok) {
    const err = json?.error ?? { code: 'INTERNAL', message: `请求失败（${res.status}）` }
    throw new RequestError(err.code, err.message)
  }
  return (json as ApiEnvelope<T>).data
}

export async function uploadFiles(files: File[]): Promise<unknown> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api('/assets', { method: 'POST', body: form })
}