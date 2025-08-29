"use client"

import { useState } from "react"
import { CreatePollForm } from "@/components/polls/create-poll-form"
import { CreatePollData } from "@/types"
import { useRouter } from "next/navigation"

export default function CreatePollPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  const handleCreatePoll = async (data: CreatePollData) => {
    setIsLoading(true)
    setError("")

    try {
      // TODO: Replace with actual create poll API call
      console.log("Creating poll:", data)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate validation
      if (data.title.toLowerCase().includes('inappropriate')) {
        throw new Error("Poll content violates our community guidelines")
      }

      // TODO: Make actual API call to create poll
      const pollId = `poll_${Date.now()}` // Mock poll ID

      // Redirect to the newly created poll
      router.push(`/polls/${pollId}?created=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while creating the poll")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a New Poll
          </h1>
          <p className="text-gray-600">
            Gather opinions and insights from your community
          </p>
        </div>

        <CreatePollForm
          onSubmit={handleCreatePoll}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Pro Tips for Better Polls
            </h3>
            <ul className="text-xs text-blue-800 space-y-1 text-left">
              <li>• Keep your question clear and specific</li>
              <li>• Provide balanced and comprehensive options</li>
              <li>• Consider setting an expiration date for time-sensitive topics</li>
              <li>• Use tags to help people discover your poll</li>
              <li>• Enable authentication if you need verified responses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
