"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Download,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageSquare,
  Link2,
  QrCode,
  Check,
  Loader2,
  Share2,
} from "lucide-react";
import { generatePollQRCode, getQRCodeFilename } from "@/lib/utils/qr-code";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: {
    id: string;
    title: string;
    description?: string;
    slug?: string;
  };
}

export function ShareModal({ isOpen, onClose, poll }: ShareModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {},
  );
  const { toast } = useToast();

  // Generate poll URL
  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/polls/${poll.id}`
      : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/polls/${poll.id}`;

  const encodedUrl = encodeURIComponent(pollUrl);
  const encodedTitle = encodeURIComponent(poll.title);
  const encodedDescription = encodeURIComponent(
    poll.description || "Check out this poll!",
  );

  // Social sharing URLs
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const generateQRCode = useCallback(async () => {
    setIsGeneratingQR(true);
    try {
      // Use poll.id for QR code generation
      const qrCode = await generatePollQRCode(poll.id, {
        size: 256,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      setQrCodeDataUrl(qrCode);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  }, [poll.id, toast]);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && !qrCodeDataUrl) {
      generateQRCode();
    }
  }, [isOpen, qrCodeDataUrl, generateQRCode]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [label]: true }));
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [label]: false }));
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeDataUrl;
    link.download = getQRCodeFilename(poll.title, "png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded!",
      description: "QR code saved to your downloads",
    });
  };

  const openSocialShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  const CopyButton = ({
    text,
    label,
    className = "",
  }: {
    text: string;
    label: string;
    className?: string;
  }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, label)}
      className={className}
      disabled={copiedStates[label]}
    >
      {copiedStates[label] ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      {copiedStates[label] ? "Copied!" : "Copy"}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Poll
          </DialogTitle>
          <DialogDescription>
            Share "{poll.title}" with others
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <Link2 className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-url">Poll URL</Label>
              <div className="flex gap-2">
                <Input
                  id="poll-url"
                  value={pollUrl}
                  readOnly
                  className="flex-1"
                />
                <CopyButton text={pollUrl} label="Poll URL" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-embed">Embed Code</Label>
              <div className="flex gap-2">
                <Input
                  id="poll-embed"
                  value={`<iframe src="${pollUrl}/embed" width="100%" height="400"></iframe>`}
                  readOnly
                  className="flex-1 text-xs"
                />
                <CopyButton
                  text={`<iframe src="${pollUrl}/embed" width="100%" height="400"></iframe>`}
                  label="Embed Code"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Share via:</h4>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSocialShare("email")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSocialShare("whatsapp")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-64 h-64 flex items-center justify-center border rounded-lg bg-white">
                {isGeneratingQR ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm text-gray-500">
                      Generating QR code...
                    </span>
                  </div>
                ) : qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code for poll"
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="text-center">
                    <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">
                      QR code unavailable
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 text-center max-w-sm">
                Scan this QR code with your phone camera to quickly access the
                poll
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={downloadQRCode}
                  disabled={!qrCodeDataUrl || isGeneratingQR}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
                <CopyButton text={pollUrl} label="QR URL" className="flex-1" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => openSocialShare("twitter")}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => openSocialShare("facebook")}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => openSocialShare("linkedin")}
                className="flex items-center gap-2"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => openSocialShare("email")}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Direct Message:</h4>
              <Button
                variant="outline"
                onClick={() => openSocialShare("whatsapp")}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Copy & Paste Message:</h4>
              <div className="space-y-2">
                <textarea
                  value={`Check out this poll: "${poll.title}"\n\n${poll.description || ""}\n\nVote here: ${pollUrl}`}
                  readOnly
                  className="w-full h-24 p-2 border rounded text-sm resize-none"
                />
                <CopyButton
                  text={`Check out this poll: "${poll.title}"\n\n${poll.description || ""}\n\nVote here: ${pollUrl}`}
                  label="Message"
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
