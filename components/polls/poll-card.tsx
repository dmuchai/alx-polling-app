"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Poll, PollCardProps } from "@/types"
import { BarChart3, Calendar, Edit, Eye, MoreHorizontal, Share2, Trash2, Users, Vote } from "lucide-react"
import Link from "next/link"

export function PollCard({
  poll,
  showActions = false,
  onVote,
  onEdit,
  onDelete
}: PollCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date()
  const canVote = poll.isActive && !isExpired

  const handleOptionChange = (optionId: string) => {
    if (poll.allowMultipleVotes) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleVote = () => {
    if (selectedOptions.length > 0 && onVote) {
      onVote(poll.id, selectedOptions)
      setSelectedOptions([])
    }
  }

  const getOptionPercentage = (votes: number) => {
    return poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight mb-1">
              <Link
                href={`/polls/${poll.id}`}
                className="hover:text-primary transition-colors"
              >
                {poll.title}
              </Link>
            </CardTitle>
            {poll.description && (
              <CardDescription className="text-sm">
                {poll.description}
              </CardDescription>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{poll.totalVotes} votes</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(poll.createdAt)}</span>
          </div>
          {poll.creator && (
            <span>by {poll.creator.username}</span>
          )}
        </div>

        {poll.category && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {poll.category}
            </span>
            {!poll.isActive && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Inactive
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                Expired
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="py-3">
        <div className="space-y-3">
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {canVote && onVote && (
                    <input
                      type={poll.allowMultipleVotes ? "checkbox" : "radio"}
                      name={`poll-${poll.id}`}
                      value={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onChange={() => handleOptionChange(option.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  )}
                  <label className="text-sm font-medium flex-1 cursor-pointer">
                    {option.text}
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {option.votes} ({getOptionPercentage(option.votes)}%)
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getOptionPercentage(option.votes)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {canVote && onVote && selectedOptions.length > 0 && (
          <div className="mt-4">
            <Button onClick={handleVote} className="w-full">
              <Vote className="mr-2 h-4 w-4" />
              Submit Vote{selectedOptions.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/polls/${poll.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          {showActions && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(poll)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(poll.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
