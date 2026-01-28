import { API_BASE } from "./config"

type Options = RequestInit & { json?: any }

async function toJson(res: Response) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text || res.statusText }
  }
}

async function postRefresh() {
  // Attempt to refresh using httpOnly cookie set by backend
  const response = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  
  // If cookie refresh fails, try with localStorage token
  if (!response.ok && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('auth_refresh_token')
    if (refreshToken) {
      const tokenResponse = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${refreshToken}`
        },
        body: JSON.stringify({ refreshToken }),
      })
      
      if (tokenResponse.ok) {
        const data = await tokenResponse.json()
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken)
        }
        if (data.refreshToken) {
          localStorage.setItem('auth_refresh_token', data.refreshToken)
        }
      }
    }
  }
}

export async function apiFetch<T = any>(path: string, opts: Options = {}, retry = true): Promise<T> {
  const { json, headers, ...rest } = opts
  
  // Get token from localStorage
  let authHeaders = {}
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      authHeaders = { Authorization: `Bearer ${token}` }
    }
  }
  
  const init: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(headers || {}),
    },
    ...rest,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  }

  let res = await fetch(`${API_BASE}${path}`, init)

  if (res.status === 401 && retry) {
    try {
      await postRefresh()
      
      // Get updated token after refresh
      let updatedAuthHeaders = {}
      if (typeof window !== 'undefined') {
        const newToken = localStorage.getItem('accessToken')
        if (newToken) {
          updatedAuthHeaders = { Authorization: `Bearer ${newToken}` }
        }
      }
      
      // Retry with updated token
      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...init.headers,
          ...updatedAuthHeaders,
        },
      }
      
      res = await fetch(`${API_BASE}${path}`, retryInit)
    } catch {
      // fall through to throw below
    }
  }

  if (!res.ok) {
    const data = await toJson(res)
    const message = data?.message || data?.error || `Request failed: ${res.status} ${res.statusText}`
    throw new Error(message)
  }

  const data = await toJson(res)
  return data as T
}
