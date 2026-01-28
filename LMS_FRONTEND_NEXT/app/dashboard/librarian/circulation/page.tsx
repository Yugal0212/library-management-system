"use client"

import { useState, useMemo } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Users, CheckCircle, AlertCircle, Search, Clock, RotateCcw } from "lucide-react"
import { useAllLoans } from "@/hooks/use-all-loans"
import { confirmReturn, renewLoan, borrowBook, createLoanForUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function CirculationPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [issueOpen, setIssueOpen] = useState(false)
  const [issueForm, setIssueForm] = useState<{ userId: string; itemId: string }>({ userId: "", itemId: "" })
  const { loans, isLoading, refresh } = useAllLoans("all")
  const { toast } = useToast()

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return loans
    return loans.filter((l) => {
      const title = l.libraryItem?.title?.toLowerCase() || ""
      const user = (l as any).user?.name?.toLowerCase?.() || l.userId?.toLowerCase?.() || ""
      return title.includes(q) || user.includes(q)
    })
  }, [loans, searchTerm])

  const stats = useMemo(() => {
    const total = loans.length
    const active = loans.filter((l) => !l.returnDate).length
    const overdue = loans.filter((l) => {
      if (l.returnDate) return false
      const due = new Date(l.dueDate).getTime()
      return Date.now() > due
    }).length
    const returnsToday = loans.filter((l) => {
      if (!l.returnDate) return false
      const d = new Date(l.returnDate)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    }).length
    return { total, active, overdue, returnsToday }
  }, [loans])

  return (
    <DashboardLayout userRole="librarian" userName="Sarah Librarian">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 animate-fade-in-up">Circulation Management</h1>
            <p className="text-gray-600 mt-2 animate-fade-in-up delay-100">
              Manage book loans, returns, and member circulation
            </p>
          </div>
          <div className="flex space-x-3">
            <Button className="btn-animate animate-fade-in-up delay-200" onClick={() => setIssueOpen(true)}>
              Issue Book
            </Button>
            <Button variant="outline" className="btn-animate animate-fade-in-up delay-300 bg-transparent">
              Return Book
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Active Loans",
              value: isLoading ? "—" : String(stats.active),
              icon: BookOpen,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              title: "Overdue Items",
              value: isLoading ? "—" : String(stats.overdue),
              icon: AlertCircle,
              color: "text-red-600",
              bgColor: "bg-red-50",
            },
            {
              title: "Returns Today",
              value: isLoading ? "—" : String(stats.returnsToday),
              icon: CheckCircle,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
            {
              title: "Total Loans",
              value: isLoading ? "—" : String(stats.total),
              icon: Users,
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
          ].map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card
                key={index}
                className="hover-lift card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 100 + 400}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Issue Book",
              icon: BookOpen,
              color: "bg-blue-500",
              description: "Lend a book to member",
            },
            {
              title: "Return Book",
              icon: RotateCcw,
              color: "bg-green-500",
              description: "Process book returns",
            },
            {
              title: "Renew Book",
              icon: Clock,
              color: "bg-orange-500",
              description: "Extend loan period",
            },
            {
              title: "View Overdue",
              icon: AlertCircle,
              color: "bg-red-500",
              description: "Check overdue items",
            },
          ].map((action, index) => (
            <Card
              key={index}
              className={`cursor-pointer hover-lift card-hover animate-fade-in-up`}
              style={{ animationDelay: `${index * 100 + 800}ms` }}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Circulation Records */}
          <div className="lg:col-span-2">
            <Card className="animate-fade-in-up delay-1000">
              <CardHeader>
                <CardTitle>Recent Circulation Records</CardTitle>
                <CardDescription>Latest book transactions and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by book title or member..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button variant="outline" className="btn-animate bg-transparent" onClick={() => refresh()}>
                    Refresh
                  </Button>
                </div>

                {/* Circulation Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-gray-700">Book</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Member</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Due Date</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l, index) => {
                        const overdue = !l.returnDate && new Date(l.dueDate).getTime() < Date.now()
                        const status = l.returnDate ? "returned" : overdue ? "overdue" : "active"
                        return (
                          <tr
                            key={l.id}
                            className="border-b hover:bg-gray-50 transition-colors duration-200 animate-fade-in-up"
                            style={{ animationDelay: `${index * 50 + 1200}ms` }}
                          >
                            <td className="p-3">
                              <div className="font-medium text-gray-900">{l.libraryItem?.title || "Untitled"}</div>
                              <div className="text-xs text-gray-500">Loan ID: {l.id}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-gray-900">{(l as any).user?.name || l.userId}</div>
                              <div className="text-xs text-gray-500">{(l as any).user?.email || ""}</div>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {l.returnDate ? "-" : new Date(l.dueDate).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  status === "active" ? "default" : status === "overdue" ? "destructive" : "secondary"
                                }
                                className="capitalize"
                              >
                                {status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                {!l.returnDate && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          await renewLoan(l.id)
                                          toast({ title: "Loan renewed" })
                                          await refresh()
                                        } catch (e: any) {
                                          toast({
                                            title: "Renew failed",
                                            description: String(e?.message || e),
                                            variant: "destructive",
                                          })
                                        }
                                      }}
                                    >
                                      <Clock className="h-4 w-4 mr-2" />
                                      Renew
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await confirmReturn(l.id)
                                          toast({ title: "Return confirmed" })
                                          await refresh()
                                        } catch (e: any) {
                                          toast({
                                            title: "Confirm failed",
                                            description: String(e?.message || e),
                                            variant: "destructive",
                                          })
                                        }
                                      }}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Confirm Return
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {!isLoading && filtered.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            No loans found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="animate-fade-in-up delay-1100">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest circulation activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Book Issued", book: "Clean Code", member: "Alice Johnson", time: "2 minutes ago" },
                    { action: "Book Returned", book: "Design Patterns", member: "Bob Smith", time: "5 minutes ago" },
                    { action: "Book Renewed", book: "JavaScript Guide", member: "Carol White", time: "10 minutes ago" },
                    { action: "Fine Paid", book: "Python Cookbook", member: "David Lee", time: "15 minutes ago" },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 animate-fade-in-up`}
                      style={{ animationDelay: `${index * 100 + 1300}ms` }}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600 truncate">{activity.book}</p>
                        <p className="text-xs text-gray-500">by {activity.member}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">User ID</label>
              <Input
                placeholder="Enter user ID"
                value={issueForm.userId}
                onChange={(e) => setIssueForm((f) => ({ ...f, userId: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Item ID</label>
              <Input
                placeholder="Enter item ID"
                value={issueForm.itemId}
                onChange={(e) => setIssueForm((f) => ({ ...f, itemId: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  if (!issueForm.userId.trim() || !issueForm.itemId.trim()) {
                    toast({ title: "Missing information", description: "Please provide both user ID and item ID", variant: "destructive" })
                    return
                  }
                  await createLoanForUser({ userId: issueForm.userId, libraryItemId: issueForm.itemId })
                  toast({ title: "Book issued successfully" })
                  setIssueOpen(false)
                  setIssueForm({ userId: "", itemId: "" })
                  await refresh()
                } catch (e: any) {
                  toast({ title: "Issue failed", description: String(e?.message || e), variant: "destructive" })
                }
              }}
              disabled={!issueForm.itemId || !issueForm.userId}
            >
              Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
