"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { LoginCredentials } from "@/types"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError("")

    try {
      // TODO: Replace with actual authentication API call
      console.log("Login attempt:", credentials)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate successful login
      if (credentials.email === "demo@example.com" && credentials.password === "password123") {
        // TODO: Store authentication token/session
        router.push("/dashboard")
      } else {
        throw new Error("Invalid email or password")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to PollApp
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to create and participate in polls
          </p>
        </div>
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Demo credentials: demo@example.com / password123
          </p>
        </div>
      </div>
    </div>
  )
}
