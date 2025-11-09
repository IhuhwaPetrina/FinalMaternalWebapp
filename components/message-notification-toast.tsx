"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { initializeSocket } from "@/lib/socket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, MessageSquare } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface MessageNotification {
  senderId: string
  senderName: string
  senderImage: string | null
  message: string
  timestamp: Date
}

export function MessageNotificationToast() {
  const { user } = useAuth()
  const router = useRouter()
  const [notification, setNotification] = useState<MessageNotification | null>(null)

  useEffect(() => {
    if (!user?._id) return

    const socket = initializeSocket(user._id)

    const handleMessageNotification = (data: MessageNotification) => {
      console.log("[v0] 📬 Received message notification:", data)

      // Only show notification if not already on the chat page with this user
      if (!window.location.pathname.includes(`/chat/${data.senderId}`)) {
        setNotification(data)

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setNotification(null)
        }, 5000)
      }
    }

    socket.on("new-message-notification", handleMessageNotification)

    return () => {
      socket.off("new-message-notification", handleMessageNotification)
    }
  }, [user])

  if (!notification) return null

  const handleViewMessage = () => {
    router.push(`/chat/${notification.senderId}`)
    setNotification(null)
  }

  const handleDismiss = () => {
    setNotification(null)
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <Card className="w-80 shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={notification.senderImage || "/placeholder.svg"} alt={notification.senderName} />
              <AvatarFallback>
                {notification.senderName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold truncate">{notification.senderName}</p>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{notification.message}</p>

              <Button size="sm" variant="outline" className="w-full bg-transparent" onClick={handleViewMessage}>
                <MessageSquare className="mr-2 h-3 w-3" />
                View Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
