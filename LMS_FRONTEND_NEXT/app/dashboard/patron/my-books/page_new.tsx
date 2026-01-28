"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { BookOpen, Calendar, Clock, Search, RotateCcw, AlertCircle, Eye, Loader2, RefreshCw } from "lucide-react"
import { getMyLoans, renewLoan } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function MyBooksPage() {
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [renewingIds, setRenewingIds] = useState<Set<string>>(new Set())
  const [returningIds, setReturningIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    loadMyLoans()
  }, [])

  const loadMyLoans = async () => {
    try {
      setLoading(true)
      const response = await getMyLoans()
      const loansData = Array.isArray(response) ? response : (response as any)?.data || []
      setLoans(loansData)
    } catch (error) {
      console.error('Failed to load loans:', error)
      toast({
        title: "Error",
        description: "Failed to load your borrowed books",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const currentLoans = loans.filter(loan => loan.status === 'BORROWED' || loan.status === 'ACTIVE' || !loan.returnDate)
  const borrowingHistory = loans.filter(loan => loan.status === 'RETURNED' || loan.returnDate)

  const filteredCurrentLoans = currentLoans.filter(loan =>
    loan.libraryItem?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.libraryItem?.author?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredHistory = borrowingHistory.filter(loan =>
    loan.libraryItem?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.libraryItem?.metadata?.author?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (loan: any) => {
    if (!loan.dueDate) return <Badge variant="secondary">No Due Date</Badge>
    
    const daysUntilDue = getDaysUntilDue(loan.dueDate)
    
    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue ({Math.abs(daysUntilDue)} days)</Badge>
    } else if (daysUntilDue <= 3) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</Badge>
    } else {
      return <Badge variant="default">{daysUntilDue} days remaining</Badge>
    }
  }

  const handleRenew = async (loanId: string) => {
    try {
      setRenewingIds(prev => new Set(prev).add(loanId))
      await renewLoan(loanId)
      toast({
        title: "Success",
        description: "Book renewed successfully",
      })
      await loadMyLoans()
    } catch (error: any) {
      toast({
        title: "Renewal Failed",
        description: error.message || "Failed to renew the book",
        variant: "destructive",
      })
    } finally {
      setRenewingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(loanId)
        return newSet
      })
    }
  }

  const handleRequestReturn = async (loanId: string) => {
    // According to FEATURES.md, only librarians can process returns
    // Patrons need to visit the library to return books
    toast({
      title: "Visit Library to Return",
      description: "Please visit the library to return your books. Only librarians can process returns.",
      variant: "default",
    })
  }

  const overdueBooksCount = currentLoans.filter(loan => 
    loan.dueDate && getDaysUntilDue(loan.dueDate) < 0
  ).length

  if (loading) {
    return (
      <DashboardLayout userRole="patron">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your books...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="patron">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Borrowed Books</h1>
            <p className="text-gray-600 mt-2">Manage your current loans and view borrowing history</p>
          </div>
          <Button onClick={loadMyLoans} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overdue Alert */}
        {overdueBooksCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    You have {overdueBooksCount} overdue book{overdueBooksCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-700">
                    Please return them as soon as possible to avoid additional fines.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search your books by title or author..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">
              Current Books ({currentLoans.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Borrowing History ({borrowingHistory.length})
            </TabsTrigger>
          </TabsList>

          {/* Current Books Tab */}
          <TabsContent value="current">
            <div className="space-y-4">
              {filteredCurrentLoans.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No books found' : 'No books currently borrowed'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search term' 
                        : "You haven't borrowed any books yet."
                      }
                    </p>
                    {!searchTerm && (
                      <Link href="/dashboard/patron/browse">
                        <Button>Browse Books</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredCurrentLoans.map((loan) => (
                  <Card key={loan.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Book Cover Placeholder */}
                        <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {loan.libraryItem?.title || 'Unknown Title'}
                              </h3>
                              <p className="text-gray-600 mb-2">
                                {loan.libraryItem?.author ? `by ${loan.libraryItem.author}` : 'Unknown Author'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Borrowed: {loan.borrowDate ? new Date(loan.borrowDate).toLocaleDateString() : 'Unknown'}
                                </span>
                                {loan.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Due: {new Date(loan.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(loan)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-4">
                            <Link href={`/dashboard/patron/book/${loan.item?.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRenew(loan.id)}
                              disabled={renewingIds.has(loan.id)}
                            >
                              {renewingIds.has(loan.id) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Renewing...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Renew
                                </>
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestReturn(loan.id)}
                              disabled={returningIds.has(loan.id)}
                            >
                              {returningIds.has(loan.id) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Requesting...
                                </>
                              ) : (
                                'Request Return'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No books found in history' : 'No borrowing history'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'Try adjusting your search term' 
                        : "You haven't returned any books yet."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredHistory.map((loan) => (
                  <Card key={loan.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Book Cover Placeholder */}
                        <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>

                        {/* Book Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {loan.libraryItem?.title || 'Unknown Title'}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {loan.libraryItem?.author ? `by ${loan.libraryItem.author}` : 'Unknown Author'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Borrowed: {loan.borrowDate ? new Date(loan.borrowDate).toLocaleDateString() : 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Returned: {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                          <div className="mt-3">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Returned
                            </Badge>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          <Link href={`/dashboard/patron/book/${loan.item?.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
