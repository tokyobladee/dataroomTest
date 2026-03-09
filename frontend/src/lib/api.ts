import { auth } from "@/lib/firebase"

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

async function getToken(forceRefresh = false): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error("Not authenticated")
  return user.getIdToken(forceRefresh)
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  // Token may be stale right after login/account switch — retry once with a fresh token
  if (res.status === 401) {
    const freshToken = await getToken(true)
    const retryRes = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${freshToken}`,
      },
    })
    if (!retryRes.ok) {
      const body = await retryRes.json().catch(() => ({}))
      throw new Error(body.error ?? `HTTP ${retryRes.status}`)
    }
    return retryRes
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res
}

export async function apiJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  })
  return res.json()
}
