"use client"

import DashboardLayout from "@/app/components/dashboard-layout"
import AuthGuard from "@/components/auth/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, AlertTriangle, Clock, Package, Eye, Edit, CheckCircle, Search, Filter, Calendar, TrendingUp, RotateCcw, Plus, Loader2, UserPlus } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllLoans, getAllReservations, getOverdueLoans, getActivities, returnBook, renewLoan, approveReservation, createLoanForUser, getUsers, sendOverdueNotifications } from "@/lib/api"

interface CirculationStats {
  totalLoans: number
  activeLoans: number
  overdueLoans: number
  returnsToday: number
  newLoansToday: number
  popularItems: any[]
  recentActivity: any[]
}

function LibrarianDashboardContent() {
  const [stats, setStats] = useState<CirculationStats | null>(null)
  const [overdueItems, setOverdueItems] = useState<any[]>([])
  const [recentLoans, setRecentLoans] = useState<any[]>([])
  const [pendingReservations, setPendingReservations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLoan, setSelectedLoan] = useState<any>(null)
  const [loanDetailsOpen, setLoanDetailsOpen] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  
  // New loan dialog state
  const [createLoanOpen, setCreateLoanOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [users, setUsers] = useState<any[]>([])
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  const { toast } = useToast()

  // Helper function to set loading state
  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }))
  }

  useEffect(() => {
    fetchDashboardData()
    loadUsers()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const userData = await getUsers()
      setUsers(userData)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch real data from API - only using APIs from features
      const [loans, reservations, activities] = await Promise.all([
        getAllLoans().catch(() => []),
        getAllReservations().catch(() => []),
        getActivities().catch(() => [])
      ])
      
      // Process loans data - ensure loans is an array
      const safeLoans = Array.isArray(loans) ? loans : []
      const safeReservations = Array.isArray(reservations) ? reservations : []
      const safeActivities = Array.isArray(activities) ? activities : []
      
      // Filter active loans (not returned)
      const activeLoans = safeLoans.filter((loan: any) => 
        loan.status === 'BORROWED' && !loan.returnDate
      )
      
      // Get overdue loans from API
      let overdueLoans: any[] = []
      try {
        overdueLoans = await getOverdueLoans()
      } catch (error) {
        console.error('Failed to fetch overdue loans:', error)
        // Fallback to manual filtering
        overdueLoans = safeLoans.filter((loan: any) => {
          if (loan.status !== 'BORROWED' || loan.returnDate) return false
          const dueDate = loan.dueDate ? new Date(loan.dueDate) : null
          return dueDate && dueDate < new Date()
        })
      }
      
      const today = new Date().toDateString()
      
      // Today's returns - loans that were returned today
      const returnsToday = safeLoans.filter((loan: any) => 
        loan.returnDate && new Date(loan.returnDate).toDateString() === today
      )
      
      // New loans today - loans that were borrowed today
      const newLoansToday = safeLoans.filter((loan: any) => 
        loan.borrowDate && new Date(loan.borrowDate).toDateString() === today && 
        loan.status === 'ACTIVE'
      )
      
      // Renewed loans today - loans that were renewed today (check if renewal count > 0 and updated today)
      const renewedToday = safeLoans.filter((loan: any) => {
        if (!loan.updatedAt || !loan.renewalCount || loan.renewalCount === 0) return false
        return new Date(loan.updatedAt).toDateString() === today && 
               loan.status === 'ACTIVE' && 
               !loan.returnDate
      })
      
      setStats({
        activeLoans: activeLoans.length,
        overdueLoans: overdueLoans.length,
        returnsToday: returnsToday.length,
        newLoansToday: newLoansToday.length,
        totalLoans: safeLoans.length,
        popularItems: [],
        recentActivity: [
          ...returnsToday.map((loan: any) => ({ ...loan, activityType: 'RETURNED' })),
          ...newLoansToday.map((loan: any) => ({ ...loan, activityType: 'BORROWED' })),
          ...renewedToday.map((loan: any) => ({ ...loan, activityType: 'RENEWED' }))
        ]
      })
      
      setOverdueItems(overdueLoans.slice(0, 10)) // Show top 10 overdue items
      
      // Show recent loans (all types - active, returned, renewed)
      const allRecentLoans = safeLoans
        .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 10)
      setRecentLoans(allRecentLoans) 
      
      setPendingReservations(safeReservations.filter((r: any) => r.status === 'PENDING').slice(0, 10))
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnItem = async (loanId: string) => {
    const key = `return-${loanId}`
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      const result = await returnBook(loanId)
      toast({ 
        title: "Success! ✅", 
        description: "Item returned successfully" 
      })
      // Force a complete refresh
      setTimeout(() => {
        fetchDashboardData()
      }, 1000) // Give backend time to process
    } catch (error: any) {
      console.error('Return error:', error)
      toast({ 
        title: "Failed to return item", 
        description: error.message || "Please try again",
        variant: "destructive" 
      })
    } finally {
      setLoading(key, false)
    }
  }

  const handleRenewLoan = async (loanId: string) => {
    const key = `renew-${loanId}`
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      const result = await renewLoan(loanId)
      toast({ 
        title: "Success! 🔄", 
        description: "Loan renewed successfully" 
      })
      // Force a complete refresh
      setTimeout(() => {
        fetchDashboardData()
      }, 1000) // Give backend time to process
    } catch (error: any) {
      console.error('Renew error:', error)
      toast({ 
        title: "Failed to renew loan", 
        description: error.message || "Please try again",
        variant: "destructive" 
      })
    } finally {
      setLoading(key, false)
    }
  }

  const handleApproveReservation = async (reservationId: string) => {
    const key = `approve-${reservationId}`
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      await approveReservation(reservationId)
      toast({ title: "Reservation approved successfully" })
      await fetchDashboardData() // Auto-refresh
    } catch (error: any) {
      toast({ title: "Failed to approve reservation", description: error?.message || "Unknown error", variant: "destructive" })
    } finally {
      setLoading(key, false)
    }
  }

  const handleCreateLoan = async () => {
    if (!selectedUserId || !selectedItemId) {
      toast({ title: "Error", description: "Please select both user and item", variant: "destructive" })
      return
    }

    const key = "create-loan"
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      await createLoanForUser({ userId: selectedUserId, libraryItemId: selectedItemId })
      toast({ title: "Loan created successfully" })
      setCreateLoanOpen(false)
      setSelectedUserId("")
      setSelectedItemId("")
      await fetchDashboardData() // Auto-refresh
    } catch (error: any) {
      toast({ title: "Failed to create loan", description: error?.message || "Unknown error", variant: "destructive" })
    } finally {
      setLoading(key, false)
    }
  }

  const onViewLoanDetails = (loan: any) => {
    setSelectedLoan(loan)
    setLoanDetailsOpen(true)
  }

  const handleSendOverdueNotifications = async () => {
    const key = "send-overdue-notifications"
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      const result = await sendOverdueNotifications()
      toast({ 
        title: "Notifications Sent ✅", 
        description: result.message || "Overdue notifications sent successfully" 
      })
    } catch (error: any) {
      console.error('Send notifications error:', error)
      toast({ 
        title: "Failed to send notifications", 
        description: error.message || "Please try again",
        variant: "destructive" 
      })
    } finally {
      setLoading(key, false)
    }
  }

  return (
    <DashboardLayout userRole="librarian" userName="Sarah Librarian">
      <div className="space-y-4 sm:space-y-6 mobile-content-wrapper">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Librarian Dashboard</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage circulation, reservations, and daily operations</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              onClick={() => setCreateLoanOpen(true)}
              disabled={loadingStates["create-loan"]}
            >
              {loadingStates["create-loan"] ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              New Loan
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
              onClick={handleSendOverdueNotifications}
              disabled={loadingStates["send-overdue-notifications"]}
            >
              {loadingStates["send-overdue-notifications"] ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Send Overdue Notifications</span>
              <span className="sm:hidden">Overdue Alerts</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => fetchDashboardData()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active Loans</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">
                    {stats?.activeLoans || 0}
                  </p>
                </div>
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats?.overdueLoans || 0}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Returns Today</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.returnsToday || 0}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Loans Today</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats?.newLoansToday || 0}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reservations</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {pendingReservations.length || 0}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overdue" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overdue">Overdue Items</TabsTrigger>
            <TabsTrigger value="loans">Recent Loans</TabsTrigger>
            <TabsTrigger value="reservations">Pending Reservations</TabsTrigger>
            <TabsTrigger value="activity">Today's Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Overdue Items ({overdueItems.length})
                </CardTitle>
                <CardDescription>Items that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                {overdueItems.length > 0 ? (
                  <div className="space-y-3">
                    {overdueItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.libraryItem?.title}</p>
                          <p className="text-sm text-gray-600">
                            Borrower: {item.user?.name} | Due: {new Date(item.dueDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-red-600">
                            {Math.ceil((new Date().getTime() - new Date(item.dueDate).getTime()) / (1000 * 3600 * 24))} days overdue
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onViewLoanDetails(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleReturnItem(item.id)}
                            disabled={loadingStates[`return-${item.id}`]}
                          >
                            {loadingStates[`return-${item.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Return"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No overdue items</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="loans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Loans</CardTitle>
                <CardDescription>Latest loan activities (borrowed, returned, renewed)</CardDescription>
              </CardHeader>
              <CardContent>
                {recentLoans.length > 0 ? (
                  <div className="space-y-3">
                    {recentLoans.map((loan: any) => (
                      <div key={loan.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{loan.libraryItem?.title}</p>
                          <p className="text-sm text-gray-600">
                            Borrower: {loan.user?.name} | 
                            {loan.returnDate ? (
                              <span className="text-green-600 font-medium">
                                Returned: {new Date(loan.returnDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                            )}
                            {loan.renewalCount > 0 && (
                              <span className="text-purple-600 ml-2">
                                | Renewed {loan.renewalCount} time(s)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onViewLoanDetails(loan)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {loan.status === 'BORROWED' && !loan.returnDate ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRenewLoan(loan.id)}
                                disabled={loadingStates[`renew-${loan.id}`]}
                              >
                                {loadingStates[`renew-${loan.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Renew"
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleReturnItem(loan.id)}
                                disabled={loadingStates[`return-${loan.id}`]}
                              >
                                {loadingStates[`return-${loan.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Return"
                                )}
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              {loan.returnDate && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                  Returned
                                </span>
                              )}
                              {loan.status === 'RENEWED' && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  Renewed
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent loans</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reservations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reservations</CardTitle>
                <CardDescription>Reservations awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReservations.length > 0 ? (
                  <div className="space-y-3">
                    {pendingReservations.map((reservation: any) => (
                      <div key={reservation.id} className="flex justify-between items-center p-3 border border-orange-200 rounded-lg bg-orange-50">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{reservation.libraryItem?.title}</p>
                          <p className="text-sm text-gray-600">
                            Requested by: {reservation.user?.name} | Date: {new Date(reservation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Deny
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveReservation(reservation.id)}
                            disabled={loadingStates[`approve-${reservation.id}`]}
                          >
                            {loadingStates[`approve-${reservation.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No pending reservations</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity Summary</CardTitle>
                <CardDescription>Overview of today's circulation activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Items Checked Out</p>
                        <p className="text-2xl font-bold text-blue-600">{stats?.newLoansToday || 0}</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Items Returned</p>
                        <p className="text-2xl font-bold text-green-600">{stats?.returnsToday || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Loans Renewed</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats?.recentActivity?.filter((a: any) => a.activityType === 'RENEWED').length || 0}
                        </p>
                      </div>
                      <RotateCcw className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Activity List */}
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Recent Activity</h4>
                    {stats.recentActivity.slice(0, 10).map((activity: any) => (
                      <div key={`${activity.id}-${activity.activityType}`} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.libraryItem?.title}</p>
                          <p className="text-sm text-gray-600">
                            User: {activity.user?.name} | 
                            <span className={`ml-1 font-medium ${
                              activity.activityType === 'RETURNED' ? 'text-green-600' : 
                              activity.activityType === 'RENEWED' ? 'text-purple-600' : 
                              'text-blue-600'
                            }`}>
                              {activity.activityType}
                            </span>
                            {activity.activityType === 'RETURNED' && activity.returnDate && 
                              ` | Returned: ${new Date(activity.returnDate).toLocaleTimeString()}`
                            }
                            {activity.activityType === 'RENEWED' && activity.renewalCount &&
                              ` | Renewal #${activity.renewalCount}`
                            }
                          </p>
                        </div>
                        <div className="flex items-center">
                          {activity.activityType === 'RETURNED' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Returned
                            </Badge>
                          )}
                          {activity.activityType === 'RENEWED' && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Renewed
                            </Badge>
                          )}
                          {activity.activityType === 'BORROWED' && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <BookOpen className="h-3 w-3 mr-1" />
                              Borrowed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No activity today</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Loan Details Dialog */}
        <Dialog open={loanDetailsOpen} onOpenChange={setLoanDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Loan Details</DialogTitle>
            </DialogHeader>
            
            {selectedLoan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Item</Label>
                    <p className="text-lg">{selectedLoan.libraryItem?.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Borrower</Label>
                    <p className="text-lg">{selectedLoan.user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Loan Date</Label>
                    <p className="text-lg">{new Date(selectedLoan.loanDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                    <p className="text-lg">{new Date(selectedLoan.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant={selectedLoan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {selectedLoan.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Barcode</Label>
                    <p className="text-lg">{selectedLoan.libraryItem?.barcode}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleReturnItem(selectedLoan.id)}
                    disabled={loadingStates[`return-${selectedLoan.id}`]}
                  >
                    {loadingStates[`return-${selectedLoan.id}`] ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Returning...
                      </>
                    ) : (
                      "Mark as Returned"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleRenewLoan(selectedLoan.id)}
                    disabled={loadingStates[`renew-${selectedLoan.id}`]}
                  >
                    {loadingStates[`renew-${selectedLoan.id}`] ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Renewing...
                      </>
                    ) : (
                      "Renew Loan"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Loan Dialog */}
        <Dialog open={createLoanOpen} onOpenChange={setCreateLoanOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Loan</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user">Select User</Label>
                <select
                  id="user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  disabled={loadingUsers}
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
                {loadingUsers && <p className="text-sm text-muted-foreground">Loading users...</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item">Library Item ID</Label>
                <input
                  id="item"
                  type="text"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  placeholder="Enter library item ID..."
                />
                <p className="text-xs text-muted-foreground">
                  Enter the ID of the library item to loan out
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setCreateLoanOpen(false)}
                disabled={loadingStates["create-loan"]}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLoan} 
                disabled={!selectedUserId || !selectedItemId || loadingStates["create-loan"]}
              >
                {loadingStates["create-loan"] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Loan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function LibrarianDashboard() {
  return (
    <AuthGuard allowed={["LIBRARIAN"]}>
      <LibrarianDashboardContent />
    </AuthGuard>
  )
}
