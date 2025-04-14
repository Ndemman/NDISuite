"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

export default function PasswordResetPage() {
  const { requestPasswordReset, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Email is required")
      return
    }

    try {
      await requestPasswordReset(email)
      setIsSubmitted(true)
    } catch (err) {
      setError("Failed to request password reset. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        ) : (
          <div className="text-center p-4 space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-green-700 dark:text-green-300">
                If an account exists with the email {email}, you will receive a password reset link shortly.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsSubmitted(false)}
            >
              Request again
            </Button>
          </div>
        )}

        <div className="text-center">
          <Link href="/login" className="text-sm flex items-center justify-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
