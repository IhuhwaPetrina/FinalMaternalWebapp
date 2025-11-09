"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"

interface VideoCallButtonProps {
  userId: string
  variant?: "default" | "outline" | "ghost"
  className?: string
}

export function VideoCallButton({ userId, variant = "default", className }: VideoCallButtonProps) {
  const router = useRouter()

  const handleVideoCall = () => {
    console.log("🎬 STARTING VIDEO CALL TO:", userId)
    router.push(`/video-call/${userId}`)
  }

  return (
    <Button variant={variant} onClick={handleVideoCall} className={className}>
      <Video className="mr-2 h-4 w-4" />
      Video Call
    </Button>
  )
}