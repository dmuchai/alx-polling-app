"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Poll, VoteData } from "@/types";
import {
  BarChart3,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Flag,
  Heart,
  MessageSquare,
  Share2,
  Tag,
  Users,
  Vote,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getPoll } from "@/lib/actions/polls.actions";
import { submitVote } from "@/lib/actions/voting.actions";
import { ShareModal } from "@/components/polls/modals/share-modal";

export default function PollDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const pollId = params.id as string;
  const wasJustCreated = searchParams.get("created") === "true";
  const wasJustUpdated = searchParams.get("updated") === "true";

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const pollData = await getPoll(pollId);

        // Transform the database data to match our Poll interface
        const transformedPoll: Poll = {
          id: pollData.id,
          title: pollData.title,
          description: pollData.description || undefined,
          options: pollData.options.map((option) => ({
            id: option.id,
            text: option.text,
            votes: option.votes,
            pollId: option.poll_id,
          })),
          creatorId: pollData.creator_id,
          creator: pollData.creator
            ? {
                id: pollData.creator.id,
                email: pollData.creator.email,
                username: pollData.creator.username,
                firstName: pollData.creator.first_name || undefined,
                lastName: pollData.creator.last_name || undefined,
                avatar: pollData.creator.avatar || undefined,
                createdAt: new Date(pollData.creator.created_at),
                updatedAt: new Date(pollData.creator.updated_at),
              }
            : undefined,
          isActive: pollData.is_active,
          allowMultipleVotes: pollData.allow_multiple_votes,
          requireAuth: pollData.require_auth,
          expiresAt: pollData.expires_at
            ? new Date(pollData.expires_at)
            : undefined,
          createdAt: new Date(pollData.created_at),
          updatedAt: new Date(pollData.updated_at),
          totalVotes: pollData.total_votes,
          category: pollData.category,
          tags: pollData.tags || undefined,
        };

        setPoll(transformedPoll);

        // Check if user has already voted
        const userHasVoted = localStorage.getItem(`voted_${pollId}`);
        setHasVoted(!!userHasVoted);
        setShowResults(!!userHasVoted);
      } catch (error) {
        console.error("Error fetching poll:", error);
        // Handle error appropriately
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getTimeLeft = (expiresAt?: Date) => {
    if (!expiresAt) return null;

    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const timeLeft = expiry - now;

    if (timeLeft <= 0) return "Expired";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;

    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m left`;
  };

  const getOptionPercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const handleOptionChange = (optionId: string) => {
    if (hasVoted) return;

    if (poll?.allowMultipleVotes) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0 || hasVoted) return;

    setIsVoting(true);

    try {
      const voteData: VoteData = {
        pollId: poll.id,
        optionIds: selectedOptions,
      };

      await submitVote(voteData);

      // Refresh poll data to get updated vote counts
      const updatedPollData = await getPoll(pollId);

      // Transform the updated data
      const updatedPoll: Poll = {
        id: updatedPollData.id,
        title: updatedPollData.title,
        description: updatedPollData.description || undefined,
        options: updatedPollData.options.map((option) => ({
          id: option.id,
          text: option.text,
          votes: option.votes,
          pollId: option.poll_id,
        })),
        creatorId: updatedPollData.creator_id,
        creator: updatedPollData.creator
          ? {
              id: updatedPollData.creator.id,
              email: updatedPollData.creator.email,
              username: updatedPollData.creator.username,
              firstName: updatedPollData.creator.first_name || undefined,
              lastName: updatedPollData.creator.last_name || undefined,
              avatar: updatedPollData.creator.avatar || undefined,
              createdAt: new Date(updatedPollData.creator.created_at),
              updatedAt: new Date(updatedPollData.creator.updated_at),
            }
          : undefined,
        isActive: updatedPollData.is_active,
        allowMultipleVotes: updatedPollData.allow_multiple_votes,
        requireAuth: updatedPollData.require_auth,
        expiresAt: updatedPollData.expires_at
          ? new Date(updatedPollData.expires_at)
          : undefined,
        createdAt: new Date(updatedPollData.created_at),
        updatedAt: new Date(updatedPollData.updated_at),
        totalVotes: updatedPollData.total_votes,
        category: updatedPollData.category,
        tags: updatedPollData.tags || undefined,
      };

      setPoll(updatedPoll);
      setHasVoted(true);
      setShowResults(true);

      // Store vote locally for UI state
      localStorage.setItem(`voted_${pollId}`, "true");
    } catch (error) {
      console.error("Voting error:", error);
      // You might want to show an error toast here
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const isExpired = poll?.expiresAt && new Date(poll.expiresAt) < new Date();
  const canVote = poll?.isActive && !isExpired && !hasVoted;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Poll not found
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              This poll may have been deleted or the link is incorrect.
            </p>
            <Button asChild>
              <Link href="/polls">Browse All Polls</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success message for newly created polls */}
        {wasJustCreated && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Poll created successfully!
                </p>
                <p className="text-xs text-green-700">
                  Share the link to start collecting votes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success message for updated polls */}
        {wasJustUpdated && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Poll updated successfully!
                </p>
                <p className="text-xs text-blue-700">
                  Your changes have been saved.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Poll Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl leading-tight mb-2">
                  {poll.title}
                </CardTitle>
                {poll.description && (
                  <CardDescription className="text-base">
                    {poll.description}
                  </CardDescription>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </Button>
              </div>
            </div>

            {/* Poll metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{poll.totalVotes} votes</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(poll.createdAt)}</span>
              </div>
              {poll.expiresAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeLeft(poll.expiresAt)}</span>
                </div>
              )}
              {poll.creator && (
                <div>
                  by{" "}
                  <Link
                    href={`/users/${poll.creator.username}`}
                    className="text-primary hover:underline"
                  >
                    {poll.creator.username}
                  </Link>
                </div>
              )}
            </div>

            {/* Tags and status */}
            <div className="flex flex-wrap items-center gap-2">
              {poll.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {poll.category}
                </span>
              )}
              {poll.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </span>
              ))}
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
              {poll.requireAuth && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                  Auth Required
                </span>
              )}
              {poll.allowMultipleVotes && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                  Multiple Votes
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Voting Interface / Results */}
            <div className="space-y-4">
              {poll.options.map((option) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {canVote && (
                        <input
                          type={poll.allowMultipleVotes ? "checkbox" : "radio"}
                          name={`poll-${poll.id}`}
                          value={option.id}
                          checked={selectedOptions.includes(option.id)}
                          onChange={() => handleOptionChange(option.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          disabled={isVoting}
                        />
                      )}
                      <label className="text-sm font-medium flex-1 cursor-pointer">
                        {option.text}
                      </label>
                    </div>

                    {showResults && (
                      <div className="text-sm text-muted-foreground text-right">
                        <div className="font-medium">{option.votes} votes</div>
                        <div className="text-xs">
                          {getOptionPercentage(option.votes)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {showResults && (
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${getOptionPercentage(option.votes)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vote button */}
            {canVote && selectedOptions.length > 0 && (
              <div className="mt-6">
                <Button
                  onClick={handleVote}
                  className="w-full"
                  disabled={isVoting}
                >
                  {isVoting ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Vote className="mr-2 h-4 w-4" />
                      Submit Vote{selectedOptions.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Results toggle */}
            {hasVoted && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResults(!showResults)}
                >
                  {showResults ? "Hide Results" : "Show Results"}
                </Button>
              </div>
            )}

            {/* Vote status messages */}
            {hasVoted && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Thanks for voting! Your response has been recorded.
                </p>
              </div>
            )}

            {!canVote && !hasVoted && isExpired && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  This poll has expired and is no longer accepting votes.
                </p>
              </div>
            )}

            {!canVote && !hasVoted && !poll.isActive && !isExpired && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-800">
                  This poll is currently inactive and not accepting votes.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Heart className="mr-2 h-4 w-4" />
                  Like
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comments
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Embed
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Related Polls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              More from {poll.creator?.username}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placeholder for related polls */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Best JavaScript Framework?</h4>
                <p className="text-sm text-muted-foreground">
                  234 votes • 2 days ago
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Preferred Code Editor?</h4>
                <p className="text-sm text-muted-foreground">
                  567 votes • 5 days ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          poll={{
            id: poll.id,
            title: poll.title,
            description: poll.description,
            slug: poll.id, // Using poll.id as slug since we don't have a separate slug field
          }}
        />
      </div>
    </div>
  );
}
