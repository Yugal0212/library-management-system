"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, BookOpen, TrendingUp, AlertCircle, DollarSign, 
  Calendar, Clock, BarChart3, PieChart, Activity,
  RefreshCcw, Download, Filter, Eye
} from "lucide-react"
import { 
  getUsers, getBooks, getAllLoans, getAllReservations, 
  getAllFines, getActivities, getUserStats 
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SystemStats {
  users: {
    total: number
    active: number
    inactive: number
    byRole: { [key: string]: number }
    newThisMonth: number
  }
  books: {
    total: number
    available: number
    borrowed: number
    damaged: number
  }
  loans: {
    total: number
    active: number
    overdue: number
    returned: number
    avgLoanDuration: number
  }
  fines: {
    total: number
    pending: number
    paid: number
    totalAmount: number
    avgFineAmount: number
  }
  activity: {
    loansToday: number
    returnsToday: number
    newUsersToday: number
    overdueTrend: string
  }
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [rawData, setRawData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [users, books, loans, reservations, fines, activities] = await Promise.all([
        getUsers().catch(() => []),
        getBooks().catch(() => []),
        getAllLoans().catch(() => []),
        getAllReservations().catch(() => []),
        getAllFines().catch(() => []),
        getActivities().catch(() => [])
      ])

      const safeUsers = Array.isArray(users) ? users : []
      const safeBooks = Array.isArray(books) ? books : []
      const safeLoans = Array.isArray(loans) ? loans : []
      const safeFines = Array.isArray(fines) ? fines : []
      const safeActivities = Array.isArray(activities) ? activities : []

      // Store raw data
      setRawData({ users: safeUsers, books: safeBooks, loans: safeLoans, fines: safeFines })

      // Calculate comprehensive statistics
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // User statistics
      const activeUsers = safeUsers.filter((u: any) => u.isActive !== false)
      const usersByRole = safeUsers.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {})
      const newUsersThisMonth = safeUsers.filter((u: any) => 
        new Date(u.createdAt) >= thisMonth
      ).length

      // Book statistics
      const availableBooks = safeBooks.filter((b: any) => b.isAvailable).length
      const borrowedBooks = safeBooks.filter((b: any) => !b.isAvailable).length

      // Loan statistics
      const activeLoans = safeLoans.filter((l: any) => 
        l.status === 'BORROWED' && !l.returnDate
      )
      const overdueLoans = activeLoans.filter((l: any) => {
        const dueDate = new Date(l.dueDate)
        return dueDate < now
      })
      const returnedLoans = safeLoans.filter((l: any) => l.returnDate)
      
      // Calculate average loan duration
      const avgDuration = returnedLoans.length > 0 
        ? returnedLoans.reduce((sum: number, loan: any) => {
            const borrowed = new Date(loan.borrowDate)
            const returned = new Date(loan.returnDate)
            return sum + (returned.getTime() - borrowed.getTime()) / (1000 * 60 * 60 * 24)
          }, 0) / returnedLoans.length
        : 0

      // Fine statistics
      const pendingFines = safeFines.filter((f: any) => f.status === 'PENDING')
      const paidFines = safeFines.filter((f: any) => f.status === 'PAID')
      const totalFineAmount = safeFines.reduce((sum: number, fine: any) => 
        sum + (Number(fine.amount) || 0), 0
      )
      const avgFineAmount = safeFines.length > 0 ? totalFineAmount / safeFines.length : 0

      // Today's activity
      const loansToday = safeLoans.filter((l: any) => 
        new Date(l.borrowDate).toDateString() === today.toDateString()
      ).length
      const returnsToday = safeLoans.filter((l: any) => 
        l.returnDate && new Date(l.returnDate).toDateString() === today.toDateString()
      ).length
      const newUsersToday = safeUsers.filter((u: any) => 
        new Date(u.createdAt).toDateString() === today.toDateString()
      ).length

      setStats({
        users: {
          total: safeUsers.length,
          active: activeUsers.length,
          inactive: safeUsers.length - activeUsers.length,
          byRole: usersByRole,
          newThisMonth: newUsersThisMonth
        },
        books: {
          total: safeBooks.length,
          available: availableBooks,
          borrowed: borrowedBooks,
          damaged: 0 // Would need to track this separately
        },
        loans: {
          total: safeLoans.length,
          active: activeLoans.length,
          overdue: overdueLoans.length,
          returned: returnedLoans.length,
          avgLoanDuration: Math.round(avgDuration * 10) / 10
        },
        fines: {
          total: safeFines.length,
          pending: pendingFines.length,
          paid: paidFines.length,
          totalAmount: totalFineAmount,
          avgFineAmount: Math.round(avgFineAmount * 100) / 100
        },
        activity: {
          loansToday,
          returnsToday,
          newUsersToday,
          overdueTrend: overdueLoans.length > 5 ? 'high' : overdueLoans.length > 2 ? 'medium' : 'low'
        }
      })

    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast({
        title: "Error",
        description: "Failed to load system analytics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAnalytics()
  }

  if (loading) {
    return (
      <DashboardLayout userRole="admin" userName="Admin User">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Loading system analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout userRole="admin" userName="Admin User">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load analytics data</p>
          <Button onClick={loadAnalytics} className="mt-4">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive library system insights and metrics</p>
          </div>
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.users.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.users.active} active, {stats.users.inactive} inactive
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Library Items</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.books.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.books.available} available, {stats.books.borrowed} borrowed
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.loans.active}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.loans.overdue} overdue items
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${stats.fines.totalAmount.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.fines.pending} unpaid fines
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="circulation">Circulation</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Today's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Loans</span>
                    <Badge variant="outline">{stats.activity.loansToday}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Returns</span>
                    <Badge variant="outline">{stats.activity.returnsToday}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Users</span>
                    <Badge variant="outline">{stats.activity.newUsersToday}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overdue Status</span>
                    <Badge 
                      variant={stats.activity.overdueTrend === 'high' ? 'destructive' : 
                              stats.activity.overdueTrend === 'medium' ? 'secondary' : 'outline'}
                    >
                      {stats.activity.overdueTrend.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Book Availability</span>
                      <span>{Math.round((stats.books.available / stats.books.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.books.available / stats.books.total) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User Activity Rate</span>
                      <span>{Math.round((stats.users.active / stats.users.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.users.active / stats.users.total) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>On-time Return Rate</span>
                      <span>{Math.round(((stats.loans.returned - stats.loans.overdue) / Math.max(stats.loans.returned, 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((stats.loans.returned - stats.loans.overdue) / Math.max(stats.loans.returned, 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution by Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.users.byRole).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{role.toLowerCase()}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.users.newThisMonth}
                    </div>
                    <p className="text-sm text-gray-600">New users this month</p>
                    <div className="flex justify-center space-x-4 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{stats.users.active}</div>
                        <div className="text-gray-500">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{stats.users.inactive}</div>
                        <div className="text-gray-500">Inactive</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="circulation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Loans</span>
                      <span className="font-medium">{stats.loans.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Currently Active</span>
                      <span className="font-medium">{stats.loans.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Overdue</span>
                      <span className="font-medium text-red-600">{stats.loans.overdue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Completed</span>
                      <span className="font-medium text-green-600">{stats.loans.returned}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.loans.avgLoanDuration}
                      </div>
                      <p className="text-sm text-gray-600">Avg loan duration (days)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Collection Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Items</span>
                      <span className="font-medium">{stats.books.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Available</span>
                      <span className="font-medium text-green-600">{stats.books.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">On Loan</span>
                      <span className="font-medium text-orange-600">{stats.books.borrowed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fine Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600">
                        ${stats.fines.totalAmount.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-600">Total fines collected</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <div className="font-medium">{stats.fines.pending}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{stats.fines.paid}</div>
                        <div className="text-xs text-gray-500">Paid</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fine Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Average Fine</span>
                      <span className="font-medium">${stats.fines.avgFineAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Collection Rate</span>
                      <span className="font-medium">
                        {stats.fines.total > 0 ? Math.round((stats.fines.paid / stats.fines.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Outstanding</span>
                      <span className="font-medium text-red-600">{stats.fines.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
