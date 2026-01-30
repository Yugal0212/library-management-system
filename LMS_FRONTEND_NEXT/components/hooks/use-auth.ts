"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { apiFetch } from "@/lib/http"
import { getUserFromLocalStorage } from "@/lib/auth"

type User = {
  id: string
  email: string
  name: string
  role: "STUDENT" | "TEACHER" | "LIBRARIAN" | "ADMIN"
  isVerified?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, any>
}

interface AuthResponse {
  user: User | null
  isLoading: boolean
  error?: string
}

export function useAuth(): AuthResponse {
  const [mounted, setMounted] = useState(false)
  const [storedUser, setStoredUserState] = useState<User | null>(null)

  // Handle hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true)
    // Only access localStorage after component mounts
    const user = getUserFromLocalStorage()
    setStoredUserState(user as User)
  }, [])

  // If not mounted yet (SSR), return loading state
  if (!mounted) {
    return {
      user: null,
      isLoading: true
    }
  }

  // If we have a stored user, return it immediately
  if (storedUser) {
    return {
      user: storedUser,
      isLoading: false
    }
  }

  // If no stored user, try to fetch from API (this will fail if no token)
  const { data, error, isLoading } = useSWR<User>(
    '/auth/me',
    apiFetch,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      errorRetryCount: 0
    }
  )

  return {
    user: data || null,
    isLoading,
    error: error?.message
  }
}
