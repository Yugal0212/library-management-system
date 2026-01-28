"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import AuthGuard from "@/components/auth/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  BookOpen, Search, Filter, MoreHorizontal, Plus, Edit, 
  Trash2, Eye, Archive, RotateCcw, TrendingUp, Library,
  Calendar, User, CheckCircle, AlertTriangle, Trash, Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getBooks, deleteBook, archiveBook, unarchiveBook, permanentDeleteBook, getBookStats, LibraryItem, createLibraryItem } from "@/lib/api"
import { Label } from "@/components/ui/label"
import { PageLoading } from "@/components/ui/page-loading"

// Use LibraryItem type from API instead of custom Book interface
type Book = LibraryItem

function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [bookDetailsOpen, setBookDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false)
  const [bookStats, setBookStats] = useState<any>(null)
  const [showAddBookDialog, setShowAddBookDialog] = useState(false)
  const [isSubmittingBook, setIsSubmittingBook] = useState(false)
  const [isDeletingBook, setIsDeletingBook] = useState(false)
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false)
  const [archivingBookId, setArchivingBookId] = useState<string | null>(null)
  const { toast } = useToast()

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
    // Check authentication
    const token = localStorage.getItem('accessToken')
    
    loadBooks()
    loadBookStats()
  }, [])

  useEffect(() => {
    filterBooks()
  }, [books, searchTerm, categoryFilter, statusFilter])

  const loadBooks = async () => {
    try {
      setLoading(true)
      const booksData = await getBooks()
      if (Array.isArray(booksData)) {
        setBooks(booksData)
      }
    } catch (error: any) {
      console.error('Failed to load books:', error)
      toast({
        title: "Error",
        description: `Failed to load books: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadBookStats = async () => {
    try {
      const stats = await getBookStats()
      setBookStats(stats)
    } catch (error) {
      console.error('Failed to load book stats:', error)
      // Don't show error toast for stats failure, just continue without stats
      setBookStats(null)
    }
  }

  const filterBooks = () => {
    let filtered = books

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.isbn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(book => book.category === categoryFilter)
    }

    // Status filter
    if (statusFilter === "available") {
      filtered = filtered.filter(book => (book.availableCopies || 0) > 0 && !book.isArchived)
    } else if (statusFilter === "unavailable") {
      filtered = filtered.filter(book => (book.availableCopies || 0) === 0 && !book.isArchived)
    } else if (statusFilter === "archived") {
      filtered = filtered.filter(book => book.isArchived)
    }

    setFilteredBooks(filtered)
  }

  const handleArchiveBook = async (book: Book) => {
    setArchivingBookId(book.id)
    try {
      if (book.isArchived) {
        await unarchiveBook(book.id)
        toast({
          title: "Book Restored",
          description: `"${book.title}" has been restored from archive`
        })
        setBooks(prev => prev.map(b => 
          b.id === book.id ? { ...b, isArchived: false } : b
        ))
      } else {
        await archiveBook(book.id)
        toast({
          title: "Book Archived",
          description: `"${book.title}" has been archived`
        })
        setBooks(prev => prev.map(b => 
          b.id === book.id ? { ...b, isArchived: true } : b
        ))
      }
    } catch (error: any) {
      console.error('Archive operation failed:', error)
      toast({
        title: "Error",
        description: `Failed to ${book.isArchived ? 'restore' : 'archive'} book: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setArchivingBookId(null)
    }
  }

  const handleDeleteBook = async () => {
    if (!selectedBook) return
    
    setIsDeletingBook(true)
    try {
      await deleteBook(selectedBook.id)
      
      toast({
        title: "Book Archived",
        description: `"${selectedBook.title}" has been archived successfully`
      })
      
      // Update the book in state to show as archived
      setBooks(prev => prev.map(b => 
        b.id === selectedBook.id ? { ...b, isArchived: true } : b
      ))
      setDeleteDialogOpen(false)
      setSelectedBook(null)
    } catch (error: any) {
      console.error('Archive via delete dialog failed:', error)
      toast({
        title: "Error",
        description: `Failed to archive book: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setIsDeletingBook(false)
    }
  }

  const handlePermanentDeleteBook = async () => {
    if (!selectedBook) return
    
    setIsPermanentDeleting(true)
    try {
      await permanentDeleteBook(selectedBook.id)
      
      toast({
        title: "Book Deleted",
        description: `"${selectedBook.title}" has been permanently deleted`
      })
      
      // Remove the book from state completely
      setBooks(prev => prev.filter(b => b.id !== selectedBook.id))
      setPermanentDeleteDialogOpen(false)
      setSelectedBook(null)
    } catch (error: any) {
      console.error('Permanent delete failed:', error)
      toast({
        title: "Error",
        description: `Failed to permanently delete book: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setIsPermanentDeleting(false)
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
        description: bookForm.description || undefined,
        isbn: bookForm.isbn || undefined,
        publishedAt: bookForm.publishedYear ? `${bookForm.publishedYear}-01-01` : undefined,
        location: bookForm.location || undefined,
        metadata: {
          author: bookForm.author || 'Unknown',
          totalCopies: parseInt(bookForm.totalCopies) || 1,
          publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : new Date().getFullYear(),
          category: bookForm.category,
          // Always include these to ensure metadata is never empty
          addedBy: 'Admin',
          source: 'Admin Dashboard'
        },
      }

      const result = await createLibraryItem(bookData)
      
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
      
      // Reload books to show the new book
      await loadBooks()

    } catch (error: any) {
      console.error('Error creating book:', error)
      console.error('Error details:', error.message, error.response)
      
      let errorMessage = "Failed to add the book. Please try again."
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast({
        title: "Error Adding Book",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmittingBook(false)
    }
  }

  const getUniqueCategories = (): string[] => {
    const categories = [...new Set(books.map(book => book.category).filter((cat): cat is string => Boolean(cat)))]
    return categories.sort()
  }

  const getStatusBadge = (book: Book) => {
    if (book.isArchived) {
      return <Badge variant="secondary">Archived</Badge>
    }
    if ((book.availableCopies || 0) === 0) {
      return <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
    }
    if ((book.availableCopies || 0) < 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Available</Badge>
  }

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
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoading text="Loading books..." variant="spinner" size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Books Management</h1>
            <p className="text-gray-600 mt-2">Comprehensive library collection oversight and management</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowAddBookDialog(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Book
            </Button>
            <Badge variant="outline" className="text-sm">
              Admin Full Access
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{books.length}</div>
              <p className="text-xs text-gray-500">Unique titles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {books.filter(b => (b.availableCopies || 0) > 0 && !b.isArchived).length}
              </div>
              <p className="text-xs text-gray-500">Ready for loan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {books.filter(b => (b.availableCopies || 0) > 0 && (b.availableCopies || 0) < 3 && !b.isArchived).length}
              </div>
              <p className="text-xs text-gray-500">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <Archive className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {books.filter(b => b.isArchived).length}
              </div>
              <p className="text-xs text-gray-500">Out of circulation</p>
            </CardContent>
          </Card>
        </div>

        {/* Books Management */}
        <Card>
          <CardHeader>
            <CardTitle>Library Collection</CardTitle>
            <CardDescription>Complete overview of all books with administrative controls</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by title, author, ISBN, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getUniqueCategories().map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Books Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Copies</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-gray-500">by {book.author || 'Unknown Author'}</div>
                          <div className="text-xs text-gray-400">ISBN: {book.isbn || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{book.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium text-green-600">{book.availableCopies || 0}</span>
                            <span className="text-gray-500"> / {book.totalCopies}</span>
                          </div>
                          <div className="text-xs text-gray-400">Available / Total</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(book)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedBook(book)
                                setBookDetailsOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!book.isArchived ? (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleArchiveBook(book)}
                                  disabled={archivingBookId === book.id}
                                >
                                  {archivingBookId === book.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Archive className="mr-2 h-4 w-4" />
                                  )}
                                  {archivingBookId === book.id ? "Archiving..." : "Archive"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedBook(book)
                                    setPermanentDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                  disabled={archivingBookId === book.id}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleArchiveBook(book)}
                                disabled={archivingBookId === book.id}
                              >
                                {archivingBookId === book.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                )}
                                {archivingBookId === book.id ? "Restoring..." : "Restore"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No books found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters" 
                    : "No books have been added yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Book Details Dialog */}
        <Dialog open={bookDetailsOpen} onOpenChange={setBookDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedBook?.title}</DialogTitle>
              <DialogDescription>Complete book information and system details</DialogDescription>
            </DialogHeader>
            {selectedBook && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Author</Label>
                    <p className="text-sm text-gray-600">{selectedBook.author || 'Unknown Author'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">ISBN</Label>
                    <p className="text-sm text-gray-600">{selectedBook.isbn || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-gray-600">{selectedBook.category || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Publisher</Label>
                    <p className="text-sm text-gray-600">{selectedBook.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Publication Year</Label>
                    <p className="text-sm text-gray-600">{selectedBook.publishedYear || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedBook)}</div>
                  </div>
                </div>
                
                {selectedBook.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-gray-600 mt-1">{selectedBook.description}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive Book</DialogTitle>
              <DialogDescription>
                Are you sure you want to archive "{selectedBook?.title}"? 
                The book will be hidden from the main library but can be restored later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeletingBook}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteBook} loading={isDeletingBook} loadingText="Archiving...">
                Archive Book
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permanent Delete Confirmation Dialog */}
        <Dialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Permanently Delete Book</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">⚠️ This action cannot be undone!</p>
                  <p>
                    Are you sure you want to permanently delete "{selectedBook?.title}"? 
                    This will completely remove the book and all associated data from the system.
                  </p>
                  <p className="text-sm text-gray-600">
                    Consider archiving instead if you might need to restore this book later.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermanentDeleteDialogOpen(false)} disabled={isPermanentDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handlePermanentDeleteBook} loading={isPermanentDeleting} loadingText="Deleting...">
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Book Dialog */}
        <Dialog open={showAddBookDialog} onOpenChange={setShowAddBookDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Add a new book to the library collection. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
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
                    <SelectItem value="EBOOK">E-Book</SelectItem>
                    <SelectItem value="AUDIOBOOK">Audio Book</SelectItem>
                    <SelectItem value="DVD">DVD</SelectItem>
                    <SelectItem value="BLURAY">Blu-ray</SelectItem>
                    <SelectItem value="CD">CD</SelectItem>
                    <SelectItem value="MAGAZINE">Magazine</SelectItem>
                    <SelectItem value="NEWSPAPER">Newspaper</SelectItem>
                    <SelectItem value="JOURNAL">Journal</SelectItem>
                    <SelectItem value="THESIS">Thesis</SelectItem>
                    <SelectItem value="REFERENCE">Reference</SelectItem>
                    <SelectItem value="MAP">Map</SelectItem>
                    <SelectItem value="GAME">Game</SelectItem>
                    <SelectItem value="SOFTWARE">Software</SelectItem>
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
              <Button onClick={handleCreateBook} loading={isSubmittingBook} loadingText="Adding Book...">
                Add Book
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function AdminBooksPageWithAuth() {
  return (
    <AuthGuard allowed={["ADMIN"]}>
      <AdminBooksPage />
    </AuthGuard>
  )
}
