"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Users, Shield, ArrowRight, CheckCircle, Sparkles, Library, Zap, Award, Globe, Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  // Static particle positions to avoid hydration mismatch
  const particles = [
    { left: 10, top: 20, delay: 0.5, duration: 4 },
    { left: 30, top: 60, delay: 1.2, duration: 5 },
    { left: 70, top: 10, delay: 0.8, duration: 3.5 },
    { left: 85, top: 40, delay: 1.8, duration: 4.5 },
    { left: 15, top: 80, delay: 0.3, duration: 3.8 },
    { left: 45, top: 25, delay: 1.5, duration: 4.2 },
    { left: 65, top: 75, delay: 0.7, duration: 3.6 },
    { left: 90, top: 55, delay: 1.1, duration: 4.8 },
    { left: 25, top: 45, delay: 0.9, duration: 3.9 },
    { left: 55, top: 15, delay: 1.6, duration: 4.1 },
    { left: 75, top: 65, delay: 0.4, duration: 3.7 },
    { left: 35, top: 85, delay: 1.3, duration: 4.3 },
    { left: 5, top: 35, delay: 0.6, duration: 3.4 },
    { left: 50, top: 70, delay: 1.7, duration: 4.6 },
    { left: 80, top: 25, delay: 0.2, duration: 3.3 },
    { left: 20, top: 90, delay: 1.4, duration: 4.4 },
    { left: 60, top: 5, delay: 0.1, duration: 3.2 },
    { left: 40, top: 50, delay: 1.9, duration: 4.7 },
    { left: 95, top: 80, delay: 0.8, duration: 3.1 },
    { left: 12, top: 15, delay: 1.0, duration: 4.9 },
  ]

  useEffect(() => {
    setIsVisible(true)

    // Simple parallax scroll effect
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const features = [
    {
      icon: Shield,
      title: "Admin Control",
      description: "Complete system management with advanced analytics and user control",
      color: "from-red-500 to-pink-500",
      delay: "delay-100",
    },
    {
      icon: BookOpen,
      title: "Librarian Tools",
      description: "Comprehensive book and member management with circulation control",
      color: "from-green-500 to-emerald-500",
      delay: "delay-200",
    },
    {
      icon: Users,
      title: "Patron Portal",
      description: "Easy book discovery, reservations, and account management",
      color: "from-blue-500 to-cyan-500",
      delay: "delay-300",
    },
  ]

  const stats = [
    { number: "100K+", label: "Books Available", icon: "📚" },
    { number: "25K+", label: "Active Members", icon: "👥" },
    { number: "99.9%", label: "System Uptime", icon: "⚡" },
    { number: "24/7", label: "Support Available", icon: "🛟" },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden relative">
      {/* Enhanced Wave Background with Multiple Layers */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>

        {/* Animated Wave Layers */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1">
                <animate attributeName="stop-opacity" values="0.1;0.2;0.1" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.15">
                <animate attributeName="stop-opacity" values="0.15;0.25;0.15" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1">
                <animate attributeName="stop-opacity" values="0.1;0.2;0.1" dur="4s" repeatCount="indefinite" />
              </stop>
            </linearGradient>

            <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08">
                <animate attributeName="stop-opacity" values="0.08;0.18;0.08" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12">
                <animate attributeName="stop-opacity" values="0.12;0.22;0.12" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.08">
                <animate attributeName="stop-opacity" values="0.08;0.18;0.08" dur="6s" repeatCount="indefinite" />
              </stop>
            </linearGradient>

            <linearGradient id="wave3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.06">
                <animate attributeName="stop-opacity" values="0.06;0.16;0.06" dur="8s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.1">
                <animate attributeName="stop-opacity" values="0.1;0.2;0.1" dur="8s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.06">
                <animate attributeName="stop-opacity" values="0.06;0.16;0.06" dur="8s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>

          {/* Multiple animated wave paths */}
          <path
            d="M0,400 C300,300 600,500 900,400 C1050,350 1150,450 1200,400 L1200,800 L0,800 Z"
            fill="url(#wave1)"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 50,20; 0,0"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M0,500 C300,600 600,400 900,500 C1050,550 1150,450 1200,500 L1200,800 L0,800 Z"
            fill="url(#wave2)"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -30,15; 0,0"
              dur="12s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M0,600 C300,500 600,700 900,600 C1050,650 1150,550 1200,600 L1200,800 L0,800 Z"
            fill="url(#wave3)"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 40,25; 0,0"
              dur="14s"
              repeatCount="indefinite"
            />
          </path>
        </svg>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                transform: `translateY(${scrollY * 0.1}px)`,
              }}
            />
          ))}
        </div>

        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-white/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div
              className={`flex items-center space-x-4 transition-all duration-1000 ease-out ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
              }`}
            >
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="relative group">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Library className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="h-2 w-2 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                  </div>
                  <div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      EduLibrary Pro
                    </span>
                    <div className="flex items-center space-x-1 mt-1">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600 font-medium">Premium Edition</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            <div
              className={`hidden md:flex items-center space-x-8 transition-all duration-1000 delay-300 ease-out ${
                isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
              }`}
            >
              <Link
                href="#features"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105 font-medium relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="#solutions"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105 font-medium relative group"
              >
                Solutions
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105 font-medium relative group"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="#contact"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105 font-medium relative group"
              >
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group">
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="outline"
                    className="border-indigo-200 hover:bg-indigo-50 transform hover:scale-105 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[540px] overflow-y-auto">
                  <div className="flex flex-col space-y-6 mt-8">
                    <div className="flex flex-col space-y-4">
                      <Link
                        href="#features"
                        className="text-lg font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        Features
                      </Link>
                      <Link
                        href="#solutions"
                        className="text-lg font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        Solutions
                      </Link>
                      <Link
                        href="#pricing"
                        className="text-lg font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        Pricing
                      </Link>
                      <Link
                        href="#contact"
                        className="text-lg font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        Contact
                      </Link>
                    </div>
                    
                    <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100">
                      <Link href="/auth/login" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/signup" className="w-full">
                        <Button variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50 text-indigo-700">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-6xl mx-auto">
            <div
              className={`transition-all duration-1000 delay-500 ease-out ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-100/80 via-purple-100/80 to-pink-100/80 backdrop-blur-sm rounded-full text-sm font-medium text-indigo-700 mb-8 shadow-lg border border-white/20 group hover:shadow-xl transition-all duration-300">
                <Globe className="h-4 w-4 mr-2 text-green-600 animate-spin" style={{ animationDuration: "3s" }} />
                Trusted by 5000+ Educational Institutions Worldwide
                <Zap className="h-4 w-4 ml-2 text-yellow-500 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
              </div>

              <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 leading-tight">
                <span className="inline-block animate-fade-in-up">Next-Generation</span>
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in-up delay-200 relative">
                  Library Management
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-xl opacity-0 animate-pulse delay-1000"></div>
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto animate-fade-in-up delay-400">
                Transform your educational institution with{" "}
                <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  EduLibrary Pro
                </span>{" "}
                - the most advanced, AI-powered library management system designed for modern universities, colleges,
                and schools worldwide.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up delay-600">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold border-2 border-indigo-200 hover:bg-indigo-50 transform hover:scale-105 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-lg group relative overflow-hidden"
                  >
                    <span className="relative z-10">Watch Demo</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-70 animate-fade-in-up delay-800">
                <div className="text-sm text-gray-600 font-medium">Trusted by:</div>
                {[
                  { name: "MIT", color: "blue", full: "MIT Libraries" },
                  { name: "H", color: "red", full: "Harvard University" },
                  { name: "S", color: "green", full: "Stanford Libraries" },
                ].map((institution, index) => (
                  <div
                    key={institution.name}
                    className="flex items-center space-x-2 group cursor-pointer"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div
                      className={`w-8 h-8 bg-${institution.color}-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <span className={`text-xs font-bold text-${institution.color}-600`}>{institution.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                      {institution.full}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Cards Animation */}
          <div className="relative mt-24">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={feature.title}
                    className={`transform transition-all duration-1000 ${feature.delay} ease-out ${
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                    }`}
                  >
                    <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 bg-white/90 backdrop-blur-sm hover:bg-white/95 group relative overflow-hidden">
                      {/* Card Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                      <CardHeader className="text-center pb-4 relative z-10">
                        <div
                          className={`mx-auto p-4 rounded-2xl bg-gradient-to-br ${feature.color} w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative overflow-hidden`}
                        >
                          <IconComponent className="h-8 w-8 text-white relative z-10" />
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <CardDescription className="text-center text-gray-600 leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Enhanced Wave Separator */}
        <div className="relative mt-20">
          <svg className="w-full h-40" viewBox="0 0 1200 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradientMain" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9">
                  <animate attributeName="stop-opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="25%" stopColor="#8b5cf6" stopOpacity="0.8">
                  <animate attributeName="stop-opacity" values="0.8;0.9;0.8" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9">
                  <animate attributeName="stop-opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="75%" stopColor="#10b981" stopOpacity="0.8">
                  <animate attributeName="stop-opacity" values="0.8;0.9;0.8" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9">
                  <animate attributeName="stop-opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
            <path
              d="M0,80 C300,140 600,20 900,80 C1050,110 1150,50 1200,80 L1200,160 L0,160 Z"
              fill="url(#waveGradientMain)"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 20,10; 0,0"
                dur="6s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M0,100 C300,40 600,120 900,60 C1050,30 1150,90 1200,60 L1200,160 L0,160 Z"
              fill="url(#waveGradientMain)"
              fillOpacity="0.6"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; -15,8; 0,0"
                dur="8s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>

        {/* Enhanced Statistics Section */}
        <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
            {/* Animated background elements */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold text-white mb-6 animate-fade-in-up">Powering Education Worldwide</h2>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto animate-fade-in-up delay-200">
                Join thousands of educational institutions that trust EduLibrary Pro for their library management needs
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`text-center transform transition-all duration-1000 delay-${index * 150} ease-out ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  }`}
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div
                      className="text-7xl mb-6 animate-bounce relative z-10"
                      style={{ animationDelay: `${index * 0.3}s` }}
                    >
                      {stat.icon}
                    </div>
                    <div className="text-6xl font-bold text-white mb-3 animate-pulse relative z-10">{stat.number}</div>
                    <div className="text-indigo-200 text-lg font-medium relative z-10">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">How EduLibrary Pro Works</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up delay-200">
                Intelligent role-based access system designed specifically for educational institutions
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Enhanced Role Cards */}
                <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-white group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardHeader className="text-center">
                    <div className="mx-auto p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                      <Users className="h-10 w-10 text-white relative z-10" />
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardTitle className="text-blue-600 text-xl group-hover:text-blue-700 transition-colors duration-300">
                      For Students & Faculty
                    </CardTitle>
                    <CardDescription className="text-gray-600">Library Members & Researchers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "Instant self-registration with student ID",
                      "AI-powered book recommendations",
                      "Digital library access & e-books",
                      "Research collaboration tools",
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300"
                      >
                        <CheckCircle
                          className="h-4 w-4 text-green-500 mr-2 animate-pulse"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 hover:border-green-400 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-white group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardHeader className="text-center">
                    <div className="mx-auto p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                      <BookOpen className="h-10 w-10 text-white relative z-10" />
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardTitle className="text-green-600 text-xl group-hover:text-green-700 transition-colors duration-300">
                      For Librarians
                    </CardTitle>
                    <CardDescription className="text-gray-600">Library Staff & Managers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "Advanced catalog management system",
                      "Automated circulation workflows",
                      "Real-time analytics dashboard",
                      "Mobile app for on-the-go management",
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300"
                      >
                        <CheckCircle
                          className="h-4 w-4 text-green-500 mr-2 animate-pulse"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-2 border-red-200 hover:border-red-400 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 bg-gradient-to-br from-red-50 to-white group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardHeader className="text-center">
                    <div className="mx-auto p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                      <Shield className="h-10 w-10 text-white relative z-10" />
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardTitle className="text-red-600 text-xl group-hover:text-red-700 transition-colors duration-300">
                      For Administrators
                    </CardTitle>
                    <CardDescription className="text-gray-600">System Administrators & IT</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "Enterprise-grade security & compliance",
                      "Multi-campus management",
                      "Advanced reporting & insights",
                      "API integrations & customization",
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300"
                      >
                        <CheckCircle
                          className="h-4 w-4 text-green-500 mr-2 animate-pulse"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-24 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-5xl font-bold text-white mb-8 animate-fade-in-up">Ready to Transform Your Library?</h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto animate-fade-in-up delay-200">
              Join over 5,000 educational institutions worldwide that trust EduLibrary Pro to streamline their library
              operations and enhance student learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up delay-400">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-12 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl group relative overflow-hidden"
                >
                  <span className="relative z-10">Start Your Free Trial</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-gray-900 px-12 py-4 text-lg transform hover:scale-105 transition-all duration-300 bg-transparent group relative overflow-hidden"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="bg-gray-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Library className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">EduLibrary Pro</span>
                    <div className="flex items-center space-x-1">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-400">Premium Edition</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed mb-6">
                  The world's most advanced library management system designed specifically for educational
                  institutions. Trusted by universities, colleges, and schools worldwide.
                </p>
                <div className="flex space-x-4">
                  {[
                    { name: "f", color: "blue-600", hoverColor: "blue-700" },
                    { name: "t", color: "blue-400", hoverColor: "blue-500" },
                    { name: "in", color: "blue-700", hoverColor: "blue-800" },
                  ].map((social, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 bg-${social.color} rounded-full flex items-center justify-center hover:bg-${social.hoverColor} transition-colors cursor-pointer transform hover:scale-110 duration-300`}
                    >
                      <span className="text-xs font-bold">{social.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-lg">Product</h3>
                <ul className="space-y-3 text-gray-400">
                  {["Features", "Pricing", "Security", "Integrations", "API"].map((item, index) => (
                    <li key={index}>
                      <Link
                        href="#"
                        className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-lg">Solutions</h3>
                <ul className="space-y-3 text-gray-400">
                  {["Universities", "Colleges", "Schools", "Public Libraries", "Enterprise"].map((item, index) => (
                    <li key={index}>
                      <Link
                        href="#"
                        className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-lg">Support</h3>
                <ul className="space-y-3 text-gray-400">
                  {["Documentation", "Help Center", "Contact Us", "Training", "Status"].map((item, index) => (
                    <li key={index}>
                      <Link
                        href="#"
                        className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>
                &copy; 2024 EduLibrary Pro. All rights reserved. Made with ❤️ for educational institutions worldwide.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
