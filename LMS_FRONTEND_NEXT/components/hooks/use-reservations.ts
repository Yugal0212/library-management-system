"use client"

import useSWR from "swr"
import type { Reservation } from "@/lib/api"
import { apiFetch } from "@/lib/http"

export function useMyReservations() {
  const { data, error, isLoading, mutate } = useSWR<{ message: string; data: Reservation[] }>(
    "/reservation/my",
    (path: string) => apiFetch<{ message: string; data: Reservation[] }>(path, { method: "GET" }),
  )
  return { reservations: data?.data || [], isLoading, isError: !!error, refresh: mutate }
}

export function useAllReservations() {
  const { data, error, isLoading, mutate } = useSWR<{ message: string; data: Reservation[] }>("/reservation", (path: string) =>
    apiFetch<{ message: string; data: Reservation[] }>(path, { method: "GET" }),
  )
  return { reservations: data?.data || [], isLoading, isError: !!error, refresh: mutate }
}
