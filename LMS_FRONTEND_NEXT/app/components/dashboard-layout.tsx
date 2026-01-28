"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  BookOpen,
  Menu,
  X,
  Home,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  BarChart3,
  FileText,
  Calendar,
  Star,
  TrendingUp,
  Shield,
  ChevronDown,
  User,
  HelpCircle,
  Library,
  DollarSign,
  Package,
  AlertTriangle,
  UserPlus,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/hooks/use-current-user"
import { logout, mapRoleToPath } from "@/lib/api"
import { PageLoading } from "@/components/ui/page-loading"
import { LoadingProgress } from "@/components/ui/loading-progress"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "admin" | "librarian" | "patron"
  userName?: string
}

export default function DashboardLayout({ children, userRole, userName = "Demo User" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useCurrentUser()

  useEffect(() => {
    setIsMounted(true)
    // Immediate content display
    setIsLoaded(true)
  }, [])

  // Handle navigation loading
  useEffect(() => {
    // Immediately reset navigation loading on pathname change
    setIsNavigating(false)
  }, [pathname])

  useEffect(() => {
    // Redirect to correct role dashboard when logged-in role and path segment mismatch
    if (!user) return
    const rolePath = mapRoleToPath(user.role)
    const parts = pathname.split("/")
    const roleSeg = parts[2] // /dashboard/{role}/...
    if (parts[1] === "dashboard" && roleSeg && roleSeg !== rolePath) {
      router.replace(`/dashboard/${rolePath}`)
    }
  }, [user, pathname, router])

  const effectiveName = user?.name || userName
  const effectiveRole: "admin" | "librarian" | "patron" = user ? 
    (mapRoleToPath(user.role) as "admin" | "librarian" | "patron") : userRole

  const handleLogout = async () => {
    try {
      await logout()
    } catch (_) {
      // ignore
    } finally {
      router.push("/auth/login")
    }
  }

  const getNavigationItems = () => {
    const baseItems = [{ name: "Dashboard", href: `/dashboard/${effectiveRole}`, icon: Home }]

    switch (effectiveRole) {
      case "admin":
        return [
          ...baseItems,
          { name: "Users Management", href: `/dashboard/${effectiveRole}/users`, icon: Users },
          { name: "Books Management", href: `/dashboard/${effectiveRole}/books`, icon: Library },
          { name: "System Analytics", href: `/dashboard/${effectiveRole}/analytics`, icon: BarChart3 },
          { name: "Fines Management", href: `/dashboard/${effectiveRole}/fines`, icon: DollarSign },
          { name: "Librarian Requests", href: `/dashboard/${effectiveRole}/librarian-requests`, icon: Shield },
          { name: "Profile", href: `/dashboard/${effectiveRole}/profile`, icon: User },
          { name: "System Settings", href: `/dashboard/${effectiveRole}/settings`, icon: Settings },
        ]
      case "librarian":
        return [
          ...baseItems,
          { name: "Books", href: `/dashboard/${effectiveRole}/books`, icon: Library },
          { name: "Circulation", href: `/dashboard/${effectiveRole}/circulation`, icon: TrendingUp },
          { name: "Reservations", href: `/dashboard/${effectiveRole}/reservations`, icon: Calendar },
          { name: "Patron Management", href: `/dashboard/${effectiveRole}/patron-management`, icon: UserPlus },
          { name: "Overdue Management", href: `/dashboard/${effectiveRole}/overdue-management`, icon: AlertTriangle },
          { name: "Fines", href: `/dashboard/${effectiveRole}/fines`, icon: DollarSign },
          { name: "Profile", href: `/dashboard/${effectiveRole}/profile`, icon: User },
        ]
      case "patron":
        return [
          ...baseItems,
          { name: "Browse Books", href: `/dashboard/${effectiveRole}/browse`, icon: BookOpen },
          { name: "My Books", href: `/dashboard/${effectiveRole}/my-books`, icon: Star },
          { name: "Reservations", href: `/dashboard/${effectiveRole}/reservations`, icon: Calendar },
          { name: "Fines", href: `/dashboard/${effectiveRole}/fines`, icon: DollarSign },
          { name: "Profile", href: `/dashboard/${effectiveRole}/profile`, icon: User },
        ]
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  const getRoleColor = () => {
    switch (effectiveRole) {
      case "admin":
        return "bg-gradient-to-r from-red-600 to-pink-600"
      case "librarian":
        return "bg-gradient-to-r from-green-600 to-emerald-600"
      case "patron":
        return "bg-gradient-to-r from-blue-600 to-cyan-600"
      default:
        return "bg-gradient-to-r from-gray-600 to-gray-700"
    }
  }

  const getRoleBadgeColor = () => {
    switch (effectiveRole) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "librarian":
        return "bg-green-100 text-green-800 border-green-200"
      case "patron":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleIcon = () => {
    switch (effectiveRole) {
      case "admin":
        return Shield
      case "librarian":
        return BookOpen
      case "patron":
        return Users
      default:
        return User
    }
  }

  const RoleIcon = getRoleIcon()

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden mobile-container">
      {/* Global Loading Progress Bar */}
      <LoadingProgress isLoading={isNavigating} />
      
      {/* Sidebar - Fixed positioning for better control */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto`}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between h-16 px-6 ${getRoleColor()} relative overflow-hidden`}>
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>

          <Link href="/" className="flex items-center space-x-3 relative z-10">
            <div className="relative">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Library className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-xl font-bold text-white">EduLibrary Pro</span>
          </Link>
          <button
            className="lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition-colors relative z-10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className={`${"w-12 h-12 rounded-xl"} ${getRoleColor()} flex items-center justify-center shadow-lg`}>
              <RoleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{effectiveName}</p>
              <Badge variant="outline" className={`text-xs ${getRoleBadgeColor()} mt-1`}>
                {effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? `${getRoleColor()} text-white shadow-lg transform scale-105`
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                } ${isLoaded ? `animate-fade-in-up` : "opacity-0"}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <IconComponent
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? "animate-pulse" : "group-hover:scale-110"
                  }`}
                />
                <span className="font-medium">{item.name}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
            onClick={() => {}}
          >
            <HelpCircle className="h-5 w-5 mr-3" />
            Help & Support
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 relative z-10 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span className="capitalize">{effectiveRole}</span>
              <span>/</span>
              <span className="text-gray-900 font-medium capitalize">
                {pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-3 sm:mx-6 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search books, members, or anything..."
                className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white transition-colors duration-200"
              />
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative transition-colors duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className={`${"w-8 h-8 rounded-lg"} ${getRoleColor()} flex items-center justify-center`}>
                    <RoleIcon className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`${"w-10 h-10 rounded-lg"} ${getRoleColor()} flex items-center justify-center`}>
                      <RoleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{effectiveName}</p>
                      <p className="text-sm text-gray-600">{user?.email || 'user@example.com'}</p>
                      <p className="text-xs text-gray-500 capitalize">{effectiveRole} Account</p>
                    </div>
                  </div>
                  {user?.isVerified === false && (
                    <div className="mt-2 px-2 py-1 bg-yellow-100 rounded text-xs text-yellow-800">
                      Email not verified
                    </div>
                  )}
                </div>
                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/${effectiveRole}/profile`} className="flex items-center w-full">
                      <User className="h-4 w-4 mr-3" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-3" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="h-4 w-4 mr-3" />
                    Help & Support
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 relative pb-8 sm:pb-6 mobile-safe-area">
          <div className="opacity-100 min-h-full">
            {children}
          </div>
          {isNavigating && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
              <PageLoading text="Loading page..." variant="spinner" size="lg" />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
