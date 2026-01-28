"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Clock, Mail, ArrowRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role")
  const status = searchParams.get("status")

  const isApproved = status === "approved"
  const isPending = status === "pending"

  const getRoleTitle = () => {
    switch (role) {
      case "patron":
        return "Library Patron"
      case "librarian":
        return "Librarian"
      case "admin":
        return "Administrator"
      default:
        return "User"
    }
  }

  const getRoleColor = () => {
    switch (role) {
      case "patron":
        return "blue"
      case "librarian":
        return "green"
      case "admin":
        return "red"
      default:
        return "gray"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              {isApproved ? (
                <div className="p-4 bg-green-100 rounded-full animate-bounce">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              ) : (
                <div className="p-4 bg-yellow-100 rounded-full animate-pulse">
                  <Clock className="h-16 w-16 text-yellow-600" />
                </div>
              )}
            </div>

            <CardTitle className="text-3xl mb-2">
              {isApproved ? "Welcome to EduLibrary Pro!" : "Application Submitted!"}
            </CardTitle>

            <CardDescription className="text-lg">
              {isApproved
                ? `Your ${getRoleTitle()} account has been created successfully`
                : `Your ${getRoleTitle()} application is under review`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isApproved ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-800 mb-3">Account Details</h3>
                  <div className="space-y-2 text-green-700">
                    <p>✅ Account Type: {getRoleTitle()}</p>
                    <p>✅ Status: Active</p>
                    <p>✅ Access Level: {role === "patron" ? "Browse & Reserve Books" : "Full Library Management"}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-3">What's Next?</h3>
                  <div className="space-y-2 text-blue-700">
                    <p>📚 Explore our extensive book catalog</p>
                    <p>🔍 Use advanced search features</p>
                    <p>📱 Access your personalized dashboard</p>
                    {role === "patron" && <p>💝 Get personalized book recommendations</p>}
                    {role === "librarian" && <p>⚙️ Start managing library operations</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={`/dashboard/${role}`} className="flex-1">
                    <Button
                      className={`w-full ${
                        getRoleColor() === "red"
                          ? "bg-red-600 hover:bg-red-700"
                          : getRoleColor() === "green"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                      } transform hover:scale-105 transition-all duration-300`}
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full transform hover:scale-105 transition-all duration-300 bg-transparent"
                    >
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-6 w-6 text-yellow-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-2">Application Under Review</h3>
                      <p className="text-yellow-700">
                        Your {getRoleTitle()} application has been submitted successfully. Our administrators will
                        review your request and get back to you within 24-48 hours.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-3">What Happens Next?</h3>
                  <div className="space-y-3 text-blue-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Admin reviews your application and credentials</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>You'll receive an email notification with the decision</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>If approved, you can immediately access your dashboard</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">In the Meantime</h3>
                  <p className="text-gray-700 mb-4">
                    While waiting for approval, you can still explore EduLibrary Pro as a patron:
                  </p>
                  <Link href="/auth/signup">
                    <Button variant="outline" className="w-full bg-transparent">
                      Create Patron Account (Instant Access)
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/login" className="flex-1">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full transform hover:scale-105 transition-all duration-300 bg-transparent"
                    >
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <BookOpen className="h-5 w-5" />
            <span>Need help? Contact our support team</span>
          </div>
        </div>
      </div>
    </div>
  )
}
