"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Clock, 
  DollarSign,
  Edit,
  Save,
  X,
  Loader2,
  Shield,
  Phone,
  MapPin,
  TrendingUp,
  Users,
  AlertTriangle
} from "lucide-react"
import { getCurrentUser, updateProfile, getAllLoans, getAllReservations, getRecentActivities } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function LibrarianProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    overdueLoans: 0,
    totalReservations: 0,
    pendingReservations: 0,
    recentActivities: 0
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      
      // Load user profile and statistics in parallel
      const [userData, loansData, reservationsData, activitiesData] = await Promise.all([
        getCurrentUser(),
        getAllLoans().catch(() => []),
        getAllReservations().catch(() => []),
        getRecentActivities(50).catch(() => [])
      ])

      setUser(userData)
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.metadata?.phone || "",
        address: userData.metadata?.address || ""
      })

      // Calculate statistics
      const loans = Array.isArray(loansData) ? loansData : []
      const reservations = Array.isArray(reservationsData) ? reservationsData : []
      const activities = Array.isArray(activitiesData) ? activitiesData : []
      
      const activeLoans = loans.filter((loan: any) => loan.status === 'ACTIVE' && !loan.returnDate)
      const overdueLoans = loans.filter((loan: any) => {
        if (loan.status !== 'ACTIVE' || loan.returnDate) return false
        const dueDate = loan.dueDate ? new Date(loan.dueDate) : null
        return dueDate && dueDate < new Date()
      })
      const pendingReservations = reservations.filter((res: any) => res.status === 'PENDING')
      
      setStats({
        totalLoans: loans.length,
        activeLoans: activeLoans.length,
        overdueLoans: overdueLoans.length,
        totalReservations: reservations.length,
        pendingReservations: pendingReservations.length,
        recentActivities: activities.length
      })

    } catch (error) {
      console.error('Failed to load profile data:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      await updateProfile({
        name: formData.name,
        email: formData.email,
        metadata: {
          ...user.metadata,
          phone: formData.phone,
          address: formData.address
        }
      })

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      setEditing(false)
      await loadProfileData() // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.metadata?.phone || "",
      address: user?.metadata?.address || ""
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <DashboardLayout userRole="librarian">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout userRole="librarian">
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Librarian Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account information and view system statistics</p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your account details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    {editing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="mt-1 p-2 border rounded-md bg-gray-50">
                        {user.name || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    {editing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    ) : (
                      <div className="mt-1 p-2 border rounded-md bg-gray-50 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {user.email || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="mt-1 p-2 border rounded-md bg-gray-50 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {user.metadata?.phone || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="role">Account Type</Label>
                    <div className="mt-1 p-2 border rounded-md bg-gray-50 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Work Address</Label>
                  {editing ? (
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your work address"
                    />
                  ) : (
                    <div className="mt-1 p-2 border rounded-md bg-gray-50 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {user.metadata?.address || "Not provided"}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Employee Since</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Account Status</p>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Statistics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Overview
                </CardTitle>
                <CardDescription>
                  Library system statistics and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Total Loans
                    </span>
                    <span className="font-semibold text-blue-600">{stats.totalLoans}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Active Loans
                    </span>
                    <span className="font-semibold text-green-600">{stats.activeLoans}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Overdue Items
                    </span>
                    <span className={`font-semibold ${stats.overdueLoans > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.overdueLoans}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Total Reservations
                    </span>
                    <span className="font-semibold">{stats.totalReservations}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Reservations
                    </span>
                    <span className={`font-semibold ${stats.pendingReservations > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {stats.pendingReservations}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recent Activities
                    </span>
                    <span className="font-semibold text-purple-600">{stats.recentActivities}</span>
                  </div>
                </div>

                {stats.overdueLoans > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Attention Required</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {stats.overdueLoans} item(s) are overdue and need immediate attention.
                    </p>
                  </div>
                )}

                {stats.pendingReservations > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center gap-2 text-orange-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Pending Actions</span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      {stats.pendingReservations} reservation(s) are waiting for your attention.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
