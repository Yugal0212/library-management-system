"use client"

import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserPlus, RotateCcw, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useMemo, useEffect } from "react"
import { useLibraryItems } from "@/hooks/use-library-items"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createLibraryItem, updateLibraryItem, unarchiveLibraryItem, archiveBook, createLoanForUser, returnBook, getUsers, type LibraryItemType, type User } from "@/lib/api"

export default function LibrarianBooksPage() {
  const [search, setSearch] = useState("")
  const { items, isLoading, refresh } = useLibraryItems({ search })
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    title: "", 
    type: "BOOK" as LibraryItemType, 
    author: "", 
    isbn: "", 
    description: "", 
    totalCopies: 1,
    publishedYear: new Date().getFullYear(),
    location: ""
  })
  
  // Loading states for buttons
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  
  // Loan management state
  const [loanDialogOpen, setLoanDialogOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      refresh()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [refresh])

  // Helper function to set loading state for specific actions
  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }))
  }

  // Load users for loan creation
  useEffect(() => {
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
    loadUsers()
  }, [])

  const getStatusBadge = (item: any) => {
    const hasActiveLoan = Array.isArray(item.loans) && item.loans.length > 0
    const status = item.status || (hasActiveLoan ? "BORROWED" : "AVAILABLE")
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800"
      case "BORROWED":
        return "bg-yellow-100 text-yellow-800"
      case "LOST":
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800"
      case "MAINTENANCE":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const stats = useMemo(() => {
    const total = items.length
    const available = items.filter((item) => {
      const hasActiveLoan = Array.isArray(item.loans) && item.loans.length > 0
      return !hasActiveLoan && !item.isArchived
    }).length
    const borrowed = items.filter((item) => Array.isArray(item.loans) && item.loans.length > 0).length
    const archived = items.filter((item) => item.isArchived).length
    return { total, available, borrowed, archived }
  }, [items])

  const resetForm = () => {
    setForm({ 
      title: "", 
      type: "BOOK" as LibraryItemType, 
      author: "", 
      isbn: "", 
      description: "", 
      totalCopies: 1,
      publishedYear: new Date().getFullYear(),
      location: ""
    })
    setEditingId(null)
  }

  const openEditDialog = (item: any) => {
    const metadata = item.metadata || {};
    const publishedYear = item.publishedAt ? new Date(item.publishedAt).getFullYear() : new Date().getFullYear();
    
    setForm({
      title: item.title || "",
      type: item.type || "BOOK",
      author: metadata.author || "",
      isbn: item.isbn || "",
      description: item.description || "",
      totalCopies: metadata.totalCopies || 1,
      publishedYear: publishedYear,
      location: item.location || "",
    })
    setEditingId(item.id)
    setOpen(true)
  }

  const onSubmit = async () => {
    if (submitting) return
    
    setSubmitting(true)
    try {
      if (editingId) {
        await updateLibraryItem(editingId, {
          title: form.title,
          description: form.description,
          isbn: form.isbn,
          publishedAt: form.publishedYear ? `${form.publishedYear}-01-01` : undefined,
          location: form.location,
          metadata: {
            author: form.author,
            totalCopies: form.totalCopies,
            publishedYear: form.publishedYear,
          },
        });
        toast({ title: "Item updated successfully" });
      } else {
        await createLibraryItem({ 
          title: form.title, 
          type: form.type, 
          description: form.description,
          isbn: form.isbn,
          publishedAt: form.publishedYear ? `${form.publishedYear}-01-01` : undefined,
          location: form.location,
          metadata: {
            author: form.author,
            totalCopies: form.totalCopies,
            publishedYear: form.publishedYear,
          },
        });
        toast({ title: "Item created successfully" });
      }
      setOpen(false);
      resetForm();
      await refresh(); // Auto-refresh after success
    } catch (e: any) {
      console.error('Save error:', e);
      toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSubmitting(false)
    }
  };

  const handleArchive = async (id: string) => {
    const key = `archive-${id}`
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      await archiveBook(id)
      toast({ title: "Item archived successfully" })
      await refresh() // Auto-refresh after success
    } catch (e: any) {
      toast({ title: "Archive failed", description: String(e?.message || e), variant: "destructive" })
    } finally {
      setLoading(key, false)
    }
  }

  const handleUnarchive = async (id: string) => {
    const key = `unarchive-${id}`
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      await unarchiveLibraryItem(id)
      toast({ title: "Item unarchived successfully" })
      await refresh() // Auto-refresh after success
    } catch (e: any) {
      toast({ title: "Unarchive failed", description: String(e?.message || e), variant: "destructive" })
    } finally {
      setLoading(key, false)
    }
  }

  const handleCreateLoan = (itemId: string) => {
    setSelectedItemId(itemId)
    setSelectedUserId("")
    setLoanDialogOpen(true)
  }

  const handleConfirmLoan = async () => {
    if (!selectedItemId || !selectedUserId) {
      toast({ title: "Error", description: "Please select a user", variant: "destructive" })
      return
    }

    const key = "create-loan"
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      await createLoanForUser({ userId: selectedUserId, libraryItemId: selectedItemId })
      toast({ title: "Loan created successfully" })
      setLoanDialogOpen(false)
      setSelectedItemId(null)
      setSelectedUserId("")
      await refresh() // Auto-refresh after success
    } catch (e: any) {
      toast({ title: "Loan creation failed", description: String(e?.message || e), variant: "destructive" })
    } finally {
      setLoading(key, false)
    }
  }

  const handleReturnBook = async (item: any) => {
    if (!item.loans || item.loans.length === 0) {
      toast({ title: "Error", description: "No active loan found", variant: "destructive" })
      return
    }

    const activeLoan = item.loans.find((loan: any) => loan.status === 'ACTIVE' || !loan.returnDate)
    if (!activeLoan) {
      toast({ title: "Error", description: "No active loan found", variant: "destructive" })
      return
    }

    const key = `return-${item.id}`
    if (loadingStates[key]) return
    
    setLoading(key, true)
    try {
      await returnBook(activeLoan.id)
      toast({ title: "Book returned successfully" })
      await refresh() // Auto-refresh after success
    } catch (e: any) {
      toast({ title: "Return failed", description: String(e?.message || e), variant: "destructive" })
    } finally {
      setLoading(key, false)
    }
  }

  return (
    <DashboardLayout userRole="librarian">
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Library Collection</h1>
            <p className="text-muted-foreground">Manage books, DVDs, magazines, and equipment</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              onClick={() => {
                resetForm()
                setOpen(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Item" : "Add New Item"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    title="Select item type"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LibraryItemType }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="BOOK">Book</option>
                    <option value="DVD">DVD</option>
                    <option value="MAGAZINE">Magazine</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="EBOOK">E-Book</option>
                    <option value="AUDIOBOOK">Audio Book</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="Enter item description..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="author">Author/Creator</Label>
                  <Input id="author" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="isbn">ISBN/ID</Label>
                  <Input id="isbn" value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalCopies">Total Copies *</Label>
                    <Input 
                      id="totalCopies" 
                      type="number" 
                      min="1"
                      value={form.totalCopies} 
                      onChange={(e) => setForm((f) => ({ ...f, totalCopies: parseInt(e.target.value) || 1 }))} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="publishedYear">Published Year</Label>
                    <Input 
                      id="publishedYear" 
                      type="number" 
                      value={form.publishedYear} 
                      onChange={(e) => setForm((f) => ({ ...f, publishedYear: parseInt(e.target.value) || new Date().getFullYear() }))} 
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={form.location} 
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g., Section A, Shelf 1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={onSubmit} 
                  disabled={!form.title || form.totalCopies < 1 || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingId ? "Update" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All library items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <p className="text-xs text-muted-foreground">Ready to borrow</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
              <BookOpen className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.borrowed}</div>
              <p className="text-xs text-muted-foreground">Currently on loan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
              <p className="text-xs text-muted-foreground">Removed from circulation</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find specific items in your collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, author, ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Library Items</CardTitle>
            <CardDescription>Manage your collection of books, DVDs, magazines, and equipment</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new item to the collection.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Type: {item.type}</span>
                            {item.author && <span>• Author: {item.author}</span>}
                            {item.isbn && <span>• ISBN: {item.isbn}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusBadge(item)}>
                        {(() => {
                          const hasActiveLoan = Array.isArray(item.loans) && item.loans.length > 0
                          const status = item.status || (hasActiveLoan ? "BORROWED" : "AVAILABLE")
                          return status
                        })()}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {(() => {
                            const hasActiveLoan = Array.isArray(item.loans) && item.loans.some((loan: any) => loan.status === 'ACTIVE' || !loan.returnDate)
                            const status = item.status || (hasActiveLoan ? "BORROWED" : "AVAILABLE")
                            
                            if (status === "AVAILABLE" && !item.isArchived) {
                              return (
                                <DropdownMenuItem 
                                  onClick={() => handleCreateLoan(item.id)}
                                  disabled={loadingStates[`create-loan-${item.id}`]}
                                >
                                  {loadingStates[`create-loan-${item.id}`] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                  )}
                                  Create Loan
                                </DropdownMenuItem>
                              )
                            } else if (hasActiveLoan) {
                              return (
                                <DropdownMenuItem 
                                  onClick={() => handleReturnBook(item)}
                                  disabled={loadingStates[`return-${item.id}`]}
                                >
                                  {loadingStates[`return-${item.id}`] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                  )}
                                  Return Book
                                </DropdownMenuItem>
                              )
                            }
                            return null
                          })()}
                          {item.isArchived ? (
                            <DropdownMenuItem
                              onClick={() => handleUnarchive(item.id)}
                              disabled={loadingStates[`unarchive-${item.id}`]}
                              className="text-green-600"
                            >
                              {loadingStates[`unarchive-${item.id}`] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                              )}
                              Unarchive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleArchive(item.id)}
                              disabled={loadingStates[`archive-${item.id}`]}
                              className="text-red-600"
                            >
                              {loadingStates[`archive-${item.id}`] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Creation Dialog */}
        <Dialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Loan</DialogTitle>
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
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setLoanDialogOpen(false)}
                disabled={loadingStates["create-loan"]}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmLoan} 
                disabled={!selectedUserId || loadingStates["create-loan"]}
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
