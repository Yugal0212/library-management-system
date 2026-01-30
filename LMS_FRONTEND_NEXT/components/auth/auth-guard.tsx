"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import type { AuthUser } from "@/lib/auth"
import { Spinner } from "@/components/ui/spinner"
import { Shield, Lock, UserCheck } from "lucide-react"
import NoSSR from "@/components/ui/no-ssr"

type Props = {
  children: React.ReactNode
  allowed?: AuthUser["role"][]
}

function AuthGuardInner({ children, allowed }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (isLoading) return
    
    if (!user) {
      setRedirecting(true)
      // no user → send to login and preserve intended path
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : ""
      router.push(`/auth/login${next}`)
      return
    }
    
    if (allowed && !allowed.includes(user.role)) {
      setRedirecting(true)
      // role not allowed → send to role home
      const targetPath = user.role === "ADMIN"
        ? "/dashboard/admin"
        : user.role === "LIBRARIAN"
          ? "/dashboard/librarian"
          : "/dashboard/patron"
      
      router.push(targetPath)
      return
    }
    
    // User is authorized, reset redirecting state
    setRedirecting(false)
  }, [user, isLoading, router, pathname, allowed])

  // Show loading while checking authentication or during redirect
  if (isLoading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex flex-col items-center space-y-6 p-8 max-w-md">
          {/* Animated loader container */}
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full auth-spinner"></div>
            {/* Middle ring */}
            <div className="absolute top-2 left-2 w-16 h-16 border-2 border-purple-200 border-b-purple-500 rounded-full auth-spinner-slow"></div>
            {/* Inner icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {isLoading ? (
                <Lock className="w-6 h-6 text-blue-600 auth-pulse" />
              ) : (
                <UserCheck className="w-6 h-6 text-green-600 auth-pulse" />
              )}
            </div>
          </div>
          
          {/* Loading text with animation */}
          <div className="text-center space-y-3">
            <h3 className="text-xl font-bold text-gray-800 auth-pulse">
              {isLoading ? "Verifying Your Session" : "Redirecting You"}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {isLoading 
                ? "Please wait while we securely authenticate your credentials and verify your permissions..." 
                : "Taking you to the right place based on your role and permissions..."
              }
            </p>
            
            {/* Loading dots animation */}
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full auth-loader-dot-1"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full auth-loader-dot-2"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full auth-loader-dot-3"></div>
            </div>
          </div>
          
          {/* Security badge */}
          <div className="flex items-center space-x-3 px-6 py-3 bg-white rounded-xl shadow-lg border border-gray-100">
            <Shield className="w-5 h-5 text-green-500 auth-pulse" />
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-800">Secure Authentication</div>
              <div className="text-xs text-gray-500">Protected by enterprise-grade security</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Don't render anything if user is not authenticated or not authorized
  if (!user) return null
  if (allowed && !allowed.includes(user.role)) return null
  
  // User is authenticated and authorized, render children
  return <>{children}</>
}

export default function AuthGuard({ children, allowed }: Props) {
  return (
    <NoSSR fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    }>
      <AuthGuardInner allowed={allowed}>
        {children}
      </AuthGuardInner>
    </NoSSR>
  )
}
