"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile } from "@/lib/api"
import { initializeSocket } from "@/lib/socket"
import { useNotifications } from "@/lib/notification-context"
import { useCall } from "@/lib/call-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Phone, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { IncomingCallNotification } from "@/components/incoming-call-notification"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function VideoCallPage() {
  const { user, token, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { clearMissedCalls } = useNotifications()
  const { pendingCall, setPendingCall } = useCall()

  const otherUserId = params.userId as string

  const [isLoading, setIsLoading] = useState(true)
  const [callActive, setCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "dialing">("idle")
  const [otherUser, setOtherUser] = useState<any>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [isCaller, setIsCaller] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)

  // WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const socketRef = useRef<any>(null)
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupRef = useRef(false)
  const initializingRef = useRef(false)
  const otherUserProfileRef = useRef<any>(null)
  const acceptingCallRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (initializingRef.current) return
    initializingRef.current = true

    cleanupRef.current = false

    const urlParams = new URLSearchParams(window.location.search)
    const isIncomingCall = urlParams.get("incoming") === "true"

    if (!isIncomingCall) {
      setIsCaller(true)
      setCallStatus("dialing")
    } else {
      setIsCaller(false)
      setCallStatus("ringing")

      if (pendingCall && pendingCall.callerId === otherUserId) {
        setIncomingCall({
          callerId: pendingCall.callerId,
          callerName: pendingCall.callerName,
          callerImage: pendingCall.callerImage,
        })
        setPendingCall(null)
      }
    }

    startInitialization(isIncomingCall)

    return () => {
      cleanupRef.current = true
      initializingRef.current = false
      cleanup()
    }
  }, [isAuthenticated, user, router, otherUserId, pendingCall, setPendingCall])

  const startInitialization = async (isIncomingCall: boolean) => {
    try {
      const profile = await fetchOtherUserProfile()

      if (profile) {
        otherUserProfileRef.current = profile
      }

      setupSocketConnection()

      if (!isIncomingCall && profile) {
        await setupMediaDevices()
        setTimeout(() => initiateCall(profile), 1000)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      if (!cleanupRef.current) {
        toast({
          title: "Error",
          description: "Failed to initialize video call",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
  }

  const setupMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (error: any) {
      console.error("[v0] ❌ Failed to get media devices:", error)
      toast({
        title: "Camera/Microphone Access Denied",
        description: "Please allow camera and microphone access to make video calls",
        variant: "destructive",
      })
      throw error
    }
  }

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    }

    const pc = new RTCPeerConnection(configuration)

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // Handle incoming tracks from remote peer
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          to: otherUserId,
          candidate: event.candidate,
        })
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallActive(true)
        setCallStatus("connected")
        toast({
          title: "Call Connected",
          description: "You are now connected",
        })
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        if (!acceptingCallRef.current) {
          toast({
            title: "Connection Lost",
            description: "The call has been disconnected",
            variant: "destructive",
          })
          endCall()
        }
      }
    }

    peerConnectionRef.current = pc
    return pc
  }

  const fetchOtherUserProfile = async () => {
    if (!token) return null
    try {
      const profile = await getUserProfile(otherUserId, token)
      setOtherUser(profile)
      return profile
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      toast({
        title: "Error",
        description: "Could not load user profile",
        variant: "destructive",
      })
      return null
    }
  }

  const setupSocketConnection = () => {
    if (!user) return

    socketRef.current = initializeSocket(user._id)

    socketRef.current.on("incoming-call", (data: any) => {
      if (data.from === otherUserId) {
        setIncomingCall({
          callerId: data.from,
          callerName: `${data.callerFirstName} ${data.callerLastName}`,
          callerImage: data.callerImage,
        })
        setCallStatus("ringing")
      }
    })

    socketRef.current.on("call-accepted", async () => {
      setCallStatus("connected")
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current)
      }

      // Caller creates offer
      const pc = createPeerConnection()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socketRef.current.emit("webrtc-offer", {
        to: otherUserId,
        offer: offer,
      })
    })

    socketRef.current.on("webrtc-offer", async (data: any) => {
      acceptingCallRef.current = true

      await setupMediaDevices()

      const pc = createPeerConnection()
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socketRef.current.emit("webrtc-answer", {
        to: otherUserId,
        answer: answer,
      })

      setTimeout(() => {
        acceptingCallRef.current = false
      }, 2000)
    })

    socketRef.current.on("webrtc-answer", async (data: any) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      }
    })

    socketRef.current.on("webrtc-ice-candidate", async (data: any) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (error) {
          console.error("[v0] Error adding ICE candidate:", error)
        }
      }
    })

    socketRef.current.on("call-rejected", () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current)
      }
      toast({
        title: "Call Rejected",
        description: "The user declined your call",
        variant: "destructive",
      })
      setTimeout(() => redirectToDashboard(), 2000)
    })

    socketRef.current.on("call-ended", () => {
      toast({
        title: "Call Ended",
        description: "The other user ended the call",
      })
      setTimeout(() => redirectToDashboard(), 1000)
    })

    socketRef.current.on("user-offline", () => {
      toast({
        title: "User Offline",
        description: "The user is currently offline",
        variant: "destructive",
      })
      setTimeout(() => redirectToDashboard(), 3000)
    })
  }

  const initiateCall = (profile?: any) => {
    const userProfile = profile || otherUserProfileRef.current || otherUser

    if (!socketRef.current || !user || !userProfile) {
      console.error("[v0] ❌ Cannot initiate call - missing requirements")
      toast({
        title: "Error",
        description: "Cannot initiate call. Missing required information.",
        variant: "destructive",
      })
      setTimeout(() => redirectToDashboard(), 2000)
      return
    }

    socketRef.current.emit("call-request", {
      to: otherUserId,
      from: user._id,
      callerFirstName: user.firstName,
      callerLastName: user.lastName,
      callerImage: user.picturePath ? `${API_BASE_URL}/assets/${user.picturePath}` : "/placeholder.svg",
    })

    callTimeoutRef.current = setTimeout(() => {
      if (callStatus === "dialing" && !cleanupRef.current) {
        toast({
          title: "No Answer",
          description: "The user is not answering your call",
          variant: "destructive",
        })
        endCall()
      }
    }, 30000)
  }

  const handleIncomingCallAccept = async () => {
    if (!socketRef.current || !incomingCall) {
      console.error("[v0] ❌ Cannot accept call")
      return
    }

    acceptingCallRef.current = true

    const callData = { ...incomingCall }
    setCallStatus("connected")
    clearMissedCalls(callData.callerId)

    try {
      await setupMediaDevices()
    } catch (error) {
      console.error("[v0] ❌ Failed to setup media:", error)
      acceptingCallRef.current = false
      handleIncomingCallReject()
      return
    }

    socketRef.current.emit("accept-call", {
      to: callData.callerId,
      from: user!._id,
    })

    setIncomingCall(null)
  }

  const handleIncomingCallReject = () => {
    if (!socketRef.current || !incomingCall) return

    socketRef.current.emit("reject-call", {
      to: incomingCall.callerId,
      from: user!._id,
    })

    setIncomingCall(null)
    setTimeout(() => redirectToDashboard(), 500)
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const cleanup = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    setCallActive(false)
    setCallStatus("idle")
  }

  const endCall = () => {
    if (cleanupRef.current) return

    if (socketRef.current && user) {
      if (isCaller && callStatus === "dialing") {
        socketRef.current.emit("cancel-call", {
          to: otherUserId,
          from: user._id,
          callerName: `${user.firstName} ${user.lastName}`,
          callerImage: user.picturePath ? `${API_BASE_URL}/assets/${user.picturePath}` : "/placeholder.svg",
        })
      } else {
        socketRef.current.emit("end-call", {
          to: otherUserId,
          from: user._id,
        })
      }
    }

    cleanup()
    setTimeout(() => redirectToDashboard(), 300)
  }

  const redirectToDashboard = () => {
    if (user?.role === "nurse") {
      router.push("/nurse/dashboard")
    } else if (user?.role === "mother") {
      router.push("/mother/dashboard")
    } else if (user?.role === "admin") {
      router.push("/admin/dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  const handleGoBack = () => {
    endCall()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{isCaller ? "Starting Video Call..." : "Setting up call..."}</CardTitle>
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {incomingCall && !callActive && callStatus === "ringing" && (
        <IncomingCallNotification
          callerName={incomingCall.callerName}
          callerImage={incomingCall.callerImage}
          onAccept={handleIncomingCallAccept}
          onReject={handleIncomingCallReject}
        />
      )}

      <div className="flex-1 relative overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
        {/* Remote Video (Other Person) */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!callActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage
                    src={
                      otherUser?.picturePath ? `${API_BASE_URL}/assets/${otherUser.picturePath}` : "/placeholder.svg"
                    }
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
                  {callStatus === "dialing" ? "Calling..." : callStatus === "connected" ? "Connecting..." : "Ready"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (You) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">You</div>
        </div>
      </div>

      <div className="bg-black/80 backdrop-blur p-4 flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" className="rounded-full h-12 w-12 bg-transparent" onClick={handleGoBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Button
          variant={audioEnabled ? "outline" : "destructive"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleAudio}
        >
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={videoEnabled ? "outline" : "destructive"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleVideo}
        >
          {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={endCall}>
          <Phone className="h-5 w-5 rotate-135" />
        </Button>
      </div>
    </div>
  )
}
