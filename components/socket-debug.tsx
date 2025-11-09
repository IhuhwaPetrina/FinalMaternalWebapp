"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { initializeSocket } from "@/lib/socket"

export function SocketDebug() {
  const { user } = useAuth()

  useEffect(() => {
    if (user?._id) {
      console.log("🔌 DEBUG: Initializing socket for user:", user._id)
      const socket = initializeSocket(user._id)
      
      socket.on("connect", () => {
        console.log("✅ DEBUG: Socket connected successfully")
      })
      
      socket.on("incoming-call", (data) => {
        console.log("📞 DEBUG: Incoming call received:", data)
      })
      
      socket.on("call-request", (data) => {
        console.log("📞 DEBUG: Call request event:", data)
      })
      
      socket.on("call-accepted", (data) => {
        console.log("✅ DEBUG: Call accepted:", data)
      })
      
      socket.on("call-rejected", (data) => {
        console.log("❌ DEBUG: Call rejected:", data)
      })
      
      socket.on("call-ended", (data) => {
        console.log("📞 DEBUG: Call ended:", data)
      })
      
      return () => {
        socket.off("connect")
        socket.off("incoming-call")
        socket.off("call-request")
        socket.off("call-accepted")
        socket.off("call-rejected")
        socket.off("call-ended")
      }
    } else {
      console.log("🔌 DEBUG: No user available for socket connection")
    }
  }, [user])

  return null
}