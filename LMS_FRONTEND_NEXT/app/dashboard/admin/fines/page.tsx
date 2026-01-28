"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
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
  DollarSign, Search, Filter, MoreHorizontal, Trash2, 
  CheckCircle, AlertTriangle, Clock, Calendar, User,
  TrendingUp, AlertCircle, CreditCard, Mail
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllFines, deleteFine, sendFineReminder, getUserStats, Fine } from "@/lib/api"

export default function AdminFinesPage() {
  const [fines, setFines] = useState<Fine[]>([])
  const [filteredFines, setFilteredFines] = useState<Fine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sendingEmail, setSendingEmail] = useState<Set<string>>(new Set())
  const [fineStats, setFineStats] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFines()
    loadFineStats()
  }, [])

  useEffect(() => {
    filterFines()
  }, [fines, searchTerm, statusFilter])

  const loadFines = async () => {
    try {
      setLoading(true)
      const finesData = await getAllFines()
      if (Array.isArray(finesData)) {
        // Ensure each fine has a valid amount number
        const validatedFines = finesData.map(fine => ({
          ...fine,
          amount: Number(fine.amount) || 0
        }))
        setFines(validatedFines)
      }
    } catch (error) {
      console.error('Failed to load fines:', error)
      toast({
        title: "Error",
        description: "Failed to load fines",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFineStats = async () => {
    try {
      const stats = await getUserStats()
      setFineStats(stats)
    } catch (error) {
      console.error('Failed to load fine stats:', error)
    }
  }

  const filterFines = () => {
    let filtered = fines

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(fine => 
        (fine.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fine.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fine.loan?.item?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fine.loan?.item?.isbn || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(fine => fine.status === statusFilter)
    }

    setFilteredFines(filtered)
  }

  const handleDeleteFine = async () => {
    if (!selectedFine) return
    
    try {
      setDeleting(true)
      await deleteFine(selectedFine.id)
      
      toast({
        title: "Fine Deleted",
        description: "Fine has been successfully deleted"
      })
      
      setFines(prev => prev.filter(f => f.id !== selectedFine.id))
      setDeleteDialogOpen(false)
      setSelectedFine(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete fine",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSendReminder = async (fine: Fine) => {
    if (sendingEmail.has(fine.id)) return
    
    setSendingEmail(prev => new Set(prev).add(fine.id))
    try {
      await sendFineReminder(fine.id)
      toast({
        title: "Reminder Sent",
        description: `Payment reminder sent to ${fine.user?.name || 'User'}`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive"
      })
    } finally {
      setSendingEmail(prev => {
        const newSet = new Set(prev)
        newSet.delete(fine.id)
        return newSet
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="h-3 w-3" />
      case 'PENDING': return <Clock className="h-3 w-3" />
      case 'OVERDUE': return <AlertTriangle className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  const calculateTotalAmount = (status?: string) => {
    if (!fines || fines.length === 0) return 0
    
    const relevantFines = status && status !== "all" 
      ? fines.filter(f => f.status === status)
      : fines
      
    return relevantFines.reduce((sum, fine) => {
      const amount = Number(fine.amount) || 0
      return sum + amount
    }, 0)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fines Management</h1>
            <p className="text-gray-600 mt-2">Monitor and manage library fines across the system</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Admin Access Only
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${(calculateTotalAmount() || 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">{fines?.length || 0} total fines</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${(calculateTotalAmount('PENDING') || 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">
                {fines.filter(f => f.status === 'PENDING').length} pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${(calculateTotalAmount('OVERDUE') || 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">
                {fines.filter(f => f.status === 'PENDING').length} overdue fines
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(calculateTotalAmount('PAID') || 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">
                {fines.filter(f => f.status === 'PAID').length} paid fines
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fines Management */}
        <Card>
          <CardHeader>
            <CardTitle>All Fines</CardTitle>
            <CardDescription>Comprehensive view of all library fines with admin controls</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by user name, email, or book title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="WAIVED">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fines Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {fine.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">{fine.user?.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{fine.loan?.item?.title || 'Unknown Book'}</div>
                          <div className="text-sm text-gray-500">ISBN: {fine.loan?.item?.isbn || 'N/A'}</div>
                          {fine.loan?.item?.metadata?.author && (
                            <div className="text-xs text-gray-400">by {fine.loan.item.metadata.author}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-emerald-600">
                          ${fine.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadgeColor(fine.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(fine.status)}
                          {fine.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {fine.loan?.dueDate ? (
                            <span>Due: {new Date(fine.loan.dueDate).toLocaleDateString()}</span>
                          ) : fine.dueDate ? (
                            <span>Due: {new Date(fine.dueDate).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-gray-500">No due date</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(fine.createdAt).toLocaleDateString()}
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
                              onClick={() => handleSendReminder(fine)}
                              disabled={sendingEmail.has(fine.id) || fine.status === 'PAID'}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              {sendingEmail.has(fine.id) ? "Sending..." : "Send Reminder"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFine(fine)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Fine
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredFines.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No fines found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "No fines have been issued yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Fine</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this fine for {selectedFine?.user?.name || 'Unknown User'}?
                This action cannot be undone and will permanently remove the fine record.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteFine} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Fine"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
