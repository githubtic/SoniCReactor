"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AudioWaveformIcon as Waveform, AlertCircle } from "lucide-react"
import { parseAuthError, isEmailNotConfirmedError } from "@/lib/auth-utils"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false)
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsEmailUnconfirmed(false)
    setIsLoading(true)

    try {
      // First, try to sign in normally
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // If we get an "Email not confirmed" error
      if (signInError && isEmailNotConfirmedError(signInError)) {
        setIsEmailUnconfirmed(true)
        setError("Your email is not confirmed. Please use one of the options below.")
        setIsLoading(false)
        return
      } else if (signInError) {
        throw signInError
      }

      if (!data?.user) {
        throw new Error("No user returned from login")
      }

      // Redirect to dashboard by default (in case database query fails)
      let redirectPath = "/dashboard"

      try {
        // Try to get user role from the database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (!userError && userData?.role === "admin") {
          redirectPath = "/admin"
        }
      } catch (dbError) {
        console.error("Database error:", dbError)
        // If there's an error with the database query, still redirect to dashboard
      }

      // Redirect to appropriate page
      router.push(redirectPath)
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle network errors specifically
      if (error.message === "Failed to fetch" || error.message.includes("network")) {
        setError("Network error. Please check your internet connection and try again.")
      } else {
        setError(parseAuthError(error))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsResendingConfirmation(true)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        throw error
      }

      setSuccessMessage("Confirmation email has been resent. Please check your inbox.")
    } catch (error: any) {
      setError(parseAuthError(error))
    } finally {
      setIsResendingConfirmation(false)
    }
  }

  // This function bypasses email confirmation by using admin-level API
  // Note: This should only be used in development environments
  const handleBypassConfirmation = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      // First, try to bypass email confirmation
      const response = await fetch("/api/auth/bypass-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }).catch((err) => {
        throw new Error("Network error when contacting the server. Please check your connection.")
      })

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Now try to sign in normally
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      setSuccessMessage("Email confirmed successfully. Redirecting to dashboard...")

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("Bypass confirmation error:", error)
      setError(error.message || "Failed to bypass confirmation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Waveform className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">SonicReactor</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {isEmailUnconfirmed && (
            <div className="mt-4">
              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertDescription className="flex flex-col gap-2">
                  <span>Your email address has not been confirmed yet.</span>
                  <div className="flex flex-col gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={isResendingConfirmation}
                    >
                      {isResendingConfirmation ? "Sending..." : "Resend Confirmation Email"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBypassConfirmation} disabled={isLoading}>
                      Bypass Email Confirmation (Dev Only)
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
