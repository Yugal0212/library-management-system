"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/http"

export type SimpleUser = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "LIBRARIAN" | "TEACHER" | "STUDENT"
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<{ message: string; data: SimpleUser[] }>("/user", (path: string) =>
    apiFetch<{ message: string; data: SimpleUser[] }>(path, { method: "GET" }),
  )

  return {
    users: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}
