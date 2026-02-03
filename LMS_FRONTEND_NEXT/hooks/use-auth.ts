"use client"

import { useEffect, useState, useCallback } from "react"
import { fastFetch, fastCache } from "@/lib/fast-fetch"
import { getUserFromLocalStorage, setUserInLocalStorage, clearAuth } from "@/lib/auth"

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
  refetch?: () => Promise<void>
}

export function useAuth(): AuthResponse {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [mounted, setMounted] = useState(false)

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fastFetch<User>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`,
        { 
          credentials: 'include',
          ttl: 5000,
        }
      )
      setUser(data)
      setUserInLocalStorage(data)
      setError(undefined)
    } catch (err: any) {
      setError(err.message)
      setUser(null)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    
    const cachedUser = getUserFromLocalStorage()
    if (cachedUser) {
      setUser(cachedUser as User)
      setIsLoading(false)
    }

    const validateToken = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const data = await fastFetch<User>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`,
          { 
            credentials: 'include',
            ttl: 5000,
          }
        )
        
        if (JSON.stringify(data) !== JSON.stringify(cachedUser)) {
          setUser(data)
          setUserInLocalStorage(data)
        }
      } catch (err: any) {
        if (err.status === 401) {
          setUser(null)
          clearAuth()
        }
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [])

  if (!mounted) {
    return {
      user: null,
      isLoading: true,
      refetch,
    }
  }

  return {
    user,
    isLoading,
    error,
    refetch,
  }
}
