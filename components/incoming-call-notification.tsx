"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, PhoneOff } from "lucide-react"

interface IncomingCallNotificationProps {
  callerName: string
  callerImage?: string
  onAccept: () => void
  onReject: () => void
  ringtoneRef?: React.RefObject<HTMLAudioElement | null>
}

export function IncomingCallNotification({
  callerName,
  callerImage,
  onAccept,
  onReject,
  ringtoneRef,
}: IncomingCallNotificationProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = ringtoneRef?.current || audioRef.current
    if (audio) {
      audio.loop = true
      audio.play().catch((error) => {
        console.log("[v0] Could not play ringtone:", error)
      })
    }

    return () => {
      const audio = ringtoneRef?.current || audioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [ringtoneRef])

  return (
    <>
      <audio
        ref={audioRef}
        loop
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
      />

      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
        <Card className="w-full max-w-sm mx-4 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-in scale-in duration-300">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-2 ring-blue-500">
                  <AvatarImage src={callerImage || "/placeholder.svg"} alt={callerName} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {callerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse"></div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">{callerName}</h2>
                <p className="text-sm text-slate-400 mt-1">Incoming video call...</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={onReject}
                variant="destructive"
                className="flex-1 h-12 rounded-full gap-2 bg-red-500 hover:bg-red-600 transition-all duration-200"
              >
                <PhoneOff className="h-5 w-5" />
                Decline
              </Button>
              <Button
                onClick={onAccept}
                className="flex-1 h-12 rounded-full gap-2 bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
              >
                <Phone className="h-5 w-5" />
                Accept
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
