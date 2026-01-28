"use client"

import { useState, useEffect } from "react"
import { getLibrarianRequests, approveLibrarian, rejectLibrarian, type LibrarianRequest } from "@/lib/api"
import { useToast } from "./use-toast"

export function useLibrarianRequests() {
  const [requests, setRequests] = useState<LibrarianRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLibrarianRequests()
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch librarian requests")
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id: string) => {
    try {
      const result = await approveLibrarian(id)
      toast({
        title: "Success",
        description: result.message,
      })
      // Refresh the list
      await fetchRequests()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to approve librarian",
        variant: "destructive",
      })
    }
  }

  const reject = async (id: string) => {
    try {
      const result = await rejectLibrarian(id)
      toast({
        title: "Success", 
        description: result.message,
      })
      // Refresh the list
      await fetchRequests()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reject librarian",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  return {
    requests,
    loading,
    error,
    approve,
    reject,
    refresh: fetchRequests,
  }
}