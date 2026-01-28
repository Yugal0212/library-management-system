"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, BookOpen, RefreshCw, Search, Filter } from "lucide-react"
import { getAllReservations, cancelReservation, approveReservation } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function LibrarianReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const data = await getAllReservations()
      setReservations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load reservations:', error)
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    try {
      setProcessingId(reservationId)
      await cancelReservation(reservationId)
      toast({
        title: "Success",
        description: "Reservation cancelled successfully",
      })
      await loadReservations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel reservation",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleApproveReservation = async (reservationId: string) => {
    try {
      setProcessingId(reservationId)
      await approveReservation(reservationId)
      toast({
        title: "Success",
        description: "Reservation approved successfully. Loan created for patron.",
      })
      await loadReservations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve reservation",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ready":
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "expired":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = !searchTerm || 
      reservation.libraryItem?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
      reservation.status?.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservations Management</h1>
            <p className="text-gray-600 mt-2">Manage all library reservations and requests</p>
          </div>
          <Button onClick={loadReservations} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by book title, user name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Reservations ({filteredReservations.length})
            </CardTitle>
            <CardDescription>
              Manage system-wide book reservations and requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading reservations...</span>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? "No reservations match your current filters." 
                    : "There are no reservations in the system."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-gray-700">Book</th>
                      <th className="text-left p-3 font-semibold text-gray-700">User</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Reserved Date</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Expires</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((reservation) => (
                      <tr key={reservation.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {reservation.libraryItem?.title || 'Unknown Book'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {reservation.itemId}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {reservation.user?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.user?.email || reservation.userId}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(reservation.status)}>
                            {reservation.status || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {reservation.reservedAt || reservation.createdAt 
                              ? new Date(reservation.reservedAt || reservation.createdAt).toLocaleDateString() 
                              : '—'}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {reservation.expiresAt 
                              ? new Date(reservation.expiresAt).toLocaleDateString() 
                              : '—'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {reservation.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveReservation(reservation.id)}
                                  disabled={processingId === reservation.id}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {processingId === reservation.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Approve'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                  disabled={processingId === reservation.id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  {processingId === reservation.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Cancel'
                                  )}
                                </Button>
                              </>
                            )}
                            {reservation.status === 'FULFILLED' && (
                              <span className="text-sm text-gray-500">Processed</span>
                            )}
                            {reservation.status === 'EXPIRED' && (
                              <span className="text-sm text-gray-500">Expired</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
