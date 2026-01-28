"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, X, BookOpen, RefreshCw } from "lucide-react"
import { getMyReservations, cancelReservation } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function PatronReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelledItems, setCancelledItems] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const data = await getMyReservations()
      setReservations(data || [])
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

  const handleCancelReservation = async (id: string) => {
    try {
      setCancelling(id)
      await cancelReservation(id)
      
      // Add to cancelled items for animation
      setCancelledItems(prev => new Set([...prev, id]))
      
      toast({
        title: "Success! ✨",
        description: "Reservation cancelled successfully",
      })
      
      // Remove from list after animation
      setTimeout(() => {
        loadReservations()
        setCancelledItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }, 500)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel reservation",
        variant: "destructive",
      })
    } finally {
      setCancelling(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ready":
      case "available":
        return "bg-green-100 text-green-800"
      case "pending":
      case "waiting":
        return "bg-yellow-100 text-yellow-800"
      case "expired":
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ready":
      case "available":
        return "Ready for Pickup"
      case "pending":
        return "Pending"
      case "waiting":
        return "In Queue"
      case "expired":
        return "Expired"
      case "cancelled":
        return "Cancelled"
      default:
        return status || "Unknown"
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="patron">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="patron">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
            <p className="text-gray-600 mt-2">Track your book reservations and pickup status</p>
          </div>
          <Button onClick={loadReservations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Reservations List */}
        {reservations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations</h3>
              <p className="text-gray-600 mb-4">You don't have any book reservations at the moment.</p>
              <Button asChild>
                <a href="/dashboard/patron/browse">Browse Books</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <Card 
                key={reservation.id} 
                className={`hover:shadow-md transition-all duration-300 transform ${
                  cancelledItems.has(reservation.id) 
                    ? 'scale-95 opacity-50 translate-x-4' 
                    : 'scale-100 opacity-100 translate-x-0'
                } ${
                  reservation.status === 'READY' || reservation.status === 'ready'
                    ? 'ring-2 ring-green-200 bg-green-50 animate-pulse'
                    : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      {/* Book Cover Placeholder */}
                      <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {reservation.libraryItem?.title || 'Unknown Title'}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {reservation.libraryItem?.author || 'Unknown Author'}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Reserved: {new Date(reservation.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {reservation.expiryDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Expires: {new Date(reservation.expiryDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        {reservation.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Notes:</strong> {reservation.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge className={getStatusColor(reservation.status)}>
                        {getStatusText(reservation.status)}
                      </Badge>

                      {/* Cancel Button - only show for pending/waiting reservations */}
                      {(reservation.status === 'PENDING' || reservation.status === 'pending') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelReservation(reservation.id)}
                          disabled={cancelling === reservation.id || cancelledItems.has(reservation.id)}
                          loading={cancelling === reservation.id}
                          loadingText="Cancelling..."
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}

                      {/* Ready for pickup notice */}
                      {(reservation.status === 'READY' || reservation.status === 'ready') && (
                        <div className="text-center animate-bounce">
                          <p className="text-sm font-medium text-green-700">Ready for pickup! 🎉</p>
                          <p className="text-xs text-gray-600">Visit library to collect</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Text */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Reservation Status</h4>
                <ul className="space-y-1 text-gray-600">
                  <li><Badge className="bg-yellow-100 text-yellow-800 mr-2">Pending</Badge>Waiting for availability</li>
                  <li><Badge className="bg-green-100 text-green-800 mr-2">Ready</Badge>Available for pickup</li>
                  <li><Badge className="bg-red-100 text-red-800 mr-2">Expired</Badge>Pickup window closed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Important Notes</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• You have 3 days to collect ready books</li>
                  <li>• You can cancel pending reservations anytime</li>
                  <li>• Check your email for pickup notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
