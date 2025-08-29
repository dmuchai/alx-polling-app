"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CreatePollData } from "@/types"
import { Plus, Trash2, Calendar, Users, Tag, Loader2, X } from "lucide-react"

interface CreatePollFormProps {
  onSubmit: (data: CreatePollData) => Promise<void>
  isLoading?: boolean
  error?: string
  initialData?: Partial<CreatePollData>
}

export function CreatePollForm({ onSubmit, isLoading = false, error, initialData }: CreatePollFormProps) {
  const [formData, setFormData] = useState<CreatePollData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    options: initialData?.options || ["", ""],
    allowMultipleVotes: initialData?.allowMultipleVotes || false,
    requireAuth: initialData?.requireAuth || false,
    expiresAt: initialData?.expiresAt || undefined,
    category: initialData?.category || "",
    tags: initialData?.tags || [],
  })

  const [newTag, setNewTag] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = "Poll title is required"
    } else if (formData.title.trim().length < 5) {
      errors.title = "Poll title must be at least 5 characters"
    }

    const validOptions = formData.options.filter(option => option.trim().length > 0)
    if (validOptions.length < 2) {
      errors.options = "At least 2 options are required"
    } else if (validOptions.length > 10) {
      errors.options = "Maximum 10 options allowed"
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(option => option.trim().toLowerCase())
    if (new Set(optionTexts).size !== optionTexts.length) {
      errors.options = "Options must be unique"
    }

    // Validate expiration date
    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      errors.expiresAt = "Expiration date must be in the future"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Filter out empty options
    const cleanedData: CreatePollData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      options: formData.options.filter(option => option.trim().length > 0),
      category: formData.category || undefined,
      tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
    }

    try {
      await onSubmit(cleanedData)
    } catch (err) {
      console.error("Create poll error:", err)
    }
  }

  const handleInputChange = (field: keyof CreatePollData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [field]: value })

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" })
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })

    if (validationErrors.options) {
      setValidationErrors({ ...validationErrors, options: "" })
    }
  }

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, ""]
      })
    }
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData({ ...formData, options: newOptions })
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim()) && formData.tags!.length < 5) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create New Poll</CardTitle>
        <CardDescription>
          Create an engaging poll to gather opinions and insights from your audience
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Poll Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="What's your question?"
              value={formData.title}
              onChange={handleInputChange("title")}
              className={validationErrors.title ? "border-red-500" : ""}
              disabled={isLoading}
              maxLength={200}
            />
            {validationErrors.title && (
              <p className="text-xs text-red-600">{validationErrors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Poll Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              placeholder="Provide additional context or details about your poll..."
              value={formData.description || ""}
              onChange={handleInputChange("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              disabled={isLoading}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.description || "").length}/500 characters
            </p>
          </div>

          {/* Poll Options */}
          <div className="space-y-2">
            <Label>Poll Options *</Label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full"
                      disabled={isLoading}
                      maxLength={100}
                    />
                  </div>
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={isLoading}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>
            {validationErrors.options && (
              <p className="text-xs text-red-600">{validationErrors.options}</p>
            )}
          </div>

          {/* Poll Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Poll Settings</Label>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowMultipleVotes"
                  checked={formData.allowMultipleVotes}
                  onChange={handleInputChange("allowMultipleVotes")}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  disabled={isLoading}
                />
                <Label htmlFor="allowMultipleVotes" className="text-sm font-normal">
                  Allow multiple votes per person
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requireAuth"
                  checked={formData.requireAuth}
                  onChange={handleInputChange("requireAuth")}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  disabled={isLoading}
                />
                <Label htmlFor="requireAuth" className="text-sm font-normal">
                  Require authentication to vote
                </Label>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              type="text"
              placeholder="e.g., Politics, Sports, Technology"
              value={formData.category || ""}
              onChange={handleInputChange("category")}
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || (formData.tags && formData.tags.length >= 5)}
                maxLength={20}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim() || isLoading || (formData.tags && formData.tags.length >= 5)}
              >
                <Tag className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={isLoading}
                      className="hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.tags?.length || 0}/5 tags
            </p>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ""}
              onChange={(e) => setFormData({
                ...formData,
                expiresAt: e.target.value ? new Date(e.target.value) : undefined
              })}
              className={validationErrors.expiresAt ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {validationErrors.expiresAt && (
              <p className="text-xs text-red-600">{validationErrors.expiresAt}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty for polls that never expire
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Save as Draft
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Poll
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By creating this poll, you agree to our Terms of Service and Community Guidelines
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
