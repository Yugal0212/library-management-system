"use client"

import { useState, useEffect } from "react"
import AuthGuard from "@/components/auth/auth-guard"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, Shield, Database, Mail, Clock, 
  Save, RefreshCcw, AlertTriangle, CheckCircle,
  Users, BookOpen, DollarSign, Calendar
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllFines, getUsers, getUserStats } from "@/lib/api"

interface SystemSettings {
  library: {
    name: string
    address: string
    phone: string
    email: string
    website: string
  }
  loan: {
    maxLoanDuration: number
    maxRenewals: number
    finePerDay: number
    maxFineAmount: number
  }
  notifications: {
    emailEnabled: boolean
    dueDateReminder: boolean
    overdueNotification: boolean
    fineNotification: boolean
  }
  security: {
    sessionTimeout: number
    passwordMinLength: number
    requireEmailVerification: boolean
    maxLoginAttempts: number
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    library: {
      name: "University Library",
      address: "123 Campus Drive, University City",
      phone: "+1 (555) 123-4567",
      email: "library@university.edu",
      website: "https://library.university.edu"
    },
    loan: {
      maxLoanDuration: 14,
      maxRenewals: 2,
      finePerDay: 1.0,
      maxFineAmount: 50.0
    },
    notifications: {
      emailEnabled: true,
      dueDateReminder: true,
      overdueNotification: true,
      fineNotification: true
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireEmailVerification: true,
      maxLoginAttempts: 5
    }
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [systemStats, setSystemStats] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadSystemInfo()
  }, [])

  const loadSystemInfo = async () => {
    try {
      setLoading(true)
      // Load system statistics for display
      const [users, fines] = await Promise.all([
        getUsers().catch(() => []),
        getAllFines().catch(() => [])
      ])

      setSystemStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalFines: Array.isArray(fines) ? fines.length : 0,
        systemUptime: "99.9%", // Would be calculated from actual metrics
        lastBackup: new Date().toLocaleDateString()
      })
    } catch (error) {
      console.error('Failed to load system info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      // In a real implementation, this would call an API to save settings
      // For now, simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
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
    <AuthGuard allowed={["ADMIN"]}>
      <DashboardLayout userRole="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-2">Configure library system parameters and preferences</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>

        {/* System Status Cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-gray-500">Uptime: {systemStats.systemUptime}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</div>
                <p className="text-xs text-gray-500">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Database className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Today</div>
                <p className="text-xs text-gray-500">{systemStats.lastBackup}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Fines</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{systemStats.totalFines}</div>
                <p className="text-xs text-gray-500">Outstanding fines</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="library">Library Info</TabsTrigger>
            <TabsTrigger value="loan">Loan Policies</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Library Information
                </CardTitle>
                <CardDescription>Basic library details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="library-name">Library Name</Label>
                    <Input
                      id="library-name"
                      value={settings.library.name}
                      onChange={(e) => updateSetting('library', 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="library-email">Email Address</Label>
                    <Input
                      id="library-email"
                      type="email"
                      value={settings.library.email}
                      onChange={(e) => updateSetting('library', 'email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="library-address">Address</Label>
                  <Input
                    id="library-address"
                    value={settings.library.address}
                    onChange={(e) => updateSetting('library', 'address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="library-phone">Phone Number</Label>
                    <Input
                      id="library-phone"
                      value={settings.library.phone}
                      onChange={(e) => updateSetting('library', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="library-website">Website</Label>
                    <Input
                      id="library-website"
                      value={settings.library.website}
                      onChange={(e) => updateSetting('library', 'website', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loan" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Loan Policies
                </CardTitle>
                <CardDescription>Configure loan duration, renewals, and fine policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="max-loan-duration">Max Loan Duration (days)</Label>
                    <Input
                      id="max-loan-duration"
                      type="number"
                      value={settings.loan.maxLoanDuration}
                      onChange={(e) => updateSetting('loan', 'maxLoanDuration', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Default loan period for new books</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-renewals">Max Renewals</Label>
                    <Input
                      id="max-renewals"
                      type="number"
                      value={settings.loan.maxRenewals}
                      onChange={(e) => updateSetting('loan', 'maxRenewals', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Maximum times a user can renew a book</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fine-per-day">Fine Per Day ($)</Label>
                    <Input
                      id="fine-per-day"
                      type="number"
                      step="0.01"
                      value={settings.loan.finePerDay}
                      onChange={(e) => updateSetting('loan', 'finePerDay', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Daily fine for overdue items</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-fine">Max Fine Amount ($)</Label>
                    <Input
                      id="max-fine"
                      type="number"
                      step="0.01"
                      value={settings.loan.maxFineAmount}
                      onChange={(e) => updateSetting('loan', 'maxFineAmount', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Maximum fine cap per item</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure automated email notifications and reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="email-enabled">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Enable or disable all email notifications</p>
                  </div>
                  <Switch
                    id="email-enabled"
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailEnabled', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Due Date Reminders</Label>
                      <p className="text-sm text-gray-500">Send reminders before items are due</p>
                    </div>
                    <Switch
                      checked={settings.notifications.dueDateReminder}
                      onCheckedChange={(checked) => updateSetting('notifications', 'dueDateReminder', checked)}
                      disabled={!settings.notifications.emailEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Overdue Notifications</Label>
                      <p className="text-sm text-gray-500">Send notifications for overdue items</p>
                    </div>
                    <Switch
                      checked={settings.notifications.overdueNotification}
                      onCheckedChange={(checked) => updateSetting('notifications', 'overdueNotification', checked)}
                      disabled={!settings.notifications.emailEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Fine Notifications</Label>
                      <p className="text-sm text-gray-500">Send notifications for unpaid fines</p>
                    </div>
                    <Switch
                      checked={settings.notifications.fineNotification}
                      onCheckedChange={(checked) => updateSetting('notifications', 'fineNotification', checked)}
                      disabled={!settings.notifications.emailEnabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security policies and authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Auto-logout inactive users</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-min-length">Min Password Length</Label>
                    <Input
                      id="password-min-length"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Minimum characters required</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-gray-500">Users must verify email before accessing system</p>
                    </div>
                    <Switch
                      checked={settings.security.requireEmailVerification}
                      onCheckedChange={(checked) => updateSetting('security', 'requireEmailVerification', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input
                      id="max-login-attempts"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Lock account after failed attempts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={handleSaveSettings} disabled={saving} size="lg">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving Settings...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
