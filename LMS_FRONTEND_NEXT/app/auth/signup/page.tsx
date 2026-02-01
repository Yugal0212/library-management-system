"use client"

import type React from "react"
import { useState, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { register } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  Users,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Library,
  Award,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false) // Prevent double submission
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    libraryId: "",
    department: "",
    studentId: "",
    reason: "",
  })

  const roles = useMemo(() => [
    {
      id: "patron",
      title: "Library Patron",
      description: "Students, researchers, and general users",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      hoverColor: "hover:border-blue-400",
      available: true,
      note: "✓ Instant approval - Start browsing immediately",
    },
    {
      id: "librarian",
      title: "Librarian",
      description: "Library staff and management",
      icon: BookOpen,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      hoverColor: "hover:border-green-400",
      available: true,
      note: "⏳ Requires admin approval - Processed within 24h",
    },
    {
      id: "admin",
      title: "Administrator",
      description: "Full system access",
      icon: Shield,
      color: "from-red-500 to-pink-500",
      bgColor: "from-red-50 to-pink-50",
      hoverColor: "",
      available: false,
      note: "⚠ Contact system administrator",
    },
  ], [])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const validateForm = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        variant: "destructive",
      })
      return false
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return false
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return false
    }

    if (selectedRole === "librarian") {
      if (!formData.libraryId.trim() || !formData.department || !formData.reason.trim()) {
        toast({
          title: "Validation Error",
          description: "All librarian fields are required",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isSubmittingRef.current || isLoading) {
      return
    }

    if (!validateForm()) {
      return
    }

    isSubmittingRef.current = true
    setIsLoading(true)

    try {
      // Map UI role to backend enum
      const roleMap: Record<string, string> = {
        librarian: "LIBRARIAN",
        admin: "ADMIN",
        patron: "STUDENT"
      }

      const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`
      
      // Add metadata only if fields exist (reduce payload size)
      const metadata: Record<string, string> = {}
      
      if (selectedRole === "librarian") {
        metadata.libraryId = formData.libraryId.trim()
        metadata.department = formData.department.trim()
        metadata.reason = formData.reason.trim()
        if (formData.phone.trim()) metadata.phone = formData.phone.trim()
        if (formData.address.trim()) metadata.address = formData.address.trim()
      } else if (selectedRole === "patron") {
        if (formData.studentId.trim()) metadata.studentId = formData.studentId.trim()
        if (formData.department.trim()) metadata.department = formData.department.trim()
        if (formData.phone.trim()) metadata.phone = formData.phone.trim()
        if (formData.address.trim()) metadata.address = formData.address.trim()
      }
      
      const result = await register({
        name,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: roleMap[selectedRole] as "LIBRARIAN" | "ADMIN" | "STUDENT" | "TEACHER",
        ...(Object.keys(metadata).length > 0 && { metadata })
      })

      // Show appropriate success message
      const title = result.isLibrarian ? "✓ Registration Initiated" : "✓ Registration Successful"
      const description = result.message
      const variant = result.emailSent === false ? "default" : "default"

      toast({
        title,
        description,
        duration: result.emailSent === false ? 10000 : 5000, // Longer duration if email failed
      })
      
      // Navigate to verification page immediately
      const params = new URLSearchParams({
        email: formData.email.trim().toLowerCase(),
        role: selectedRole
      })
      
      // Add OTP to URL if provided (fallback when email fails)
      if (result.otp) {
        params.append('otp', result.otp)
      }
      
      router.push(`/auth/verify-email?${params.toString()}`)
    } catch (err: any) {
      console.error("Registration error:", err)
      
      // Parse error message
      let errorMessage = "Please review your details and try again."
      
      if (err?.message) {
        if (err.message.includes("already in use")) {
          errorMessage = "This email is already registered. Please use a different email or try logging in."
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else {
          errorMessage = err.message
        }
      }
      
      toast({
        title: "✗ Registration Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  const currentRole = useMemo(() => 
    roles.find((role) => role.id === selectedRole),
    [selectedRole, roles]
  )

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="w-full max-w-5xl relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Library className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-ping" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    EduLibrary Pro
                  </span>
                  <div className="flex items-center space-x-1">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-gray-600">Premium Edition</span>
                  </div>
                </div>
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Join Our Library</h1>
              <p className="text-lg text-gray-600">Choose your role to get started</p>
            </div>

            {/* Role Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {roles.map((role) => {
                const IconComponent = role.icon
                return (
                  <Card
                    key={role.id}
                    className={`relative cursor-pointer transition-all duration-300 border-2 ${
                      role.available
                        ? `hover:shadow-xl hover:-translate-y-1 ${role.hoverColor} hover:bg-gradient-to-br ${role.bgColor}`
                        : "opacity-60 cursor-not-allowed"
                    }`}
                    onClick={() => role.available && setSelectedRole(role.id)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div
                        className={`mx-auto p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 bg-gradient-to-br ${role.color} shadow-lg`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold">{role.title}</CardTitle>
                      <CardDescription className="text-sm min-h-[2.5rem]">{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-xs p-3 rounded-lg mb-4 bg-white/80 border">
                        {role.note}
                      </div>
                      <Button
                        className={`w-full bg-gradient-to-r ${role.color} text-white hover:opacity-90 transition-opacity`}
                        disabled={!role.available}
                      >
                        {role.available ? "Select" : "Unavailable"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      )
  }

  // Registration Form Screen
  if (!currentRole) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-4 px-4 relative overflow-hidden flex items-center">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="relative pb-4 pt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRole("")}
              className="absolute left-4 top-4"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex flex-col items-center pt-4">
              <div className={`p-2 rounded-xl mb-3 bg-gradient-to-br ${currentRole.color} shadow-lg`}>
                <currentRole.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Register as {currentRole.title}</CardTitle>
              <CardDescription className="text-center mt-1 text-xs">{currentRole.description}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-xs font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    disabled={isLoading}
                    className="mt-1 h-9 text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-xs font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    disabled={isLoading}
                    className="mt-1 h-9 text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={(e) => {
                      const email = e.target.value.trim()
                      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        e.target.setCustomValidity("Please enter a valid email")
                      } else {
                        e.target.setCustomValidity("")
                      }
                    }}
                    required
                    disabled={isLoading}
                    className="mt-1 h-9 text-sm"
                    placeholder="john@example.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-medium">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={isLoading}
                    className="mt-1 h-9 text-sm"
                    placeholder="+1 234 567 8900"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Min. 6 chars"
                      className="h-9 text-sm pr-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 w-9 px-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Re-enter"
                      className="h-9 text-sm pr-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 w-9 px-0 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Role-specific fields */}
              {selectedRole === "patron" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="studentId" className="text-xs font-medium">Student ID</Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange("studentId", e.target.value)}
                      disabled={isLoading}
                      className="mt-1 h-9 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-xs font-medium">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      disabled={isLoading}
                      className="mt-1 h-9 text-sm"
                      placeholder="e.g., CS"
                    />
                  </div>
                </div>
              )}

              {selectedRole === "librarian" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="libraryId" className="text-xs font-medium">
                        Library ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="libraryId"
                        value={formData.libraryId}
                        onChange={(e) => handleInputChange("libraryId", e.target.value)}
                        required
                        disabled={isLoading}
                        className="mt-1 h-9 text-sm"
                        placeholder="Library ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department" className="text-xs font-medium">
                        Department <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        onValueChange={(value) => handleInputChange("department", value)}
                        disabled={isLoading}
                        required
                      >
                        <SelectTrigger className="mt-1 h-9 text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circulation">Circulation</SelectItem>
                          <SelectItem value="reference">Reference</SelectItem>
                          <SelectItem value="cataloging">Cataloging</SelectItem>
                          <SelectItem value="acquisitions">Acquisitions</SelectItem>
                          <SelectItem value="administration">Administration</SelectItem>
                          <SelectItem value="digital">Digital Services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reason" className="text-xs font-medium">
                      Reason for Access <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-1 text-sm"
                      placeholder="Explain your role and why you need librarian access"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {/* Address */}
              <div>
                <Label htmlFor="address" className="text-xs font-medium">Address (Optional)</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={isLoading}
                  className="mt-1 text-sm"
                  placeholder="Optional"
                  rows={1}
                />
              </div>

              {/* Notice */}
              <div
                className={`p-2.5 rounded-lg border ${
                  selectedRole === "patron"
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {selectedRole === "patron" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-xs font-semibold ${selectedRole === "patron" ? "text-green-800" : "text-yellow-800"}`}>
                      {selectedRole === "patron" ? "✓ Instant Access" : "⏳ Approval Required"}
                    </p>
                    <p className={`text-xs mt-0.5 ${selectedRole === "patron" ? "text-green-700" : "text-yellow-700"}`}>
                      {selectedRole === "patron"
                        ? "Account activated after email verification."
                        : "Review within 24 hours."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-10 text-sm font-semibold bg-gradient-to-r ${currentRole.color} text-white hover:opacity-90 transition-all shadow-lg`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>Create Account</>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center border-t pt-4">
              <p className="text-xs text-gray-600">
                Already have an account?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
