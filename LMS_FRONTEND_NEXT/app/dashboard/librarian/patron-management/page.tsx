"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, CreditCard, Search, Edit, Eye, Users, BookOpen, AlertTriangle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import DashboardLayout from "@/app/components/dashboard-layout"
import { getUsers, register, updateUser, createPatron } from "@/lib/api"

interface Patron {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  isVerified: boolean
  libraryCardNumber?: string
  phone?: string
  address?: string
  registrationDate: string
  currentLoans: number
  totalFines: number
  metadata?: Record<string, any>
}

export default function PatronManagementPage() {
  const [patrons, setPatrons] = useState<Patron[]>([])
  const [filteredPatrons, setFilteredPatrons] = useState<Patron[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isIssueCardDialogOpen, setIsIssueCardDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<{
    name: string
    email: string
    phone: string
    address: string
    role: "STUDENT" | "TEACHER"
  }>({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "STUDENT"
  })

  useEffect(() => {
    fetchPatrons()
  }, [])

  useEffect(() => {
    filterPatrons()
  }, [patrons, searchQuery, statusFilter])

  const fetchPatrons = async () => {
    try {
      const data = await getUsers()
      // Filter for students and teachers only
      const patronData = data.filter(user => user.role === 'STUDENT' || user.role === 'TEACHER')
      setPatrons(patronData.map(user => ({
        ...user,
        role: user.role as "STUDENT" | "TEACHER",
        isActive: user.isActive ?? true,
        isVerified: user.isVerified ?? false,
        registrationDate: user.createdAt || new Date().toISOString(),
        currentLoans: 0, // This would come from loans API
        totalFines: 0, // This would come from fines API
        libraryCardNumber: user.metadata?.libraryCardNumber || undefined
      })))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patrons",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPatrons = () => {
    let filtered = patrons

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(patron =>
        patron.name.toLowerCase().includes(query) ||
        patron.email.toLowerCase().includes(query) ||
        patron.libraryCardNumber?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(patron => {
        switch (statusFilter) {
          case "active": return patron.isActive
          case "inactive": return !patron.isActive
          case "verified": return patron.isVerified
          case "unverified": return !patron.isVerified
          case "with-card": return !!patron.libraryCardNumber
          case "without-card": return !patron.libraryCardNumber
          default: return true
        }
      })
    }

    setFilteredPatrons(filtered)
  }

  const handleAddPatron = async () => {
    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        toast({
          title: "Validation Error",
          description: "Name and email are required",
          variant: "destructive"
        })
        return
      }

      const patronData = {
        name: formData.name,
        email: formData.email,
        password: generateTemporaryPassword(),
        role: formData.role as "STUDENT" | "TEACHER",
        phone: formData.phone,
        address: formData.address
      }
      
      await createPatron(patronData)
      
      toast({
        title: "Success",
        description: "Patron created successfully"
      })
      setIsAddDialogOpen(false)
      resetForm()
      fetchPatrons()
    } catch (error: any) {
      console.error('Patron creation error:', error)
      toast({
        title: "Error",
        description: `Failed to create patron: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const handleIssueLibraryCard = async () => {
    if (!selectedPatron) return

    const cardNumber = generateLibraryCardNumber()
    
    try {
      await updateUser(selectedPatron.id, { 
        metadata: { 
          ...selectedPatron.metadata, 
          libraryCardNumber: cardNumber 
        } 
      })
      toast({
        title: "Success",
        description: `Library card ${cardNumber} issued successfully`
      })
      setIsIssueCardDialogOpen(false)
      fetchPatrons()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to issue library card",
        variant: "destructive"
      })
    }
  }

  const generateLibraryCardNumber = () => {
    const prefix = "LIB"
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${year}${random}`
  }

  const generateTemporaryPassword = () => {
    return Math.random().toString(36).slice(-8)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      role: "STUDENT"
    })
  }

  const getStatusBadge = (patron: Patron) => {
    if (!patron.isActive) return <Badge variant="destructive">Inactive</Badge>
    if (!patron.isVerified) return <Badge variant="secondary">Unverified</Badge>
    if (!patron.libraryCardNumber) return <Badge variant="outline">No Card</Badge>
    return <Badge>Active</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout userRole="librarian" userName="Sarah Librarian">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading patrons...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="librarian" userName="Sarah Librarian">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Patron Management
            </h1>
            <p className="text-muted-foreground">Register and manage library patrons</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Register New Patron
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Patrons</p>
                  <p className="text-2xl font-bold">{patrons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">With Library Cards</p>
                  <p className="text-2xl font-bold">
                    {patrons.filter(p => p.libraryCardNumber).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Borrowers</p>
                  <p className="text-2xl font-bold">
                    {patrons.filter(p => p.currentLoans > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">With Fines</p>
                  <p className="text-2xl font-bold">
                    {patrons.filter(p => p.totalFines > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or card number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patrons</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="with-card">With Library Card</SelectItem>
                  <SelectItem value="without-card">Without Library Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Patrons List */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Patrons ({filteredPatrons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPatrons.map((patron) => (
                <div key={patron.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold">{patron.name}</h3>
                      <p className="text-sm text-muted-foreground">{patron.email}</p>
                      {patron.libraryCardNumber && (
                        <p className="text-sm font-mono text-blue-600">
                          Card: {patron.libraryCardNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(patron)}
                      <Badge variant="outline">{patron.role}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatron(patron)
                        setIsViewDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatron(patron)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {!patron.libraryCardNumber && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPatron(patron)
                          setIsIssueCardDialogOpen(true)
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Issue Card
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredPatrons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No patrons found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Patron Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Register New Patron</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "STUDENT" | "TEACHER") => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPatron}>
                Register Patron
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Issue Library Card Dialog */}
        <Dialog open={isIssueCardDialogOpen} onOpenChange={setIsIssueCardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Library Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Issue a library card for:</p>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">{selectedPatron?.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedPatron?.email}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                A unique library card number will be generated and assigned to this patron.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIssueCardDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleIssueLibraryCard}>
                <CreditCard className="h-4 w-4 mr-2" />
                Issue Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
