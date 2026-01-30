"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/http"
import type { Loan } from "@/lib/api"

export function useMyLoans() {
  const { data, error, isLoading, mutate } = useSWR<{ message: string; data: Loan[] }>("/loan/my-loans", (path) =>
    apiFetch<{ message: string; data: Loan[] }>(path, { method: "GET" }),
  )

  return {
    loans: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}
