"use client"

import { API_BASE } from './config'

const USER_KEY = "auth_user"
const TOKEN_KEY = "auth_token"
const REFRESH_TOKEN_KEY = "auth_refresh_token"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: "STUDENT" | "TEACHER" | "LIBRARIAN" | "ADMIN"
  verified?: boolean
}

export function getUserFromLocalStorage(): AuthUser | null {
  if (typeof window === "undefined") return null
  
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function setUserInLocalStorage(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function clearUserFromLocalStorage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY)
  }
}

export function clearAuthData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

// Store tokens in localStorage as backup
export function setTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === "undefined") return
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

// Get tokens from localStorage
export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

// For cookie-based auth, we check cookies instead of localStorage
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  // Read from cookie if available
  const cookies = document.cookie.split(';')
  const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='))
  return accessTokenCookie ? accessTokenCookie.split('=')[1] : null
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  // Read from cookie if available
  const cookies = document.cookie.split(';')
  const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken='))
  return refreshTokenCookie ? refreshTokenCookie.split('=')[1] : null
}

export function clearTokens() {
  // Clear user data from localStorage
  clearUserFromLocalStorage()
  // Clear tokens
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  // Cookies will be cleared by logout endpoint
}

// base fetch that attaches Authorization and handles 401 with refresh
export async function apiFetch(input: string, init?: RequestInit & { skipAuth?: boolean }) {
  const url = input.startsWith("http") ? input : `${API_BASE}${input}`
  const headers = new Headers(init?.headers || {})
  if (!init?.skipAuth) {
    const token = getAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }
  headers.set("Content-Type", headers.get("Content-Type") || "application/json")

  const doFetch = async () =>
    fetch(url, {
      ...init,
      headers,
      credentials: "omit",
    })

  let res = await doFetch()
  if (res.status === 401 && !init?.skipAuth) {
    const ok = await tryRefresh()
    if (ok) {
      const retryHeaders = new Headers(init?.headers || {})
      const newToken = getAccessToken()
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`)
      retryHeaders.set("Content-Type", retryHeaders.get("Content-Type") || "application/json")
      res = await fetch(url, {
        ...init,
        headers: retryHeaders,
        credentials: "omit",
      })
    }
  }
  return res
}

export async function login(params: { email: string; password: string }) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  })
  if (!res.ok) {
    throw new Error((await res.text()) || "Login failed")
  }
  const data = await res.json()
  // Backend returns { user } and sets tokens in cookies
  // For now, we'll use a mock token since backend uses cookies
  const mockAccessToken = "cookie-based-auth"
  const mockRefreshToken = "cookie-based-refresh"
  setTokens(mockAccessToken, mockRefreshToken)
  setUserInLocalStorage(data.user)
  return { accessToken: mockAccessToken, refreshToken: mockRefreshToken, user: data.user }
}

export async function register(params: {
  name: string
  email: string
  password: string
  role?: AuthUser["role"]
}) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  })
  if (!res.ok) {
    throw new Error((await res.text()) || "Registration failed")
  }
  // typically no tokens returned until verify + login
  return res.json()
}

export async function verifyEmail(params: { email: string; otp: string }) {
  const res = await apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  })
  if (!res.ok) throw new Error((await res.text()) || "Verification failed")
  return res.json()
}

export async function forgotPassword(params: { email: string }) {
  const res = await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  })
  if (!res.ok) throw new Error((await res.text()) || "Request failed")
  return res.json()
}

export async function resetPassword(params: { email: string; otp: string; password: string }) {
  const res = await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  })
  if (!res.ok) throw new Error((await res.text()) || "Reset failed")
  return res.json()
}

export async function logout(): Promise<void> {
  try {
    const token = getStoredAccessToken()
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    // Continue with logout even if API call fails
  } finally {
    // Clear all stored data
    clearAuthData()
    clearUserFromLocalStorage()
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await apiFetch("/auth/me", { method: "GET" })
  if (!res.ok) return null
  const data = await res.json()
  // Backend returns { user }
  const user = data.user as AuthUser
  setUserInLocalStorage(user)
  return user
}

export async function tryRefresh(): Promise<boolean> {
  const token = getRefreshToken()
  if (!token) return false
  const res = await apiFetch("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token }),
    skipAuth: true,
  })
  if (!res.ok) {
    clearTokens()
    return false
  }
  const data = await res.json()
  // expect { accessToken, refreshToken }
  setTokens(data.accessToken, data.refreshToken)
  return true
}

// role helpers
export function roleHome(role?: AuthUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin"
    case "LIBRARIAN":
      return "/dashboard/librarian"
    default:
      return "/dashboard/patron"
  }
}
