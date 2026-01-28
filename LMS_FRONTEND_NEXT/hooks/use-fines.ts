"use client"

import useSWR from "swr"
import { getAllFines, getMyFines, type Fine } from "@/lib/api"

export function useMyFines() {
  const { data, error, isLoading, mutate } = useSWR<Fine[]>("/fines/my", () => getMyFines())
  return {
    fines: data || [],
    isLoading,
    isError: Boolean(error),
    refresh: () => mutate(),
  }
}

export function useAllFines(filter?: { status?: string }) {
  const key = filter?.status ? `/fines?status=${filter.status}` : "/fines"
  const { data, error, isLoading, mutate } = useSWR<Fine[]>(key, () => getAllFines(filter))
  return {
    fines: data || [],
    isLoading,
    isError: Boolean(error),
    refresh: () => mutate(),
  }
}
