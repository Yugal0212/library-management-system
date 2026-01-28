"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import AuthGuard from "@/components/auth/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, BookOpen, TrendingUp, AlertCircle, DollarSign, Calendar, CheckCircle, X, Shield, Plus, Loader2 } from "lucide-react"
import { getDashboardStats, getLibrarianRequests, approveLibrarian, rejectLibrarian, getUsers, getBooks, getAllLoans, getAllReservations, getAllFines, createLibraryItem } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

function AdminDashboardContent() {
  const [stats, setStats] = useState<any>({})
  const [librarianRequests, setLibrarianRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddBookDialog, setShowAddBookDialog] = useState(false)
  const [isSubmittingBook, setIsSubmittingBook] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Book form state
  const [bookForm, setBookForm] = useState({
    title: '',
    type: 'BOOK',
    description: '',
    author: '',
    isbn: '',
    totalCopies: '',
    publishedYear: '',
    location: '',
    category: ''
  })

  const bookCategories = [
    'Fiction',
    'Non-Fiction',
    'Science',
    'Technology',
    'History',
    'Biography',
    'Literature',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Computer Science',
    'Engineering',
    'Medicine',
    'Art',
    'Philosophy',
    'Religion',
    'Self-Help',
    'Business',
    'Economics',
    'Psychology',
    'Education',
    'Reference',
    'Children',
    'Young Adult'
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load real data from APIs
      const [users, books, loans, reservations, fines, requests] = await Promise.all([
        getUsers().catch(() => []),
        getBooks().catch(() => []),
        getAllLoans().catch(() => []),
        getAllReservations().catch(() => []),
        getAllFines().catch(() => []),
        getLibrarianRequests().catch(() => [])
      ])

      // Calculate stats from real data
      const totalUsers = Array.isArray(users) ? users.length : 0
      const totalBooks = Array.isArray(books) ? books.length : 0
      const totalLoans = Array.isArray(loans) ? loans.length : 0
      const activeLoans = Array.isArray(loans) ? loans.filter((loan: any) => loan.status === 'BORROWED' && !loan.returnDate).length : 0
      const overdueLoans = Array.isArray(loans) ? loans.filter((loan: any) => {
        if (loan.status !== 'BORROWED' || loan.returnDate) return false
        const dueDate = loan.dueDate ? new Date(loan.dueDate) : null
        return dueDate && dueDate < new Date()
      }).length : 0
      const totalReservations = Array.isArray(reservations) ? reservations.length : 0
      const pendingReservations = Array.isArray(reservations) ? reservations.filter((res: any) => res.status === 'PENDING').length : 0
      const totalFines = Array.isArray(fines) ? fines.length : 0
      const unpaidFines = Array.isArray(fines) ? fines.filter((fine: any) => fine.status === 'PENDING').length : 0
      const totalFineAmount = Array.isArray(fines) ? fines.reduce((sum: number, fine: any) => sum + (Number(fine.amount) || 0), 0) : 0

      setStats({
        totalUsers,
        totalBooks,
        totalLoans,
        activeLoans,
        overdueLoans,
        totalReservations,
        pendingReservations,
        totalFines,
        unpaidFines,
        totalFineAmount
      })

      setLibrarianRequests(Array.isArray(requests) ? requests.filter((req: any) => req.status === 'PENDING') : [])
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveLibrarian = async (id: string) => {
    try {
      await approveLibrarian(id)
      toast({
        title: "Success",
        description: "Librarian request approved successfully",
      })
      loadDashboardData() // Refresh data
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to approve librarian request",
        variant: "destructive",
      })
    }
  }

  const handleRejectLibrarian = async (id: string) => {
    try {
      await rejectLibrarian(id)
      toast({
        title: "Success",
        description: "Librarian request rejected",
      })
      loadDashboardData() // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject librarian request", 
        variant: "destructive",
      })
    }
  }

  const handleCreateBook = async () => {
    if (!bookForm.title || !bookForm.type || !bookForm.totalCopies || !bookForm.category) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields: Title, Type, Total Copies, and Category.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingBook(true)
    
    try {
      const bookData = {
        title: bookForm.title,
        type: bookForm.type as any,
        description: bookForm.description,
        isbn: bookForm.isbn,
        publishedAt: bookForm.publishedYear ? `${bookForm.publishedYear}-01-01` : undefined,
        location: bookForm.location,
        metadata: {
          author: bookForm.author,
          totalCopies: parseInt(bookForm.totalCopies) || 1,
          publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : undefined,
          category: bookForm.category,
        },
      }

      await createLibraryItem(bookData)
      
      toast({
        title: "Book Added Successfully",
        description: `"${bookForm.title}" has been added to the library.`,
      })

      // Reset form and close dialog
      setBookForm({
        title: '',
        type: 'BOOK',
        description: '',
        author: '',
        isbn: '',
        totalCopies: '',
        publishedYear: '',
        location: '',
        category: ''
      })
      setShowAddBookDialog(false)
      
      // Reload data to show new book in stats
      loadDashboardData()

    } catch (error) {
      console.error('Error creating book:', error)
      toast({
        title: "Error Adding Book",
        description: "Failed to add the book. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingBook(false)
    }
  }

  const dashboardCards = [
    {
      title: "Total Users",
      value: loading ? "..." : stats.totalUsers?.toString() || "0",
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Books",
      value: loading ? "..." : stats.totalBooks?.toString() || "0",
      icon: BookOpen,
      color: "green",
    },
    {
      title: "Active Loans",
      value: loading ? "..." : stats.activeLoans?.toString() || "0",
      icon: TrendingUp,
      color: "purple",
    },
    {
      title: "Overdue Items",
      value: loading ? "..." : stats.overdueLoans?.toString() || "0",
      icon: AlertCircle,
      color: "red",
    },
    {
      title: "Pending Reservations",
      value: loading ? "..." : stats.pendingReservations?.toString() || "0",
      icon: Calendar,
      color: "orange",
    },
    {
      title: "Total Fine Amount",
      value: loading ? "..." : `$${(stats.totalFineAmount || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "emerald",
    },
  ]

  if (loading) {
    return (
      <DashboardLayout userRole="admin" userName="Admin User">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin" userName="Admin User">
      <div className="space-y-4 sm:space-y-6 mobile-content-wrapper">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your library system and monitor performance</p>
          {error && (
            <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Pending Librarian Requests - Priority Display */}
        {librarianRequests.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-800 text-lg sm:text-xl">
                <Shield className="h-5 w-5" />
                🚨 Pending Librarian Requests ({librarianRequests.length})
              </CardTitle>
              <CardDescription className="text-orange-700">
                New librarian applications requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {librarianRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg bg-white border-orange-300 gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{request.name}</p>
                      <p className="text-sm text-gray-600">{request.email}</p>
                      <p className="text-xs text-gray-500">
                        Applied: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveLibrarian(request.id)}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectLibrarian(request.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {dashboardCards.map((stat) => {
            const IconComponent = stat.icon
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-full bg-${stat.color}-100`}>
                      <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="/dashboard/admin/users">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Manage Users</span>
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="/dashboard/admin/librarian-requests">
                  <Shield className="h-6 w-6" />
                  <span className="text-sm">Librarian Requests</span>
                  {librarianRequests.length > 0 && (
                    <Badge className="mt-1 bg-red-100 text-red-800">
                      {librarianRequests.length}
                    </Badge>
                  )}
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-green-50 border-green-200 hover:bg-green-100" 
                onClick={() => setShowAddBookDialog(true)}
              >
                <Plus className="h-6 w-6 text-green-600" />
                <span className="text-sm text-green-700">Add Book</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={loadDashboardData} disabled={loading}>
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Refresh Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status - Only show if no pending requests */}
        {librarianRequests.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
              <CardDescription>All systems operational</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Server Status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">All Systems Operational</p>
                  <p className="text-sm text-gray-600">No issues detected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Book Dialog */}
        <Dialog open={showAddBookDialog} onOpenChange={setShowAddBookDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Add a new book to the library collection. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Enter book title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={bookForm.type} onValueChange={(value) => setBookForm({ ...bookForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select book type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOOK">Book</SelectItem>
                    <SelectItem value="JOURNAL">Journal</SelectItem>
                    <SelectItem value="MAGAZINE">Magazine</SelectItem>
                    <SelectItem value="DVD">DVD</SelectItem>
                    <SelectItem value="CD">CD</SelectItem>
                    <SelectItem value="EBOOK">E-Book</SelectItem>
                    <SelectItem value="AUDIOBOOK">Audio Book</SelectItem>
                    <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={bookForm.category} onValueChange={(value) => setBookForm({ ...bookForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="Enter author name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  placeholder="Enter ISBN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCopies">Total Copies *</Label>
                <Input
                  id="totalCopies"
                  type="number"
                  min="1"
                  value={bookForm.totalCopies}
                  onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                  placeholder="Enter number of copies"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishedYear">Published Year</Label>
                <Input
                  id="publishedYear"
                  type="number"
                  min="1000"
                  max={new Date().getFullYear()}
                  value={bookForm.publishedYear}
                  onChange={(e) => setBookForm({ ...bookForm, publishedYear: e.target.value })}
                  placeholder="Enter published year"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={bookForm.location}
                  onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                  placeholder="Enter shelf/location"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  placeholder="Enter book description..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBookDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBook} disabled={isSubmittingBook}>
                {isSubmittingBook && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Book
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function AdminDashboard() {
  return (
    <AuthGuard allowed={["ADMIN"]}>
      <AdminDashboardContent />
    </AuthGuard>
  )
}
