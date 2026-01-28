"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, X, Clock, User, Mail, Calendar } from "lucide-react"
import { getLibrarianRequests, approveLibrarian, rejectLibrarian } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function AdminLibrarianRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const data = await getLibrarianRequests()
      setRequests(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load librarian requests:', error)
      toast({
        title: "Error",
        description: "Failed to load librarian requests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (processingIds.has(id)) return
    
    setProcessingIds(prev => new Set(prev).add(id))
    try {
      await approveLibrarian(id)
      toast({
        title: "Success",
        description: "Librarian request approved successfully"
      })
      loadRequests()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to approve request",
        variant: "destructive"
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleReject = async (id: string) => {
    if (processingIds.has(id)) return
    
    setProcessingIds(prev => new Set(prev).add(id))
    try {
      await rejectLibrarian(id)
      toast({
        title: "Success",
        description: "Librarian request rejected"
      })
      loadRequests()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to reject request",
        variant: "destructive"
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
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
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Librarian Requests</h1>
          <p className="text-gray-600 mt-2">Review and manage librarian applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{requests.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action Required</CardTitle>
              <User className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{requests.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Pending Librarian Applications
            </CardTitle>
            <CardDescription>
              Review applications and approve qualified librarians
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-500">All librarian requests have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{request.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {request.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Applied: {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {request.metadata && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-sm text-gray-900 mb-2">Additional Information:</h4>
                          <div className="text-sm text-gray-600">
                            {Object.entries(request.metadata as any).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>

                    <div className="flex gap-3 ml-6">
                      <Button
                        onClick={() => handleReject(request.id)}
                        disabled={processingIds.has(request.id)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {processingIds.has(request.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingIds.has(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingIds.has(request.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
