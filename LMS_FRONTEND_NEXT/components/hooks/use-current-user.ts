"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/http"
import type { User } from "@/lib/api"

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<{ user: User }>("/auth/me", (path) =>
    apiFetch<{ user: User }>(path, { method: "GET" }),
  )

  return {
    user: data?.user,
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}
