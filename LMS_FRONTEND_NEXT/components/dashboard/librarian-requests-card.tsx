"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useLibrarianRequests } from "@/hooks/use-librarian-requests"
import { CheckCircle, XCircle, Clock, Mail, User, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function LibrarianRequestsCard() {
  const { requests, loading, error, approve, reject } = useLibrarianRequests()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await approve(id)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    try {
      await reject(id)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Librarian Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Librarian Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Librarian Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No pending librarian requests
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{request.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">
                    {request.status}
                  </Badge>
                </div>

                {request.metadata && (
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium mb-1">Additional Information:</div>
                    <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                      {JSON.stringify(request.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex items-center gap-2"
                        disabled={actionLoading === request.id}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Librarian Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to approve {request.name}&apos;s librarian request? 
                          They will be granted librarian access and can log in immediately.
                          An approval email will be sent to {request.email}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? "Approving..." : "Approve"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex items-center gap-2"
                        disabled={actionLoading === request.id}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Librarian Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject {request.name}&apos;s librarian request?
                          This action will deny their request and send a rejection email to {request.email}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {actionLoading === request.id ? "Rejecting..." : "Reject"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}