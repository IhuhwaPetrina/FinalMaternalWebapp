"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useAuth } from "./auth-context"
import { initializeSocket } from "./socket"

interface NotificationState {
  unreadChats: Record<string, number>
  missedCalls: string[]
}

interface NotificationContextType {
  notifications: NotificationState
  addUnreadChat: (userId: string, count?: number) => void
  clearUnreadChats: (userId: string) => void
  addMissedCall: (userId: string) => void
  clearMissedCalls: (userId: string) => void
  getUnreadChatCount: () => number
  getMissedCallCount: () => number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationState>({
    unreadChats: {},
    missedCalls: [],
  })

  // Setup socket listeners for real-time notifications
  useEffect(() => {
    if (!user?._id) return

    const socket = initializeSocket(user._id)

    // Listen for new messages
    socket.on("receive-message", (data: any) => {
      if (data.senderId && data.receiverId === user._id) {
        console.log("[v0] 💬 New message notification from:", data.senderId)
        addUnreadChat(data.senderId)
      }
    })

    socket.on("call-cancelled", (data: any) => {
      if (data.from && data.from !== user._id) {
        console.log("[v0] 📵 Call cancelled - adding missed call from:", data.from)
        addMissedCall(data.from)
      }
    })

    socket.on("call-ended", (data: any) => {
      if (data.from && data.from !== user._id && !data.wasAnswered) {
        console.log("[v0] 📵 Call ended before answer - adding missed call from:", data.from)
        addMissedCall(data.from)
      }
    })

    return () => {
      socket.off("receive-message")
      socket.off("call-cancelled")
      socket.off("call-ended")
    }
  }, [user])

  const addUnreadChat = useCallback((userId: string, count = 1) => {
    setNotifications((prev) => ({
      ...prev,
      unreadChats: {
        ...prev.unreadChats,
        [userId]: (prev.unreadChats[userId] || 0) + count,
      },
    }))
  }, [])

  const clearUnreadChats = useCallback((userId: string) => {
    setNotifications((prev) => ({
      ...prev,
      unreadChats: {
        ...prev.unreadChats,
        [userId]: 0,
      },
    }))
  }, [])

  const addMissedCall = useCallback((userId: string) => {
    setNotifications((prev) => ({
      ...prev,
      missedCalls: [...prev.missedCalls.filter((id) => id !== userId), userId],
    }))
  }, [])

  const clearMissedCalls = useCallback((userId: string) => {
    setNotifications((prev) => ({
      ...prev,
      missedCalls: prev.missedCalls.filter((id) => id !== userId),
    }))
  }, [])

  const getUnreadChatCount = useCallback(() => {
    return Object.values(notifications.unreadChats).reduce((sum, count) => sum + count, 0)
  }, [notifications.unreadChats])

  const getMissedCallCount = useCallback(() => {
    return notifications.missedCalls.length
  }, [notifications.missedCalls])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addUnreadChat,
        clearUnreadChats,
        addMissedCall,
        clearMissedCalls,
        getUnreadChatCount,
        getMissedCallCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}
