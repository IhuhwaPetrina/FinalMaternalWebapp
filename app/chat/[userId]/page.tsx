"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getConversation, sendMessage, markMessagesAsRead } from "@/lib/api"
import { initializeSocket, getSocket } from "@/lib/socket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/lib/notification-context"

interface Message {
  _id: string
  senderId: {
    _id: string
    firstName: string
    lastName: string
    picturePath?: string
  }
  receiverId: {
    _id: string
    firstName: string
    lastName: string
    picturePath?: string
  }
  message: string
  createdAt: string
  isRead: boolean
}

export default function ChatPage() {
  const { user, token, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { clearUnreadChats } = useNotifications()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const otherUserId = params.userId as string
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    fetchConversation()

    const socket = initializeSocket(user._id)

    socket.on("receive-message", (data: any) => {
      if (data.senderId === otherUserId) {
        setMessages((prev) => [...prev, data])
        markMessagesAsRead(otherUserId, user._id, token!)
      }
    })

    socket.on("user-typing", (data: any) => {
      if (data.senderId === otherUserId) {
        setIsTyping(true)
      }
    })

    socket.on("user-stop-typing", (data: any) => {
      if (data.senderId === otherUserId) {
        setIsTyping(false)
      }
    })

    return () => {
      socket.off("receive-message")
      socket.off("user-typing")
      socket.off("user-stop-typing")
      clearUnreadChats(otherUserId)
    }
  }, [isAuthenticated, user, otherUserId, router, clearUnreadChats, token])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    if (!token || !user) return

    try {
      const data = await getConversation(user._id, otherUserId, token)
      setMessages(data)

      if (data.length > 0) {
        const other = data[0].senderId._id === user._id ? data[0].receiverId : data[0].senderId
        setOtherUser(other)
      }

      await markMessagesAsRead(otherUserId, user._id, token)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !token || !user) return

    setIsSending(true)

    try {
      const data = await sendMessage(user._id, otherUserId, newMessage, token)
      setMessages((prev) => [...prev, data])

      const socket = getSocket()
      socket?.emit("send-message", {
        senderId: user._id,
        receiverId: otherUserId,
        message: newMessage,
      })

      setNewMessage("")
      socket?.emit("stop-typing", { senderId: user?._id, receiverId: otherUserId })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleTyping = () => {
    const socket = getSocket()
    socket?.emit("typing", { senderId: user?._id, receiverId: otherUserId })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("stop-typing", { senderId: user?._id, receiverId: otherUserId })
    }, 1000)
  }

  const handleVideoCall = () => {
    router.push(`/video-call/${otherUserId}`)
  }

  const handleGoBack = () => {
    clearUnreadChats(otherUserId)
    setTimeout(() => {
      router.back()
    }, 150)
  }

  const getPictureUrl = (picturePath?: string) => {
    if (!picturePath) return "/placeholder.svg"
    return picturePath.startsWith("http") ? picturePath : `${API_BASE_URL}/assets/${picturePath}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 transition-all duration-300">
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGoBack}
                className="transition-all duration-200 ease-out hover:scale-110 active:scale-95"
              >
                <ArrowLeft className="h-5 w-5 transition-transform duration-200" />
              </Button>
              {otherUser && (
                <>
                  <Avatar>
                    <AvatarImage
                      src={getPictureUrl(otherUser.picturePath) || "/placeholder.svg"}
                      alt={otherUser.firstName}
                    />
                    <AvatarFallback>
                      {otherUser.firstName[0]}
                      {otherUser.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {otherUser.firstName} {otherUser.lastName}
                    </CardTitle>
                    {isTyping && <p className="text-sm text-muted-foreground">typing...</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleVideoCall}
                      className="relative transition-all duration-200 ease-out hover:scale-110 active:scale-95 bg-transparent"
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId._id === user?._id
                    return (
                      <div key={msg._id} className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {!isOwn && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage
                              src={getPictureUrl(msg.senderId.picturePath) || "/placeholder.svg"}
                              alt={msg.senderId.firstName}
                            />
                            <AvatarFallback>
                              {msg.senderId.firstName[0]}
                              {msg.senderId.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-xs rounded-lg px-4 py-2 break-words ${
                            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-normal break-words">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {isOwn && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage
                              src={getPictureUrl(user?.picturePath) || "/placeholder.svg"}
                              alt={user?.firstName}
                            />
                            <AvatarFallback>
                              {user?.firstName?.[0]}
                              {user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
