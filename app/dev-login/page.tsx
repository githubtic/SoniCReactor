"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AudioWaveformIcon as Waveform, AlertCircle } from "lucide-react"

export default function DevLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleDevLogin = async () => {
    setIsLoading(true)
    setError(null)
    setMessage("Attempting dev login...")

    try {
      const response = await fetch("/api/auth/dev-login")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to perform dev login")
      }

      setMessage(data.message || "Login successful! Redirecting...")

      // Redirect after a short delay
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard")
      }, 1000)
    } catch (error: any) {
      console.error("Dev login error:", error)
      setError(error.message || "An error occurred during dev login")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-trigger the dev login when the page loads
  useEffect(() => {
    handleDevLogin()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Waveform className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Development Login</CardTitle>
          <CardDescription className="text-center">
            Automatically logging you in with development credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-sm text-muted-foreground">Logging in...</p>
              </div>
            ) : error ? (
              <Button onClick={handleDevLogin} className="mt-2">
                Try Again
              </Button>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">
            This is a development-only feature and should not be used in production.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
