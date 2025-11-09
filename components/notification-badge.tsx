"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getUnreadMessageCount } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { initializeSocket } from "@/lib/socket"

export function NotificationBadge() {
  const { user, token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?._id || !token) {
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const data = await getUnreadMessageCount(user._id, token)
        setUnreadCount(data.totalUnread || 0)
      } catch (error) {
        console.error("Failed to fetch unread count:", error)
        setUnreadCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnreadCount()

    // Set up socket for real-time updates
    let socket: any = null
    try {
      socket = initializeSocket(user._id)

      socket.on("new-message-notification", () => {
        fetchUnreadCount()
      })

      socket.on("receive-message", () => {
        fetchUnreadCount()
      })

      socket.on("messages-read", () => {
        fetchUnreadCount()
      })
    } catch (socketError) {
      console.error("Socket initialization failed:", socketError)
    }

    // Refresh count periodically as fallback
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => {
      if (socket) {
        socket.off("new-message-notification")
        socket.off("receive-message")
        socket.off("messages-read")
      }
      clearInterval(interval)
    }
  }, [user, token])

  if (isLoading) return null
  if (unreadCount === 0) return null

  return (
    <Badge
      variant="destructive"
      className="ml-2 min-w-[20px] h-5 flex items-center justify-center text-xs font-semibold"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  )
}
