"use client"

import { useState, useEffect } from "react"
import AuthGuard from "@/components/auth/auth-guard"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getAllFines, payFine, waiveFine, calculateOverdueFines, sendFineReminder, type Fine } from "@/lib/api"
import { DollarSign, User, Calendar, CheckCircle, AlertTriangle, Calculator, Mail } from "lucide-react"

export default function LibrarianFinesPage() {
  const [fines, setFines] = useState<Fine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFines()
  }, [])

  const loadFines = async () => {
    try {
      setLoading(true)
      const data = await getAllFines()
      setFines(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load fines")
    } finally {
      setLoading(false)
    }
  }

  const handlePayFine = async (id: string) => {
    try {
      await payFine(id)
      toast({ title: "Success", description: "Fine marked as paid." })
      loadFines()
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to process payment",
        variant: "destructive" 
      })
    }
  }

  const handleWaiveFine = async (id: string) => {
    try {
      await waiveFine(id)
      toast({ title: "Success", description: "Fine has been waived." })
      loadFines()
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to waive fine",
        variant: "destructive" 
      })
    }
  }

  const handleCalculateOverdue = async () => {
    try {
      setLoading(true)
      const result = await calculateOverdueFines()
      toast({ 
        title: "Success", 
        description: `${result.finesCreated} new overdue fines have been calculated and created.` 
      })
      loadFines() // Refresh the list
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to calculate overdue fines",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async (fineId: string, userEmail: string) => {
    try {
      const result = await sendFineReminder(fineId)
      toast({ 
        title: "Reminder Sent", 
        description: `Payment reminder sent to ${result.sentTo}` 
      })
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to send reminder",
        variant: "destructive" 
      })
    }
  }

  const totalUnpaid = fines.filter(f => f.status === "PENDING").reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
  const totalFines = fines.length
  const unpaidCount = fines.filter(f => f.status === "PENDING").length

  if (loading) return (
    <DashboardLayout userRole="librarian">
      <div className="p-6">Loading fines...</div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout userRole="librarian">
      <div className="p-6 text-destructive">Error: {error}</div>
    </DashboardLayout>
  )

  return (
    <AuthGuard allowed={["LIBRARIAN"]}>
      <DashboardLayout userRole="librarian">
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-3xl font-bold">Fines Management</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              onClick={handleCalculateOverdue} 
              variant="default"
              className="flex items-center gap-2 text-sm w-full sm:w-auto"
              disabled={loading}
            >
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Calculate Overdue Fines</span>
              <span className="sm:hidden">Calculate Fines</span>
            </Button>
            <Button onClick={loadFines} variant="outline" className="w-full sm:w-auto text-sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Fines</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{totalFines}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Unpaid Fines</CardTitle>
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{unpaidCount}</div>
            </CardContent>
          </Card>
          
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Amount Owed</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">${(Number(totalUnpaid) || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Fines List */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">All Fines</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {fines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm sm:text-base">No fines found</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {fines.map((fine) => (
                  <div key={fine.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-semibold text-sm sm:text-base">{fine.user?.email || 'Unknown User'}</h3>
                        <Badge variant={fine.status === "PAID" ? "default" : "destructive"} className="text-xs w-fit">
                          {fine.status}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {fine.reason || 'No reason provided'}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Created: {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">${(Number(fine.amount) || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {fine.status === "PENDING" && (
                        <>
                          <Button
                            onClick={() => handlePayFine(fine.id)}
                            size="sm"
                            className="flex items-center gap-1 text-xs w-full sm:w-auto"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Mark Paid</span>
                            <span className="sm:hidden">Paid</span>
                          </Button>
                          <Button
                            onClick={() => handleWaiveFine(fine.id)}
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-1 text-xs w-full sm:w-auto"
                          >
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                            Waive
                          </Button>
                          <Button
                            onClick={() => handleSendReminder(fine.id, fine.user?.email || '')}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 text-xs w-full sm:w-auto"
                          >
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Send Reminder</span>
                            <span className="sm:hidden">Remind</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
