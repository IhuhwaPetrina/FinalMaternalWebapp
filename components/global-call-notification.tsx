"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { initializeSocket } from "@/lib/socket"
import { IncomingCallNotification } from "@/components/incoming-call-notification"
import { useNotifications } from "@/lib/notification-context"
import { useCall } from "@/lib/call-context"
import { useToast } from "@/hooks/use-toast"

export function GlobalCallNotification() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { addMissedCall, clearMissedCalls } = useNotifications()
  const { setPendingCall } = useCall()
  const [incomingCall, setIncomingCall] = useState<any>(null)

  useEffect(() => {
    if (!user?._id) return

    const socket = initializeSocket(user._id)

    socket.on("incoming-call", (data: any) => {
      console.log("[v0] 📞 GLOBAL INCOMING CALL NOTIFICATION:", data)
      // Only show notification if we're not already on a video call page
      if (!window.location.pathname.includes("/video-call/")) {
        setIncomingCall({
          callerId: data.from,
          callerName: `${data.callerFirstName} ${data.callerLastName}`,
          callerImage: data.callerImage,
          roomUrl: data.roomUrl,
        })
      }
    })

    socket.on("missed-call-notification", (data: any) => {
      console.log("[v0] 🔔 MISSED CALL NOTIFICATION:", data)

      addMissedCall(data.callerId)

      toast({
        title: "Missed Call",
        description: `You missed a call from ${data.callerName}`,
        duration: 5000,
      })
    })

    return () => {
      socket.off("incoming-call")
      socket.off("missed-call-notification")
    }
  }, [user, toast, addMissedCall])

  const handleAccept = () => {
    if (!incomingCall) return

    console.log("[v0] ✅ ACCEPTING CALL FROM GLOBAL NOTIFICATION")
    console.log("[v0] 📱 My user ID:", user?._id)
    console.log("[v0] 📞 Caller ID:", incomingCall.callerId)
    console.log("[v0] 🔗 Room URL:", incomingCall.roomUrl)

    setPendingCall({
      callerId: incomingCall.callerId,
      callerName: incomingCall.callerName,
      callerImage: incomingCall.callerImage,
      roomUrl: incomingCall.roomUrl,
    })

    clearMissedCalls(incomingCall.callerId)
    setIncomingCall(null)

    // Navigate to video call page
    router.push(`/video-call/${incomingCall.callerId}?incoming=true`)
  }

  const handleReject = () => {
    if (!incomingCall) return

    console.log("[v0] ❌ REJECTING CALL FROM GLOBAL NOTIFICATION")

    const socket = initializeSocket(user!._id)
    socket.emit("reject-call", {
      to: incomingCall.callerId,
      from: user!._id,
    })

    setIncomingCall(null)
    addMissedCall(incomingCall.callerId)
  }

  if (!incomingCall) return null

  return (
    <IncomingCallNotification
      callerName={incomingCall.callerName}
      callerImage={incomingCall.callerImage}
      onAccept={handleAccept}
      onReject={handleReject}
    />
  )
}
