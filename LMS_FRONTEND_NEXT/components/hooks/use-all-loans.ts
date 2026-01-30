"use client"

import useSWR from "swr"
import type { Loan } from "@/lib/api"
import { apiFetch } from "@/lib/http"

type Mode = "all" | "overdue" | { userId: string }

function keyFor(mode: Mode) {
  if (mode === "all") return "/loan/all"
  if (mode === "overdue") return "/loan/overdue"
  return `/loan/user/${mode.userId}`
}

export function useAllLoans(mode: Mode = "all") {
  const key = keyFor(mode)
  const { data, error, isLoading, mutate } = useSWR<{ message: string; data: Loan[] }>(key, (path) =>
    apiFetch<{ message: string; data: Loan[] }>(path, { method: "GET" }),
  )

  return {
    loans: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}
