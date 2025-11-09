"use client"

import { useNotifications } from "@/lib/notification-context"

interface NotificationBadgeIconProps {
  type: "chat" | "call"
}

export function NotificationBadgeIcon({ type }: NotificationBadgeIconProps) {
  const { getUnreadChatCount, getMissedCallCount } = useNotifications()

  const count = type === "chat" ? getUnreadChatCount() : getMissedCallCount()

  if (count === 0) return null

  return (
    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
      {count > 99 ? "99+" : count}
    </div>
  )
}
