"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon, CheckCircle2, XCircle } from "lucide-react"

export default function RegisterPage() {
  const { register, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Password strength indicators
  const hasMinLength = formData.password.length >= 8
  const hasLowercase = /[a-z]/.test(formData.password)
  const hasUppercase = /[A-Z]/.test(formData.password)
  const hasNumber = /\d/.test(formData.password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  
  const passwordStrength = [
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length

  // Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsSubmitting(false)
      return
    }

    if (passwordStrength < 3) {
      setError("Password is not strong enough")
      setIsSubmitting(false)
      return
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName
      })
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign up to access NDISuite Report Writer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading || isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading || isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading || isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading || isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading || isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Password strength meter */}
              <div className="mt-2">
                <div className="flex mb-1">
                  <div className="text-xs text-muted-foreground">Strength:</div>
                  <div className="flex ml-2 h-2 w-full max-w-[100px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-5 mx-0.5 rounded-sm ${
                          i < passwordStrength
                            ? passwordStrength < 3
                              ? "bg-destructive/80"
                              : passwordStrength < 4
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center">
                    {hasMinLength ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                    )}
                    <span className={hasMinLength ? "text-green-500" : "text-muted-foreground"}>
                      At least 8 characters
                    </span>
                  </li>
                  <li className="flex items-center">
                    {hasUppercase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                    )}
                    <span className={hasUppercase ? "text-green-500" : "text-muted-foreground"}>
                      Uppercase letter
                    </span>
                  </li>
                  <li className="flex items-center">
                    {hasLowercase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                    )}
                    <span className={hasLowercase ? "text-green-500" : "text-muted-foreground"}>
                      Lowercase letter
                    </span>
                  </li>
                  <li className="flex items-center">
                    {hasNumber ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                    )}
                    <span className={hasNumber ? "text-green-500" : "text-muted-foreground"}>
                      Number
                    </span>
                  </li>
                  <li className="flex items-center">
                    {hasSpecialChar ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                    )}
                    <span className={hasSpecialChar ? "text-green-500" : "text-muted-foreground"}>
                      Special character
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading || isSubmitting}
                required
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
