"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  Calendar, 
  User, 
  Building, 
  Tag, 
  Clock, 
  CheckCircle, 
  Heart, 
  Share2,
  ArrowLeft,
  Loader2,
  BookmarkPlus,
  MapPin,
  AlertCircle
} from "lucide-react"
import { getLibraryItem, borrowItem, reserveItem } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function BookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [borrowing, setBorrowing] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [actionType, setActionType] = useState<'borrow' | 'reserve' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (bookId) {
      loadBookDetails()
    }
  }, [bookId])

  const loadBookDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const bookData = await getLibraryItem(bookId)
      setBook(bookData)
    } catch (error) {
      console.error('Failed to load book details:', error)
      setError('Failed to load book details')
      toast({
        title: "Error",
        description: "Failed to load book details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBorrow = async () => {
    if (!book || borrowing) return

    try {
      setBorrowing(true)
      setActionType('borrow')
      await borrowItem({ libraryItemId: book.id })
      
      // Show success animation
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 2000)
      
      toast({
        title: "Success! 🎉",
        description: `You have successfully borrowed "${book.title}"`,
      })
      
      // Refresh book details to update availability
      await loadBookDetails()
    } catch (error: any) {
      console.error('Failed to borrow book:', error)
      toast({
        title: "Borrowing Failed",
        description: error.message || "Failed to borrow the book",
        variant: "destructive",
      })
    } finally {
      setBorrowing(false)
      setActionType(null)
    }
  }

  const handleReserve = async () => {
    if (!book || reserving) return

    try {
      setReserving(true)
      setActionType('reserve')
      await reserveItem(book.id)
      
      // Show success animation
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 2000)
      
      toast({
        title: "Reserved Successfully! 📚",
        description: `"${book.title}" has been reserved for you. We'll notify you when it's available.`,
      })
      
      // Refresh book details
      await loadBookDetails()
    } catch (error: any) {
      console.error('Failed to reserve book:', error)
      toast({
        title: "Reservation Failed",
        description: error.message || "Failed to reserve the book",
        variant: "destructive",
      })
    } finally {
      setReserving(false)
      setActionType(null)
    }
  }

  const isAvailable = book && book.status !== 'BORROWED' && (book.loans?.length === 0 || !book.loans?.some((loan: any) => loan.status === 'BORROWED'))

  if (loading) {
    return (
      <DashboardLayout userRole="patron">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading book details...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !book) {
    return (
      <DashboardLayout userRole="patron">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Book Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The book you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.push('/dashboard/patron/browse')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="patron">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Details</h1>
            <p className="text-gray-600">View book information and availability</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Book Cover and Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* Book Cover */}
                <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-gray-400" />
                </div>

                {/* Availability Status */}
                <div className="mb-6">
                  <Badge
                    variant={isAvailable ? "default" : "secondary"}
                    className={`w-full justify-center py-2 ${
                      isAvailable 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Available
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Currently Borrowed
                      </>
                    )}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 relative">
                  {/* Success Animation Overlay */}
                  {showSuccessAnimation && (
                    <div className="absolute inset-0 bg-green-50 rounded-lg border-2 border-green-200 flex items-center justify-center z-10 animate-pulse">
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2 animate-bounce" />
                        <p className="text-green-800 font-medium">
                          {actionType === 'borrow' ? 'Book Borrowed!' : 'Book Reserved!'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isAvailable ? (
                    <Button 
                      className="w-full" 
                      onClick={handleBorrow}
                      disabled={borrowing || showSuccessAnimation}
                      loading={borrowing}
                      loadingText="Borrowing..."
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Borrow Book
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleReserve}
                      disabled={reserving || showSuccessAnimation}
                      loading={reserving}
                      loadingText="Reserving..."
                    >
                      <BookmarkPlus className="h-4 w-4 mr-2" />
                      Reserve Book
                    </Button>
                  )}

                  <Button variant="outline" className="w-full group hover:bg-red-50 hover:border-red-200 transition-all duration-300">
                    <Heart className="h-4 w-4 mr-2 group-hover:text-red-500 transition-colors" />
                    <span className="group-hover:text-red-700">Add to Favorites</span>
                  </Button>

                  <Button variant="outline" className="w-full group hover:bg-blue-50 hover:border-blue-200 transition-all duration-300">
                    <Share2 className="h-4 w-4 mr-2 group-hover:text-blue-500 transition-colors" />
                    <span className="group-hover:text-blue-700">Share Book</span>
                  </Button>
                </div>

                {/* Location Information */}
                <Separator className="my-6" />
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Location</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{book.metadata?.location || 'Main Library'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>Shelf: {book.metadata?.shelf || 'A-1-001'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{book.title}</CardTitle>
                <CardDescription className="text-lg">
                  {book.author && (
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      by {book.author}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Book Categories/Tags */}
                {book.categories && book.categories.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((cat: any, index: number) => (
                        <Badge key={index} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {cat.category?.name || cat.name || 'General'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Book Information</h3>
                    <div className="space-y-3">
                      {book.metadata?.isbn && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">ISBN:</span>
                          <span className="font-medium">{book.metadata.isbn}</span>
                        </div>
                      )}
                      {book.metadata?.publisher && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Publisher:</span>
                          <span className="font-medium">{book.metadata.publisher}</span>
                        </div>
                      )}
                      {book.metadata?.publishedDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Published:</span>
                          <span className="font-medium">{book.metadata.publishedDate}</span>
                        </div>
                      )}
                      {book.metadata?.edition && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Edition:</span>
                          <span className="font-medium">{book.metadata.edition}</span>
                        </div>
                      )}
                      {book.metadata?.language && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Language:</span>
                          <span className="font-medium">{book.metadata.language}</span>
                        </div>
                      )}
                      {book.metadata?.pages && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pages:</span>
                          <span className="font-medium">{book.metadata.pages}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Availability</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{isAvailable ? 'Available' : 'Borrowed'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{book.type || 'Book'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Added:</span>
                        <span className="font-medium">{new Date(book.createdAt).toLocaleDateString()}</span>
                      </div>
                      {book.loans && book.loans.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Times Borrowed:</span>
                          <span className="font-medium">{book.loans.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {book.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{book.description}</p>
                  </div>
                )}

                {/* Additional Metadata */}
                {book.metadata && Object.keys(book.metadata).length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {book.metadata.subjects && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subjects:</span>
                          <span className="font-medium">{book.metadata.subjects}</span>
                        </div>
                      )}
                      {book.metadata.deweyDecimal && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dewey Decimal:</span>
                          <span className="font-medium">{book.metadata.deweyDecimal}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Borrowing History and Related Info */}
        {book.loans && book.loans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Borrowing History</CardTitle>
              <CardDescription>Recent loans for this book</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {book.loans.slice(0, 5).map((loan: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{loan.user?.name || 'User'}</p>
                      <p className="text-sm text-gray-600">
                        Borrowed: {new Date(loan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={loan.status === 'RETURNED' ? 'default' : 'secondary'}>
                      {loan.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
