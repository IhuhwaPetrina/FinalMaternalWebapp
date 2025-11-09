"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile } from "@/lib/api"
import { initializeSocket } from "@/lib/socket"
import { useNotifications } from "@/lib/notification-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Phone, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { IncomingCallNotification } from "@/components/incoming-call-notification"
import DailyIframe from '@daily-co/daily-js'
import { VideoCallService } from "@/lib/daily-api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface DailyVideoCallProps {
  otherUserId: string
  onCallEnd: () => void
  isIncomingCall?: boolean
}

export function DailyVideoCall({ otherUserId, onCallEnd, isIncomingCall = false }: DailyVideoCallProps) {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const { addMissedCall, clearMissedCalls } = useNotifications()
  
  const [isLoading, setIsLoading] = useState(true)
  const [callActive, setCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "dialing">("idle")
  const [otherUser, setOtherUser] = useState<any>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [roomUrl, setRoomUrl] = useState<string>("")
  const [roomName, setRoomName] = useState<string>("")
  
  const callFrameRef = useRef<any>(null)
  const dailyContainerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)
  const cleanupRef = useRef(false)

  useEffect(() => {
    if (!user) {
      onCallEnd()
      return
    }

    console.log("🎬 DAILY VIDEO CALL - User:", user._id, "Other User:", otherUserId)
    cleanupRef.current = false
    
    initializeCall()

    return () => {
      console.log("🧹 CLEANING UP DAILY CALL")
      cleanupRef.current = true
      endCall()
    }
  }, [user, otherUserId])

  const initializeCall = async () => {
    try {
      await fetchOtherUserProfile()
      setupSocketConnection()
      
      if (!isIncomingCall) {
        // We're the caller - initiate the call
        await initiateCall()
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Initialization error:", error)
      if (!cleanupRef.current) {
        toast({
          title: "Error",
          description: "Failed to initialize video call",
          variant: "destructive",
        })
        setTimeout(() => onCallEnd(), 2000)
      }
    }
  }

  const fetchOtherUserProfile = async () => {
    if (!token) return
    try {
      const profile = await getUserProfile(otherUserId, token)
      setOtherUser(profile)
      console.log("👤 OTHER USER PROFILE:", profile)
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      toast({
        title: "Error",
        description: "Could not load user profile",
        variant: "destructive",
      })
    }
  }

  const setupSocketConnection = () => {
    if (!user) return

    socketRef.current = initializeSocket(user._id)

    socketRef.current.on("incoming-call", (data: any) => {
      console.log("📞 INCOMING CALL RECEIVED:", data)
      if (data.from === otherUserId) {
        setIncomingCall({
          callerId: data.from,
          callerName: `${data.callerFirstName} ${data.callerLastName}`,
          callerImage: data.callerImage,
          roomName: data.roomName, // Make sure room info is included
          roomUrl: data.roomUrl    // Make sure room info is included
        })
        setCallStatus("ringing")
      }
    })

    socketRef.current.on("call-accepted", (data: any) => {
      console.log("✅ CALL ACCEPTED BY RECEIVER")
      setCallStatus("connected")
      setCallActive(true)
      // Start the Daily call when accepted
      startDailyCall()
    })

    socketRef.current.on("call-rejected", (data: any) => {
      console.log("❌ CALL REJECTED BY RECEIVER")
      toast({
        title: "Call Rejected",
        description: "The user declined your call",
        variant: "destructive",
      })
      setTimeout(() => onCallEnd(), 2000)
    })

    socketRef.current.on("call-ended", (data: any) => {
      console.log("📞 CALL ENDED BY OTHER USER")
      toast({
        title: "Call Ended",
        description: "The other user ended the call",
      })
      setTimeout(() => onCallEnd(), 2000)
    })

    socketRef.current.on("user-offline", (data: any) => {
      console.log("🔴 USER OFFLINE:", data)
      toast({
        title: "User Offline",
        description: "The user is currently offline",
        variant: "destructive",
      })
      setTimeout(() => onCallEnd(), 2000)
    })
  }

  const initiateCall = async () => {
    if (!socketRef.current || !user || !otherUser) return

    console.log("📞 INITIATING CALL TO:", otherUserId)
    setCallStatus("dialing")
    
    try {
      // Create Daily.co room FIRST
      const roomName = `maternal-${user._id}-${otherUserId}-${Date.now()}`
      console.log("🎪 CREATING DAILY ROOM:", roomName)
      
      const room = await VideoCallService.createRoom(roomName, {
        expiry: 3600,
        privacy: 'private'
      })

      console.log("✅ DAILY ROOM CREATED:", room)
      
      // Store room info
      setRoomName(room.name)
      setRoomUrl(room.url)

      // Send call request with room info
      socketRef.current.emit("call-request", {
        to: otherUserId,
        from: user._id,
        callerFirstName: user.firstName,
        callerLastName: user.lastName,
        callerImage: user.picturePath ? `${API_BASE_URL}/assets/${user.picturePath}` : "/placeholder.svg",
        roomName: room.name,
        roomUrl: room.url
      })

      console.log("📞 CALL REQUEST SENT WITH ROOM:", room.name)

      // Set timeout for call rejection (30 seconds)
      setTimeout(() => {
        if (callStatus === "dialing" && !cleanupRef.current) {
          console.log("⏰ CALL TIMEOUT - NO ANSWER")
          // Clean up the room
          VideoCallService.deleteRoom(roomName).catch(console.error)
          toast({
            title: "No Answer",
            description: "The user is not answering your call",
            variant: "destructive",
          })
          endCall()
        }
      }, 30000)

    } catch (error) {
      console.error("❌ FAILED TO CREATE DAILY ROOM:", error)
      toast({
        title: "Call Failed",
        description: "Could not create video call room",
        variant: "destructive",
      })
      setTimeout(() => onCallEnd(), 2000)
    }
  }

  const startDailyCall = async () => {
    if (!dailyContainerRef.current) {
      console.error("❌ Missing Daily container")
      return
    }

    // If we're the receiver and have incoming call with room info, use that
    let finalRoomUrl = roomUrl
    let finalRoomName = roomName

    if (isIncomingCall && incomingCall?.roomUrl) {
      finalRoomUrl = incomingCall.roomUrl
      finalRoomName = incomingCall.roomName
    }

    if (!finalRoomUrl) {
      console.error("❌ No room URL available")
      toast({
        title: "Call Error",
        description: "No room URL available",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("🎬 STARTING DAILY CALL:", finalRoomUrl)

      // Clear container first
      if (dailyContainerRef.current) {
        dailyContainerRef.current.innerHTML = ''
      }

      // Create iframe using the imported DailyIframe
      callFrameRef.current = DailyIframe.createFrame({
        iframeStyle: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: 'none',
        },
      })

      // Mount the iframe
      if (dailyContainerRef.current) {
        dailyContainerRef.current.appendChild(callFrameRef.current)
      }

      console.log("✅ Daily.co iframe created, setting up listeners...")

      // Set up event listeners
      callFrameRef.current
        .on('loaded', () => {
          console.log('✅ Daily.co iframe loaded')
        })
        .on('joining-meeting', () => {
          console.log('🔄 Joining meeting...')
        })
        .on('joined-meeting', (event: any) => {
          console.log('✅ Successfully joined Daily meeting')
          setCallActive(true)
          setCallStatus("connected")
          toast({
            title: "Call Connected",
            description: "You are now connected",
          })
        })
        .on('participant-joined', (event: any) => {
          console.log('👤 Participant joined:', event)
          setParticipantCount(prev => prev + 1)
        })
        .on('participant-left', (event: any) => {
          console.log('👤 Participant left:', event)
          setParticipantCount(prev => Math.max(0, prev - 1))
        })
        .on('left-meeting', (event: any) => {
          console.log('🚪 Left Daily meeting')
          if (!cleanupRef.current) {
            endCall()
          }
        })
        .on('error', (error: any) => {
          console.error('❌ Daily.co error:', error)
          toast({
            title: "Video Call Error",
            description: error?.errorMsg || "Failed to join video call",
            variant: "destructive",
          })
        })

      console.log("🚀 Joining Daily.co room:", finalRoomUrl)
      
      await callFrameRef.current.join({
        url: finalRoomUrl,
        userName: `${user?.firstName} ${user?.lastName}`,
        showLeaveButton: true,
        showFullscreenButton: true,
      })

    } catch (error) {
      console.error('❌ Failed to start Daily call:', error)
      toast({
        title: "Video Call Error",
        description: "Failed to start video call",
        variant: "destructive",
      })
    }
  }

  const handleIncomingCallAccept = () => {
    if (!socketRef.current || !incomingCall) return

    console.log("✅ ACCEPTING INCOMING CALL FROM:", incomingCall.callerId)
    
    // Set room info from incoming call
    if (incomingCall.roomName && incomingCall.roomUrl) {
      setRoomName(incomingCall.roomName)
      setRoomUrl(incomingCall.roomUrl)
    }
    
    socketRef.current.emit("accept-call", {
      to: incomingCall.callerId,
      from: user!._id,
      roomName: incomingCall.roomName,
      roomUrl: incomingCall.roomUrl
    })

    setCallStatus("connected")
    setCallActive(true)
    setIncomingCall(null)
    clearMissedCalls(incomingCall.callerId)
    
    // Start Daily call
    startDailyCall()
    
    toast({
      title: "Call Accepted",
      description: "You are now connected",
    })
  }

  const handleIncomingCallReject = () => {
    if (!socketRef.current || !incomingCall) return

    console.log("❌ REJECTING INCOMING CALL FROM:", incomingCall.callerId)
    
    socketRef.current.emit("reject-call", {
      to: incomingCall.callerId,
      from: user!._id,
    })

    setIncomingCall(null)
    addMissedCall(incomingCall.callerId)
    setTimeout(() => onCallEnd(), 500)
  }

  const toggleAudio = () => {
    if (callFrameRef.current) {
      try {
        const currentAudio = callFrameRef.current.localAudio()
        callFrameRef.current.setLocalAudio(!currentAudio)
      } catch (error) {
        console.error("Error toggling audio:", error)
      }
    }
  }

  const toggleVideo = () => {
    if (callFrameRef.current) {
      try {
        const currentVideo = callFrameRef.current.localVideo()
        callFrameRef.current.setLocalVideo(!currentVideo)
      } catch (error) {
        console.error("Error toggling video:", error)
      }
    }
  }

  const endCall = () => {
    if (cleanupRef.current) return

    console.log("📞 ENDING DAILY CALL")
    cleanupRef.current = true

    // Safe Daily.co cleanup
    if (callFrameRef.current) {
      try {
        callFrameRef.current.leave().catch(() => {})
        callFrameRef.current.destroy()
      } catch (error) {
        console.error("Error during Daily cleanup:", error)
      }
      callFrameRef.current = null
    }

    // Clean up Daily room
    if (roomName) {
      VideoCallService.deleteRoom(roomName).catch(error => {
        console.log("⚠️ Could not delete room:", error)
      })
    }

    // Notify the other user that we ended the call
    if (socketRef.current && user) {
      console.log("📞 Notifying other user that we ended the call")
      socketRef.current.emit("end-call", {
        to: otherUserId,
        from: user._id,
      })
    }

    setCallActive(false)
    setCallStatus("idle")
    setParticipantCount(0)
    setRoomUrl("")
    setRoomName("")

    // Call parent's onCallEnd
    onCallEnd()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {isIncomingCall ? "Incoming Call..." : "Starting Video Call..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {otherUser && (
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={otherUser.picturePath ? `${API_BASE_URL}/assets/${otherUser.picturePath}` : "/placeholder.svg"}
                    alt={`${otherUser.firstName} ${otherUser.lastName}`}
                  />
                  <AvatarFallback className="text-2xl">
                    {otherUser.firstName?.[0]}
                    {otherUser.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-lg font-medium">
                  {otherUser.firstName} {otherUser.lastName}
                </p>
              </div>
            )}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              {isIncomingCall ? "Answering call..." : "Connecting to video call..."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {incomingCall && (
        <IncomingCallNotification
          callerName={incomingCall.callerName}
          callerImage={incomingCall.callerImage}
          onAccept={handleIncomingCallAccept}
          onReject={handleIncomingCallReject}
        />
      )}

      {/* Daily.co Video Container */}
      <div className="flex-1 relative" ref={dailyContainerRef}>
        {!callActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
            <div className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage
                  src={otherUser?.picturePath ? `${API_BASE_URL}/assets/${otherUser.picturePath}` : "/placeholder.svg"}
                  alt={otherUser?.firstName}
                />
                <AvatarFallback className="text-2xl">
                  {otherUser?.firstName?.[0]}
                  {otherUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-xl font-semibold">
                {otherUser?.firstName} {otherUser?.lastName}
              </p>
              <p className="text-gray-400 mt-4">
                {callStatus === "dialing" ? "Calling..." : 
                 callStatus === "ringing" ? "Ringing..." : 
                 callStatus === "connected" ? "Connecting..." : 
                 "Ready for call"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call Info Bar */}
      {callActive && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-white z-20">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{participantCount} participant(s)</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur p-4 flex items-center justify-center gap-4 z-20">
        <Button variant="outline" size="icon" className="rounded-full h-12 w-12" onClick={endCall}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleAudio}
        >
          <Mic className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleVideo}
        >
          <Video className="h-5 w-5" />
        </Button>

        <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={endCall}>
          <Phone className="h-5 w-5 rotate-135" />
        </Button>
      </div>
    </div>
  )
}