// 负责人：D
// 和 Python AI 服务通信。AI 服务没起来时不能影响主流程，所以全部 catch 掉返回 null。

import { AI_SERVICE_URL } from '../env'

export type EmbedResult = {
  assetId: string
  faces: { bbox: number[]; vec: number[]; personKey: string }[]
  clipVec: number[]
}

export type SearchHit = { assetId: string; score: number }

async function postJson<T>(path: string, body: unknown, timeoutMs = 15000): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export function embedImage(assetId: string, imagePath: string) {
  return postJson<EmbedResult>('/embed', { assetId, imagePath })
}

export function semanticSearch(query: string, topK = 20) {
  return postJson<{ results: SearchHit[] }>('/search', { query, topK })
}

export function mergePersons(keepId: string, mergeId: string) {
  return postJson<{ ok: boolean }>('/persons/merge', { keepId, mergeId })
}

export function splitPerson(personId: string, assetId: string) {
  return postJson<{ ok: boolean }>('/persons/split', { personId, assetId })
}

export async function aiHealth(): Promise<{ status: string; mode: string } | null> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/health`)
    if (!res.ok) return null
    return (await res.json()) as { status: string; mode: string }
  } catch {
    return null
  }
}