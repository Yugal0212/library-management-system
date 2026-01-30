import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EduLibrary Pro - Advanced Library Management System",
  description:
    "The world's most advanced library management system designed for educational institutions with AI-powered features and role-based access control",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">{children}</div>
        <Toaster />
        
        {/* Vercel Analytics - Track visitors and page views */}
        <Analytics />
        
        {/* Speed Insights - Monitor Core Web Vitals and performance */}
        <SpeedInsights />
      </body>
    </html>
  )
}
