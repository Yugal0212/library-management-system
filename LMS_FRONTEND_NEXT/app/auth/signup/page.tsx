"use client"

import type React from "react"

import { useState } from "react"
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
  const [isLoading, setIsLoading] = useState(false)
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

  const roles = [
    {
      id: "patron",
      title: "Library Patron",
      description: "Students, researchers, and general library users",
      icon: Users,
      color: "blue",
      available: true,
      note: "Instant approval - Start browsing immediately",
    },
    {
      id: "librarian",
      title: "Librarian",
      description: "Library staff and book management personnel",
      icon: BookOpen,
      color: "green",
      available: true,
      note: "Requires admin approval - Usually processed within 24 hours",
    },
    {
      id: "admin",
      title: "System Administrator",
      description: "Full system access and user management",
      icon: Shield,
      color: "red",
      available: false,
      note: "Contact system administrator for admin access",
    },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }
      // Map UI role to backend enum
      const roleMap = selectedRole === "librarian" ? "LIBRARIAN" : selectedRole === "admin" ? "ADMIN" : "STUDENT"

      const name = `${formData.firstName} ${formData.lastName}`.trim()
      const result = await register({
        name,
        email: formData.email,
        password: formData.password,
        role: roleMap as any,
      })

      // Handle different responses based on user type
      if (selectedRole === "librarian") {
        toast({
          title: "Registration initiated",
          description: "Please verify your email with the OTP we sent you. After verification, your request will be sent for admin approval.",
        })
      } else {
        toast({
          title: "Registration successful",
          description: "We sent you a 4-digit OTP to verify your email.",
        })
      }
      
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}&role=${selectedRole}`)
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.message || "Please review your details and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSelectedRole = () => roles.find((role) => role.id === selectedRole)

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-4xl relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6 group">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Library className="h-5 w-5 text-white group-hover:animate-bounce" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 animate-ping" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  EduLibrary Pro
                </span>
                <div className="flex items-center space-x-1">
                  <Award className="h-2 w-2 text-yellow-500" />
                  <span className="text-xs text-gray-600">Premium</span>
                </div>
              </div>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Join EduLibrary Pro</h1>
            <p className="text-xl text-gray-600">Choose your role to get started</p>
          </div>

          {/* Role Selection */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {roles.map((role) => {
              const IconComponent = role.icon
              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                    role.available
                      ? "hover:shadow-xl border-2 hover:border-indigo-300"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => role.available && setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center">
                    <div
                      className={`mx-auto p-4 rounded-2xl w-20 h-20 flex items-center justify-center mb-4 ${
                        role.color === "red"
                          ? "bg-gradient-to-br from-red-100 to-pink-100"
                          : role.color === "green"
                            ? "bg-gradient-to-br from-green-100 to-emerald-100"
                            : "bg-gradient-to-br from-blue-100 to-cyan-100"
                      }`}
                    >
                      <IconComponent
                        className={`h-10 w-10 ${
                          role.color === "red"
                            ? "text-red-600"
                            : role.color === "green"
                              ? "text-green-600"
                              : "text-blue-600"
                        }`}
                      />
                    </div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription className="text-center min-h-[3rem]">{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div
                      className={`text-xs p-2 rounded-lg mb-4 ${
                        role.available
                          ? role.id === "patron"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {role.note}
                    </div>
                    <Button
                      className={`w-full ${
                        role.color === "red"
                          ? "bg-red-600 hover:bg-red-700"
                          : role.color === "green"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      disabled={!role.available}
                    >
                      {role.available ? `Sign up as ${role.title}` : "Contact Admin"}
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
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentRole = getSelectedRole()!

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
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRole("")} className="absolute left-4 top-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div
                className={`p-3 rounded-2xl ${
                  currentRole.color === "red"
                    ? "bg-gradient-to-br from-red-100 to-pink-100"
                    : currentRole.color === "green"
                      ? "bg-gradient-to-br from-green-100 to-emerald-100"
                      : "bg-gradient-to-br from-blue-100 to-cyan-100"
                }`}
              >
                <currentRole.icon
                  className={`h-8 w-8 ${
                    currentRole.color === "red"
                      ? "text-red-600"
                      : currentRole.color === "green"
                        ? "text-green-600"
                        : "text-blue-600"
                  }`}
                />
              </div>
            </div>
            <CardTitle className="text-2xl">Sign up as {currentRole.title}</CardTitle>
            <CardDescription>{currentRole.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {selectedRole === "patron" && (
                <>
                  <div>
                    <Label htmlFor="studentId">Student/Member ID</Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange("studentId", e.target.value)}
                      className="mt-1"
                      placeholder="Optional - if you're a student"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department/Field of Study</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      className="mt-1"
                      placeholder="e.g., Computer Science, Literature"
                    />
                  </div>
                </>
              )}

              {selectedRole === "librarian" && (
                <>
                  <div>
                    <Label htmlFor="libraryId">Library/Institution ID *</Label>
                    <Input
                      id="libraryId"
                      value={formData.libraryId}
                      onChange={(e) => handleInputChange("libraryId", e.target.value)}
                      required
                      className="mt-1"
                      placeholder="Your library's identification code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select onValueChange={(value) => handleInputChange("department", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your department" />
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
                  <div>
                    <Label htmlFor="reason">Reason for Librarian Access *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      required
                      className="mt-1"
                      placeholder="Please explain why you need librarian access and your role at the library"
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Role-specific notice */}
              <div
                className={`p-4 rounded-lg border ${
                  selectedRole === "patron" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {selectedRole === "patron" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${selectedRole === "patron" ? "text-green-800" : "text-yellow-800"}`}>
                      {selectedRole === "patron" ? "Instant Access" : "Approval Required"}
                    </p>
                    <p className={`text-sm ${selectedRole === "patron" ? "text-green-700" : "text-yellow-700"}`}>
                      {selectedRole === "patron"
                        ? "Your account will be activated immediately after registration."
                        : "Your application will be reviewed by an administrator. You'll receive an email notification once approved."}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full ${
                  currentRole.color === "red"
                    ? "bg-red-600 hover:bg-red-700"
                    : currentRole.color === "green"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                } transform hover:scale-105 transition-all duration-300`}
                loading={isLoading}
                loadingText="Creating Account..."
              >
                Create {currentRole.title} Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
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
