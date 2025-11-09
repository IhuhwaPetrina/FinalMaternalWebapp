"use client"

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null
let currentUserId: string | null = null

export const initializeSocket = (userId: string) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  if (socket && currentUserId !== userId) {
    console.log(`[v0] 🔄 UserId changed from ${currentUserId} to ${userId}, reconnecting socket`)
    socket.disconnect()
    socket = null
  }

  if (!socket) {
    console.log(`[v0] 🔌 Creating NEW socket connection for user: ${userId}`)

    socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      query: {
        userId: userId,
      },
    })

    socket.on("connect", () => {
      console.log("[v0] ✅ Socket connected:", socket?.id)
      socket?.emit("user-online", userId)
      console.log(`[v0] 📡 Emitted user-online for: ${userId}`)
    })

    socket.on("disconnect", (reason) => {
      console.log("[v0] 🔴 Socket disconnected:", reason)
    })

    socket.on("connect_error", (error) => {
      console.error("[v0] ❌ Socket connection error:", error)
    })

    currentUserId = userId
  } else {
    console.log(`[v0] ♻️ Reusing existing socket for user: ${userId}`)
    if (socket.connected) {
      socket.emit("user-online", userId)
      console.log(`[v0] 📡 Re-emitted user-online for: ${userId}`)
    } else {
      console.log("[v0] ⚠️ Socket exists but not connected, attempting reconnect...")
      socket.connect()
    }
  }

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    currentUserId = null
    console.log("[v0] 🔌 Socket disconnected and cleared")
  }
}
