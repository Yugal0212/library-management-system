"use client"

import AuthGuard from "@/components/auth/auth-guard"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, UserPlus, Search, Filter, MoreHorizontal, Shield, BookOpen, 
  User, TrendingUp, AlertTriangle, Calendar, Eye, History, DollarSign, 
  Settings, UserCheck, UserX, Mail, Phone, Activity, Edit, Trash2
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useUsers } from "@/hooks/use-users"
import { useMemo, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { createUser, updateUser, deleteUser, getUsers, getUserStats, getDashboardStats, bulkUserAction, getUserAnalytics } from "@/lib/api"
import { apiFetch } from "@/lib/http"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminUsersPage() {
  const { users, isLoading, refresh } = useUsers()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT", isActive: true })
  const [statistics, setStatistics] = useState<any>(null)
  const [userDetails, setUserDetails] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkActionOpen, setBulkActionOpen] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [pendingBulkAction, setPendingBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [filters, setFilters] = useState({
    role: "all",
    isActive: "all",
    sortBy: "createdAt",
    sortOrder: "desc"
  })
  const { toast } = useToast()

  // Fetch user statistics
  useEffect(() => {
    fetchStatistics()
    if (showAnalytics) {
      fetchAnalytics()
    }
  }, [showAnalytics])

  const fetchStatistics = async () => {
    try {
      const stats = await getDashboardStats()
      setStatistics(stats)
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const analytics = await getUserAnalytics()
      setAnalyticsData(analytics)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      const borrowingHistory = await apiFetch(`/user/${userId}/borrowing-history`, { method: 'GET' })
      const currentLoans = await apiFetch(`/user/${userId}/current-loans`, { method: 'GET' })
      const fines = await apiFetch(`/user/${userId}/fines`, { method: 'GET' })
      
      setUserDetails({ borrowingHistory, currentLoans, fines })
    } catch (error) {
      console.error('Failed to fetch user details:', error)
      toast({ title: "Failed to load user details", variant: "destructive" })
    }
  }

  const assignRole = async (userId: string, newRole: string) => {
    try {
      await updateUser(userId, { role: newRole as any })
      toast({ title: "Role updated successfully" })
      refresh()
    } catch (error) {
      toast({ title: "Failed to update role", variant: "destructive" })
    }
  }

  const toggleUserStatus = async (userId: string, activate: boolean) => {
    try {
      await updateUser(userId, { isActive: activate })
      toast({ title: `User ${activate ? 'activated' : 'deactivated'} successfully` })
      refresh()
    } catch (error) {
      toast({ title: `Failed to ${activate ? 'activate' : 'deactivate'} user`, variant: "destructive" })
    }
  }

  // Bulk actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    try {
      const result = await bulkUserAction(selectedUsers, action)
      toast({ title: result.message })
      setSelectedUsers([])
      setBulkActionOpen(false)
      refresh()
    } catch (error: any) {
      toast({ title: `Bulk ${action} failed`, description: error?.message, variant: "destructive" })
    }
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === filtered.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filtered.map(user => user.id))
    }
  }

  const exportUsers = async () => {
    try {
      const csvContent = [
        'Name,Email,Role,Status,Join Date',
        ...filtered.map(user => 
          `${user.name},${user.email},${user.role},${user.isActive ? 'Active' : 'Inactive'},${new Date(user.createdAt).toLocaleDateString()}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'users-export.csv'
      a.click()
      toast({ title: "Users exported successfully" })
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" })
    }
  }

  const filtered = useMemo(() => {
    if (!users || !Array.isArray(users)) return []
    
    let result = users.filter((u: any) => {
      // Text search
      if (query) {
        const q = query.toLowerCase()
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
          return false
        }
      }
      
      // Role filter
      if (filters.role && filters.role !== "all" && u.role !== filters.role) {
        return false
      }
      
      // Status filter
      if (filters.isActive && filters.isActive !== "all" && u.isActive !== (filters.isActive === "true")) {
        return false
      }
      
      return true
    })
    
    // Sort results
    result.sort((a: any, b: any) => {
      const field = filters.sortBy
      let aVal = a[field]
      let bVal = b[field]
      
      if (field === 'createdAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }
      
      if (filters.sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1
      } else {
        return aVal > bVal ? 1 : -1
      }
    })
    
    return result
  }, [users, query, filters])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return Shield
      case "LIBRARIAN":
        return BookOpen
      default:
        return User
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "LIBRARIAN":
        return "bg-green-100 text-green-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getStatusColor = (active: boolean) => (active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")

  const onAdd = () => {
    setEditingId(null)
    setForm({ name: "", email: "", password: "", role: "STUDENT", isActive: true })
    setOpen(true)
  }

  const onViewDetails = async (user: any) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
    await fetchUserDetails(user.id)
  }

  const onEdit = (u: any) => {
    setEditingId(u.id)
    setForm({ name: u.name, email: u.email, password: "", role: u.role, isActive: u.isActive })
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await deleteUser(id)
      toast({ title: "User deleted" })
      refresh()
    } catch (e: any) {
      toast({ title: "Failed to delete", description: String(e?.message || e), variant: "destructive" })
    }
  }

  const onSubmit = async () => {
    try {
      if (editingId) {
        await updateUser(editingId, {
          name: form.name,
          email: form.email,
          role: form.role as any,
        })
        toast({ title: "User updated" })
      } else {
        await createUser({ name: form.name, email: form.email, password: form.password, role: form.role as any })
        toast({ title: "User created" })
      }
      setOpen(false)
      refresh()
    } catch (e: any) {
      toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" })
    }
  }

  return (
    <AuthGuard allowed={["ADMIN"]}>
      <DashboardLayout userRole="admin" userName="Admin User">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Manage system users and their permissions</p>
          </motion.div>
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              variant="outline" 
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="hidden sm:flex"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              variant="outline" 
              onClick={exportUsers}
              className="hidden sm:flex"
            >
              <Activity className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={onAdd}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    User Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Role Distribution</p>
                      <div className="space-y-2">
                        {['ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT'].map(role => {
                          const count = analyticsData?.distribution?.byRole?.[role] || 0
                          const total = Object.values(analyticsData?.distribution?.byRole || {}).reduce((sum: number, val: any) => sum + val, 0)
                          const percentage = total > 0 ? (count / total) * 100 : 0
                          return (
                            <div key={role} className="flex items-center justify-between">
                              <span className="text-sm">{role}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={percentage} className="w-20 h-2" />
                                <span className="text-xs text-gray-500">{count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Activity Status</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Active Users', value: analyticsData?.overview?.activeUsers || 0, color: 'bg-green-500' },
                          { label: 'Inactive Users', value: analyticsData?.overview?.inactiveUsers || 0, color: 'bg-red-500' }
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-sm">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${item.color}`} />
                              <span className="text-sm font-medium">{item.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Recent Trends</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">This Month</span>
                          <span className="text-sm font-medium text-green-600">+{analyticsData?.overview?.monthlyGrowth || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Growth Rate</span>
                          <span className="text-sm font-medium text-blue-600">{analyticsData?.overview?.growthRate || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? "—" : statistics?.totalUsers || filtered.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading ? "—" : statistics?.activeUsers || 0}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading ? "—" : statistics?.newUsersThisMonth || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Items</p>
                  <p className="text-3xl font-bold text-red-600">
                    {isLoading ? "—" : statistics?.overdueCount || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage and monitor all system users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              <Select value={filters.role} onValueChange={(value) => setFilters(f => ({ ...f, role: value }))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="LIBRARIAN">Librarian</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.isActive} onValueChange={(value) => setFilters(f => ({ ...f, isActive: value }))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(f => ({ ...f, sortBy: value }))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Join Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedUsers.length} user(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingBulkAction('activate')}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingBulkAction('deactivate')}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      Deactivate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingBulkAction('delete')}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        <Checkbox
                          checked={selectedUsers.length === filtered.length && filtered.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Join Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map((user, index) => {
                        const RoleIcon = getRoleIcon(user.role)
                        const isSelected = selectedUsers.includes(user.id)
                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                          >
                            <td className="py-4 px-4">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedUsers([...selectedUsers, user.id])
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                                  }
                                }}
                              />
                            </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getRoleColor(user.role)}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {user.role.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(user.isActive)}>
                            {user.isActive ? "active" : "inactive"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => onViewDetails(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Settings className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => assignRole(user.id, user.role === 'STUDENT' ? 'TEACHER' : 'STUDENT')}>
                                <Shield className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleUserStatus(user.id, !user.isActive)}>
                                {user.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                                {user.isActive ? "Deactivate User" : "Activate User"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(user.id)}>
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    )
                  })}
                    </AnimatePresence>
                    {!isLoading && filtered.length === 0 && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No users found
                        </td>
                      </motion.tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details - {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Name</Label>
                        <p className="text-lg">{selectedUser.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <p className="text-lg">{selectedUser.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Role</Label>
                        <Badge className={getRoleColor(selectedUser.role)}>
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <Badge className={getStatusColor(selectedUser.isActive)}>
                          {selectedUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Join Date</Label>
                        <p className="text-lg">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="loans" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="loans">Current Loans</TabsTrigger>
                    <TabsTrigger value="history">Borrowing History</TabsTrigger>
                    <TabsTrigger value="fines">Fines</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="loans" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Loans ({userDetails?.currentLoans?.length || 0})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userDetails?.currentLoans?.length > 0 ? (
                          <div className="space-y-3">
                            {userDetails.currentLoans.map((loan: any) => (
                              <div key={loan.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{loan.libraryItem?.title}</p>
                                  <p className="text-sm text-gray-600">
                                    Due: {new Date(loan.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={new Date(loan.dueDate) < new Date() ? "destructive" : "default"}>
                                  {new Date(loan.dueDate) < new Date() ? "Overdue" : "Active"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">No current loans</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="history" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Borrowing History ({userDetails?.borrowingHistory?.length || 0})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userDetails?.borrowingHistory?.length > 0 ? (
                          <div className="space-y-3">
                            {userDetails.borrowingHistory.slice(0, 10).map((loan: any) => (
                              <div key={loan.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{loan.libraryItem?.title}</p>
                                  <p className="text-sm text-gray-600">
                                    Borrowed: {new Date(loan.loanDate).toLocaleDateString()}
                                    {loan.returnDate && ` | Returned: ${new Date(loan.returnDate).toLocaleDateString()}`}
                                  </p>
                                </div>
                                <Badge variant={loan.status === 'RETURNED' ? "default" : "secondary"}>
                                  {loan.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">No borrowing history</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="fines" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Fines ({userDetails?.fines?.length || 0})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userDetails?.fines?.length > 0 ? (
                          <div className="space-y-3">
                            {userDetails.fines.map((fine: any) => (
                              <div key={fine.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">${fine.amount}</p>
                                  <p className="text-sm text-gray-600">{fine.reason}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(fine.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={fine.status === 'PAID' ? "default" : "destructive"}>
                                  {fine.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">No fines</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              {!editingId && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="LIBRARIAN">Librarian</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onSubmit}>{editingId ? "Save" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Confirmation Dialog */}
        <Dialog open={!!pendingBulkAction} onOpenChange={() => setPendingBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to {pendingBulkAction} {selectedUsers.length} user(s)? 
                {pendingBulkAction === 'delete' && ' This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingBulkAction(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (pendingBulkAction) {
                    handleBulkAction(pendingBulkAction)
                    setPendingBulkAction(null)
                  }
                }}
                variant={pendingBulkAction === 'delete' ? 'destructive' : 'default'}
              >
                Confirm {pendingBulkAction}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
    </AuthGuard>
  )
}
