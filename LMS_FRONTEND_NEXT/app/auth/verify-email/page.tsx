import type React from "react"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { verifyEmail } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { setUserInLocalStorage, setTokens } from "@/lib/auth"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const emailParam = searchParams.get("email") || ""
  const roleParam = searchParams.get("role") || ""
  const [email, setEmail] = useState(emailParam)
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (otp.length !== 4) throw new Error("Enter the 4-digit OTP")
      const result: any = await verifyEmail({ email, otp })
      
      // Handle different flows based on role
      if (roleParam === "librarian") {
        toast({ 
          title: "Email verified successfully", 
          description: "Your registration is pending admin approval. You will receive an email once approved." 
        })
        router.push("/auth/success?type=pending")
      } else {
        // For patrons: auto-login after email verification
        if (result.user && result.accessToken && result.refreshToken) {
          // Store user and tokens
          setUserInLocalStorage(result.user)
          setTokens(result.accessToken, result.refreshToken)
          
          toast({ 
            title: "Email verified successfully", 
            description: `Welcome ${result.user.name}! Redirecting to your dashboard...` 
          })
          
          // Redirect to patron dashboard
          setTimeout(() => {
            window.location.href = "/dashboard/patron"
          }, 500)
        } else {
          // Fallback: redirect to login if tokens not provided
          toast({ 
            title: "Email verified", 
            description: "Please sign in to continue." 
          })
          router.push("/auth/login")
        }
      }
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err?.message || "Invalid or expired OTP.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              {roleParam === "librarian" 
                ? "Enter the 4‑digit OTP we sent to your email. After verification, your request will be sent for admin approval."
                : "Enter the 4‑digit OTP we sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label>OTP</Label>
                <InputOTP maxLength={4} value={otp} onChange={(v) => setOtp(v)}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Check spam if you don’t see it
                </span>
                <Link href="/auth/signup" className="inline-flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
