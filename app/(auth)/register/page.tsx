"use client"

import { useState } from "react"
import { RegisterForm } from "@/components/auth/register-form"
import { RegisterData } from "@/types"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true)
    setError("")

    try {
      // TODO: Replace with actual registration API call
      console.log("Registration attempt:", data)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate validation
      if (data.email === "taken@example.com") {
        throw new Error("Email is already registered")
      }

      if (data.username === "taken") {
        throw new Error("Username is already taken")
      }

      // TODO: Create user account and store authentication token/session
      router.push("/dashboard?welcome=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join PollApp
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start creating and participating in polls
          </p>
        </div>
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isLoading}
          error={error}
        />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Note: taken@example.com and username "taken" will show validation errors for demo
          </p>
        </div>
      </div>
    </div>
  )
}
