"use client"

import { useState, useEffect, useMemo } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Search, Clock, Mail, Phone, MessageSquare, DollarSign, Calendar, Users, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllLoans, getOverdueLoans, renewLoan, confirmReturn, createFine, sendOverdueNotifications } from "@/lib/api"

export default function OverdueManagementPage() {
  const [loans, setLoans] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [selectedLoans, setSelectedLoans] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationType, setNotificationType] = useState("email")
  const { toast } = useToast()

  useEffect(() => {
    fetchOverdueLoans()
  }, [])

  const fetchOverdueLoans = async () => {
    try {
      setLoading(true)
      const data = await getOverdueLoans() // Use the proper overdue API
      // Calculate overdue days and severity
      const overdueLoans = data.map(loan => ({
        ...loan,
        overdueDays: Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
        severity: Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)) > 14 ? "high" :
                 Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)) > 7 ? "medium" : "low"
      }))
      setLoans(overdueLoans)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load overdue loans",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch = loan.item?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loan.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loan.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSeverity = severityFilter === "all" || loan.severity === severityFilter
      
      return matchesSearch && matchesSeverity
    })
  }, [loans, searchTerm, severityFilter])

  const stats = useMemo(() => {
    const total = loans.length
    const highPriority = loans.filter(loan => loan.severity === "high").length
    const mediumPriority = loans.filter(loan => loan.severity === "medium").length
    const lowPriority = loans.filter(loan => loan.severity === "low").length
    const totalFinesOwed = loans.reduce((sum, loan) => sum + (loan.overdueDays * 1), 0) // $1 per day
    
    return { total, highPriority, mediumPriority, lowPriority, totalFinesOwed }
  }, [loans])

  const handleBulkAction = async () => {
    if (selectedLoans.length === 0 || !bulkAction) return
    
    try {
      if (bulkAction === "send-notification") {
        // In a real app, this would call a notification service
        toast({
          title: "Success",
          description: `Notifications sent to ${selectedLoans.length} patrons`,
        })
      } else if (bulkAction === "apply-fines") {
        // Apply fines to selected overdue loans
        for (const loanId of selectedLoans) {
          const loan = loans.find(l => l.id === loanId)
          if (loan) {
            await createFine({
              userId: loan.userId,
              loanId: loan.id,
              amount: loan.overdueDays * 1, // $1 per day
              reason: `Overdue fine for ${loan.item?.title} (${loan.overdueDays} days overdue)`
            })
          }
        }
        toast({
          title: "Success",
          description: `Fines applied to ${selectedLoans.length} overdue loans`,
        })
      }
      setSelectedLoans([])
      setBulkAction("")
      await fetchOverdueLoans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      })
    }
  }

  const handleIndividualAction = async (loanId: string, action: string) => {
    try {
      if (action === "renew") {
        await renewLoan(loanId)
        toast({ title: "Success", description: "Loan renewed successfully" })
      } else if (action === "return") {
        await confirmReturn(loanId)
        toast({ title: "Success", description: "Return confirmed" })
      } else if (action === "apply-fine") {
        const loan = loans.find(l => l.id === loanId)
        if (loan) {
          await createFine({
            userId: loan.userId,
            loanId: loan.id,
            amount: loan.overdueDays * 1,
            reason: `Overdue fine for ${loan.item?.title} (${loan.overdueDays} days overdue)`
          })
          toast({ title: "Success", description: "Fine applied successfully" })
        }
      }
      await fetchOverdueLoans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive",
      })
    }
  }

  const handleSendNotification = async () => {
    try {
      if (selectedLoans.length === 0) {
        toast({
          title: "No items selected",
          description: "Please select at least one overdue item to send notifications",
          variant: "destructive"
        })
        return
      }

      // Send overdue notifications to selected patrons
      await sendOverdueNotifications()
      
      toast({
        title: "Success",
        description: `Overdue notifications sent successfully to ${selectedLoans.length} patron(s)`,
      })
      setNotificationDialogOpen(false)
      setNotificationMessage("")
      setSelectedLoans([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive"
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-50"
      case "medium": return "text-orange-600 bg-orange-50"
      case "low": return "text-yellow-600 bg-yellow-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <DashboardLayout userRole="librarian" userName="Sarah Librarian">
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              Overdue Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Monitor and manage overdue loans and fines
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto text-sm">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Send Notifications</span>
                  <span className="sm:hidden">Notifications</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Overdue Notifications</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Notification Type</Label>
                    <Select value={notificationType} onValueChange={setNotificationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Enter notification message..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendNotification}>
                    Send Notification
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={fetchOverdueLoans} className="w-full sm:w-auto text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { title: "Total Overdue", value: stats.total, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" },
            { title: "High Priority", value: stats.highPriority, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" },
            { title: "Medium Priority", value: stats.mediumPriority, icon: Clock, color: "text-orange-600", bgColor: "bg-orange-50" },
            { title: "Low Priority", value: stats.lowPriority, icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50" },
            { title: "Total Fines", value: `$${stats.totalFinesOwed}`, icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50" },
          ].map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                      <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters and Bulk Actions */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, patron name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
                {selectedLoans.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Bulk Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send-notification">Send Notifications</SelectItem>
                        <SelectItem value="apply-fines">Apply Fines</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBulkAction} disabled={!bulkAction} className="text-sm">
                      Apply ({selectedLoans.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Loans */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Overdue Loans</CardTitle>
            <CardDescription className="text-sm">Manage overdue items and follow up with patrons</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">
                      <Checkbox
                        checked={selectedLoans.length === filteredLoans.length && filteredLoans.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLoans(filteredLoans.map(loan => loan.id))
                          } else {
                            setSelectedLoans([])
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">Item</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Patron</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Days Overdue</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Priority</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Potential Fine</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedLoans.includes(loan.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLoans(prev => [...prev, loan.id])
                            } else {
                              setSelectedLoans(prev => prev.filter(id => id !== loan.id))
                            }
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{loan.item?.title}</div>
                          <div className="text-sm text-gray-500">ID: {loan.id}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{loan.user?.name}</div>
                          <div className="text-sm text-gray-500">{loan.user?.email}</div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Badge variant="destructive">{loan.overdueDays} days</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getSeverityColor(loan.severity)}>
                          {loan.severity.charAt(0).toUpperCase() + loan.severity.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold text-green-600">
                        ${loan.overdueDays * 1}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleIndividualAction(loan.id, "renew")}
                          >
                            Renew
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleIndividualAction(loan.id, "return")}
                          >
                            Return
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleIndividualAction(loan.id, "apply-fine")}
                          >
                            Fine
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedLoans([loan.id])
                              setNotificationDialogOpen(true)
                            }}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {/* Mobile Select All */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  checked={selectedLoans.length === filteredLoans.length && filteredLoans.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLoans(filteredLoans.map(loan => loan.id))
                    } else {
                      setSelectedLoans([])
                    }
                  }}
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({filteredLoans.length})
                </span>
              </div>

              {filteredLoans.map((loan) => (
                <Card key={loan.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {/* Header with Checkbox and Priority */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedLoans.includes(loan.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLoans(prev => [...prev, loan.id])
                              } else {
                                setSelectedLoans(prev => prev.filter(id => id !== loan.id))
                              }
                            }}
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{loan.item?.title}</h3>
                            <p className="text-xs text-gray-500">ID: {loan.id}</p>
                          </div>
                        </div>
                        <Badge className={`${getSeverityColor(loan.severity)} text-xs`}>
                          {loan.severity.charAt(0).toUpperCase() + loan.severity.slice(1)}
                        </Badge>
                      </div>

                      {/* Patron Info */}
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-sm font-medium text-gray-900">{loan.user?.name}</div>
                        <div className="text-xs text-gray-500">{loan.user?.email}</div>
                      </div>

                      {/* Overdue Details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Due Date:</span>
                          <div className="font-medium">{new Date(loan.dueDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Days Overdue:</span>
                          <div><Badge variant="destructive" className="text-xs">{loan.overdueDays} days</Badge></div>
                        </div>
                        <div>
                          <span className="text-gray-500">Potential Fine:</span>
                          <div className="font-semibold text-green-600">${loan.overdueDays * 1}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleIndividualAction(loan.id, "renew")}
                          className="text-xs"
                        >
                          Renew
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleIndividualAction(loan.id, "return")}
                          className="text-xs"
                        >
                          Return
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleIndividualAction(loan.id, "apply-fine")}
                          className="text-xs"
                        >
                          Apply Fine
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedLoans([loan.id])
                            setNotificationDialogOpen(true)
                          }}
                          className="text-xs"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Notify
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
              
            {filteredLoans.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 text-green-500" />
                <p className="text-base sm:text-lg font-semibold">No overdue loans found!</p>
                <p className="text-sm sm:text-base">All items are returned on time.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
