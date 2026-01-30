"use client"

import useSWR from "swr"
import { getLibraryItems, type LibraryItem, type LibraryItemType } from "@/lib/api"

export type LibraryItemFilters = {
  search?: string
  type?: LibraryItemType
  category?: string
  available?: boolean
}

export function useLibraryItems(filters?: LibraryItemFilters) {
  const key = filters ? ["library-items", filters] : ["library-items"]

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    getLibraryItems(filters),
  )

  return {
    items: data || [],
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}
