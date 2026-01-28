"use client"

import useSWR from "swr"
import { getAllLoans, getMyLoans, getUserLoans, getOverdueLoans, type Loan } from "@/lib/api"

export function useMyLoans() {
  const { data, error, isLoading, mutate } = useSWR("my-loans", getMyLoans)

  return {
    loans: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  }
}

export function useAllLoans() {
  const { data, error, isLoading, mutate } = useSWR("all-loans", getAllLoans)

  return {
    loans: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  }
}

export function useUserLoans(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ["user-loans", userId] : null,
    () => getUserLoans(userId)
  )

  return {
    loans: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  }
}

export function useOverdueLoans() {
  const { data, error, isLoading, mutate } = useSWR("overdue-loans", getOverdueLoans)

  return {
    loans: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  }
}
