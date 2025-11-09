"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Video, MapPin, Calendar, Wifi, WifiOff } from "lucide-react"

interface Mother {
  _id: string
  firstName: string
  lastName: string
  email: string
  picturePath?: string
  location?: string
  dueDate?: string
  pregnancyWeek?: number
  isOnline: boolean
}

interface MothersListProps {
  mothers: Mother[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function MothersList({ mothers }: MothersListProps) {
  const router = useRouter()

  const handleChat = (motherId: string) => {
    router.push(`/chat/${motherId}`)
  }

  const handleVideoCall = (motherId: string) => {
    router.push(`/video-call/${motherId}`)
  }

  // Sort mothers: online first, then by name
  const sortedMothers = [...mothers].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  })

  if (mothers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No mothers registered yet</p>
        <p className="text-sm mt-2">Check back later</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Mothers</p>
                <p className="text-2xl font-bold">{mothers.length}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Now</p>
                <p className="text-2xl font-bold text-green-600">
                  {mothers.filter(m => m.isOnline).length}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mothers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedMothers.map((mother) => (
          <Card key={mother._id} className={`relative ${!mother.isOnline ? 'opacity-70' : ''}`}>
            {/* Online/Offline Indicator */}
            <div className={`absolute top-4 right-4 flex items-center gap-2 ${mother.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {mother.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="text-xs font-medium">{mother.isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={mother.picturePath ? `${API_BASE_URL}/assets/${mother.picturePath}` : "/placeholder.svg"} 
                      alt={mother.firstName} 
                    />
                    <AvatarFallback>
                      {mother.firstName[0]}
                      {mother.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  {mother.isOnline && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    {mother.firstName} {mother.lastName}
                  </CardTitle>
                  {mother.location && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {mother.location}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mother.pregnancyWeek && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Week {mother.pregnancyWeek} of pregnancy</span>
                </div>
              )}

              {mother.dueDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Due Date:</p>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {new Date(mother.dueDate).toLocaleDateString()}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${mother.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-muted-foreground">
                  {mother.isOnline ? "Available for consultation" : "Last seen recently"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => handleChat(mother._id)}
                disabled={!mother.isOnline}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent" 
                onClick={() => handleVideoCall(mother._id)}
                disabled={!mother.isOnline}
              >
                <Video className="mr-2 h-4 w-4" />
                Video
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}