"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import AuthGuard from "@/components/auth/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Calendar, DollarSign, Search, Star, AlertCircle, Eye } from "lucide-react"
import { getMyLoans, getMyReservations, getMyFines, getLibraryItems } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

function PatronDashboardContent() {
  const [loans, setLoans] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [fines, setFines] = useState<any[]>([])
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load patron-specific data
      const [myLoans, myReservations, myFines, libraryItems] = await Promise.all([
        getMyLoans().catch(() => []),
        getMyReservations().catch(() => []),
        getMyFines().catch(() => []),
        getLibraryItems().catch(() => [])
      ])

      setLoans(Array.isArray(myLoans) ? myLoans : [])
      setReservations(Array.isArray(myReservations) ? myReservations : [])
      setFines(Array.isArray(myFines) ? myFines : [])
      // Show first 6 available books as recommendations
      const booksArray = Array.isArray(libraryItems) ? libraryItems : []
      setRecommendedBooks(booksArray.filter((book: any) => book.isAvailable).slice(0, 6))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const safeLoans = Array.isArray(loans) ? loans : [];
  const safeReservations = Array.isArray(reservations) ? reservations : [];
  const safeFines = Array.isArray(fines) ? fines : [];

  const activeLoanCount = safeLoans.filter(loan => loan.status === 'BORROWED').length
  const overdueLoanCount = safeLoans.filter(loan => 
    loan.status === 'BORROWED' && loan.dueDate && new Date(loan.dueDate) < new Date()
  ).length
  const pendingReservationCount = safeReservations.filter(res => res.status === 'PENDING').length
  const unpaidFineCount = safeFines.filter(fine => fine.status === 'PENDING').length
  const totalFineAmount = safeFines.filter(fine => fine.status === 'PENDING').reduce((sum, fine) => sum + (Number(fine.amount) || 0), 0)

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Library Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your library account.</p>
          {error && (
            <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Alert for Overdue Books */}
        {overdueLoanCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                ⚠️ You have {overdueLoanCount} overdue book{overdueLoanCount > 1 ? 's' : ''}
              </CardTitle>
              <CardDescription className="text-red-700">
                Please return these books as soon as possible to avoid additional fines.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Loans</p>
                  <p className="text-3xl font-bold text-gray-900">{activeLoanCount}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overdue Books</p>
                  <p className={`text-3xl font-bold ${overdueLoanCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {overdueLoanCount}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${overdueLoanCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                  <Clock className={`h-6 w-6 ${overdueLoanCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reservations</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingReservationCount}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Outstanding Fines</p>
                  <p className={`text-3xl font-bold ${totalFineAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    ${(Number(totalFineAmount) || 0).toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${totalFineAmount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                  <DollarSign className={`h-6 w-6 ${totalFineAmount > 0 ? 'text-red-600' : 'text-green-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Current Books */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Current Books</CardTitle>
                <CardDescription>Books you have borrowed</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/patron/my-books">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loans.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No books currently borrowed</p>
                  <Button className="mt-3" asChild>
                    <Link href="/dashboard/patron/browse">Browse Books</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {loans.slice(0, 3).map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{loan.libraryItem?.title || 'Unknown Title'}</h4>
                        <p className="text-sm text-gray-600">{loan.libraryItem?.author || 'Unknown Author'}</p>
                        <p className="text-xs text-gray-500">
                          Due: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={
                          loan.status === 'OVERDUE' ? "destructive" : 
                          loan.status === 'BORROWED' ? "default" : "secondary"
                        }>
                          {loan.status}
                        </Badge>
                        {loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status === 'BORROWED' && (
                          <Badge variant="destructive" className="text-xs">OVERDUE</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {loans.length > 3 && (
                    <p className="text-sm text-gray-600 text-center">
                      And {loans.length - 3} more books...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Books */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>Popular books available now</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/patron/browse">
                  <Search className="h-4 w-4 mr-2" />
                  Browse All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recommendedBooks.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No recommendations available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {recommendedBooks.slice(0, 4).map((book) => (
                    <div key={book.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{book.title}</h4>
                      <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                      <Badge variant="outline" className="text-xs">
                        {book.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <Link href="/dashboard/patron/browse">
                  <Search className="h-6 w-6" />
                  <span className="text-sm">Browse Books</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <Link href="/dashboard/patron/my-books">
                  <BookOpen className="h-6 w-6" />
                  <span className="text-sm">My Books</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <Link href="/dashboard/patron/reservations">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Reservations</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <Link href="/dashboard/patron/profile">
                  <Star className="h-6 w-6" />
                  <span className="text-sm">My Profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function PatronDashboard() {
  return (
    <AuthGuard allowed={["STUDENT", "TEACHER"]}>
      <PatronDashboardContent />
    </AuthGuard>
  )
}
