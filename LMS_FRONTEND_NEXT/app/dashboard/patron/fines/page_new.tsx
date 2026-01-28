"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DollarSign, AlertCircle, Calendar, BookOpen, CheckCircle, Loader2 } from "lucide-react"
import { getMyFines } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function MyFinesPage() {
  const [fines, setFines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMyFines()
  }, [])

  const loadMyFines = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getMyFines()
      const finesData = Array.isArray(response) ? response : (response as any)?.data || []
      setFines(finesData)
    } catch (error) {
      console.error('Failed to load fines:', error)
      setError('Failed to load fines')
      toast({
        title: "Error",
        description: "Failed to load your fines",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const pendingFines = fines.filter(fine => fine.status === 'PENDING')
  const paidFines = fines.filter(fine => fine.status === 'PAID')
  const waivedFines = fines.filter(fine => fine.status === 'WAIVED')

  const totalPending = pendingFines.reduce((sum, fine) => sum + fine.amount, 0)
  const totalPaid = paidFines.reduce((sum, fine) => sum + fine.amount, 0)
  const totalWaived = waivedFines.reduce((sum, fine) => sum + fine.amount, 0)

  if (loading) {
    return (
      <DashboardLayout userRole="patron">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your fines...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="patron">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Fines & Penalties</h1>
          <p className="text-gray-600 mt-2">View and manage your library fines</p>
        </div>

        {/* Alert for Outstanding Fines */}
        {totalPending > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Outstanding Fines</AlertTitle>
            <AlertDescription>
              You have ${totalPending.toFixed(2)} in unpaid fines. Please contact the library to arrange payment.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Fines</p>
                  <p className="text-3xl font-bold text-red-600">${totalPending.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paid Fines</p>
                  <p className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Waived Fines</p>
                  <p className="text-3xl font-bold text-blue-600">${totalWaived.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Information */}
        {totalPending > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>How to pay your outstanding fines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Payment Methods</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Visit the library circulation desk</li>
                    <li>• Pay by cash, credit card, or check</li>
                    <li>• Call (555) 123-4567 to pay by phone</li>
                    <li>• Online payment system coming soon</li>
                  </ul>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Important Notes</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Your borrowing privileges may be suspended until fines are paid</li>
                    <li>• Fines continue to accrue until items are returned</li>
                    <li>• Contact us if you need assistance with payment</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fines List */}
        <Card>
          <CardHeader>
            <CardTitle>Fine Details</CardTitle>
            <CardDescription>Complete list of all your fines</CardDescription>
          </CardHeader>
          <CardContent>
            {fines.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Fines</h3>
                <p className="text-gray-600">You don't have any fines. Keep up the good work!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pending Fines */}
                {pendingFines.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Outstanding Fines</h3>
                    <div className="space-y-3">
                      {pendingFines.map((fine) => (
                        <div key={fine.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-900">${fine.amount.toFixed(2)}</span>
                              <Badge variant="destructive">Pending</Badge>
                            </div>
                            <p className="text-sm text-red-800 mb-1">
                              {fine.reason || 'Late return penalty'}
                            </p>
                            {fine.loan?.libraryItem && (
                              <p className="text-sm text-red-700 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                Book: {fine.loan.libraryItem.title}
                              </p>
                            )}
                            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Created: {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid Fines */}
                {paidFines.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Paid Fines</h3>
                    <div className="space-y-3">
                      {paidFines.map((fine) => (
                        <div key={fine.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-900">${fine.amount.toFixed(2)}</span>
                              <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
                            </div>
                            <p className="text-sm text-green-800 mb-1">
                              {fine.reason || 'Late return penalty'}
                            </p>
                            {fine.loan?.libraryItem && (
                              <p className="text-sm text-green-700 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                Book: {fine.loan.libraryItem.title}
                              </p>
                            )}
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Created: {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Waived Fines */}
                {waivedFines.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Waived Fines</h3>
                    <div className="space-y-3">
                      {waivedFines.map((fine) => (
                        <div key={fine.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">${fine.amount.toFixed(2)}</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Waived</Badge>
                            </div>
                            <p className="text-sm text-blue-800 mb-1">
                              {fine.reason || 'Late return penalty'}
                            </p>
                            {fine.waivedBy && (
                              <p className="text-sm text-blue-700">
                                Waived by: {fine.waivedBy.name}
                              </p>
                            )}
                            {fine.loan?.libraryItem && (
                              <p className="text-sm text-blue-700 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                Book: {fine.loan.libraryItem.title}
                              </p>
                            )}
                            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Created: {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
