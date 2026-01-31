"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Library, Sparkles, Award, ArrowRight, Shield, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/http"
import { setUserInLocalStorage, clearAuthData, setTokens } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSubmittingRef = useRef(false) // Prevent double submission
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isSubmittingRef.current || isLoading) {
      return
    }

    isSubmittingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      // Call login API
      const response = await apiFetch<{
        user: any
        accessToken: string
        refreshToken: string
      }>("/auth/login", {
        method: "POST",
        json: { 
          email: loginData.email, 
          password: loginData.password 
        }
      })

      // Store user and tokens in localStorage
      console.log('Login successful, storing user:', response.user)
      setUserInLocalStorage(response.user)
      setTokens(response.accessToken, response.refreshToken)
      
      // Verify storage
      console.log('User stored in localStorage:', localStorage.getItem('auth_user'))
      console.log('Token stored:', localStorage.getItem('auth_token') ? 'Yes' : 'No')

      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.name}!`
      })

      // Redirect based on role - use window.location for reliable production redirects
      const role = response.user.role
      let redirectPath = "/dashboard/patron"
      
      if (role === "ADMIN") {
        redirectPath = "/dashboard/admin"
      } else if (role === "LIBRARIAN") {
        redirectPath = "/dashboard/librarian"
      }
      
      console.log('Redirecting to:', redirectPath)

      // Use setTimeout to ensure localStorage is written and state is updated
      setTimeout(() => {
        // Force a hard navigation to ensure fresh page load with new auth state
        console.log('Executing redirect to:', redirectPath)
        window.location.href = redirectPath
      }, 100)

    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Invalid credentials")
      toast({
        title: "Login failed",
        description: err.message || "Invalid credentials",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Library className="h-6 w-6 text-white group-hover:animate-bounce" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-ping" />
            </div>
            <div>
              <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EduLibrary Pro
              </span>
              <div className="flex items-center space-x-1">
                <Award className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-gray-600">Premium Edition</span>
              </div>
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome Back</h1>
          <p className="text-xl text-gray-600">Sign in to access your library dashboard</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Login Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="form">Login Form</TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="space-y-6">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        required
                        disabled={isLoading}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={loginData.password}
                          onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter your password"
                          required
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-600">Remember me</span>
                      </label>
                      <Link href="/auth/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
                        Forgot password?
                      </Link>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Sign up here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Secure Access</h2>
              <p className="text-gray-600">Enter your credentials to access the library management system</p>
            </div>

            <Card className="border-2 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Role-Based Access</h3>
                    <p className="text-gray-600 text-sm mb-3">Access level determined by your user role</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                        Admin: Full system management access
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        Librarian: Book and member management
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        Student/Teacher: Browse and borrow books
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-indigo-900 mb-3">New to EduLibrary Pro?</h3>
                <p className="text-indigo-700 text-sm mb-4">
                  Join thousands of users who trust EduLibrary Pro for their library management needs. Get started with
                  a patron account for instant access, or apply for librarian privileges.
                </p>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:scale-105 transition-all duration-300">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
