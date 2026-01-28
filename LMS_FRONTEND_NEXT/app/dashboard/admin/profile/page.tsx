"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, Mail, Phone, Calendar, Shield, Settings, 
  Save, Edit, Camera, Clock, Activity, Key,
  Database, TrendingUp, Users, BookOpen
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser, updateProfile, getDashboardStats, getUsers } from "@/lib/api"

interface AdminProfile {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  createdAt: string
  lastLogin?: string
  isEmailVerified: boolean
  profileImage?: string
  metadata?: {
    phone?: string
    address?: string
  }
}

interface AdminStats {
  totalUsers: number
  totalBooks: number
  totalLoans: number
  totalFines: number
  systemUptime: string
  lastBackup: string
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    loadProfileData()
    loadAdminStats()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const userData = await getCurrentUser()
      if (userData) {
        setProfile({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          phone: userData.metadata?.phone,
          createdAt: userData.createdAt || new Date().toISOString(),
          lastLogin: userData.metadata?.lastLogin,
          isEmailVerified: userData.isVerified ?? false,
          profileImage: userData.metadata?.profileImage,
          metadata: userData.metadata
        })
        setEditForm({
          name: userData.name || "",
          phone: userData.metadata?.phone || "",
          email: userData.email || "",
          address: userData.metadata?.address || ""
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAdminStats = async () => {
    try {
      const [dashboardData, usersData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getUsers().catch(() => [])
      ])

      setAdminStats({
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
        totalBooks: (dashboardData as any)?.totalBooks || 0,
        totalLoans: (dashboardData as any)?.totalLoans || 0,
        totalFines: (dashboardData as any)?.totalFines || 0,
        systemUptime: "99.9%",
        lastBackup: new Date().toLocaleDateString()
      })
    } catch (error) {
      console.error('Failed to load admin stats:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateProfile({
        name: editForm.name,
        email: editForm.email,
        metadata: {
          ...profile?.metadata,
          phone: editForm.phone,
          address: editForm.address
        }
      })
      
      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email
      } : null)
      
      setEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'UN'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
    }
    return `${name.charAt(0)}U`.toUpperCase()
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

  if (!profile) {
    return (
      <DashboardLayout userRole="admin" userName="Admin User">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load profile data</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and view system overview</p>
          </div>
          <Button 
            onClick={() => setEditing(!editing)}
            variant={editing ? "outline" : "default"}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your personal account details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.profileImage} />
                      <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                        {getInitials(profile?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <Button 
                        size="sm" 
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        variant="secondary"
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profile.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-red-100 text-red-800">
                        <Shield className="h-3 w-3 mr-1" />
                        {profile.role}
                      </Badge>
                      <Badge variant={profile.isEmailVerified ? "default" : "secondary"}>
                        {profile.isEmailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {editing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        {profile.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {editing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {profile.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {profile.phone || profile.metadata?.phone || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Work Address</Label>
                  {editing ? (
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter work address"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                      {profile.metadata?.address || "Not provided"}
                    </p>
                  )}
                </div>

                {editing && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Account Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Last Login</p>
                      <p className="text-sm text-gray-500">
                        {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Statistics Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Overview
                </CardTitle>
                <CardDescription>Quick system statistics and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminStats && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Total Users</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{adminStats.totalUsers}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Total Books</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{adminStats.totalBooks}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Active Loans</span>
                      </div>
                      <span className="text-sm font-bold text-purple-600">{adminStats.totalLoans}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">System Uptime</span>
                      </div>
                      <span className="text-sm font-bold text-orange-600">{adminStats.systemUptime}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Admin Privileges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  User Management
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  System Analytics
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Librarian Requests
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Fine Management
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  System Settings
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
