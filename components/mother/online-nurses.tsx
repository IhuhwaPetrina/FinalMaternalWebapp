"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Video, MapPin, Briefcase, Award } from "lucide-react"
import { NotificationBadgeIcon } from "@/components/notification-badge-icon"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface Nurse {
  _id: string
  firstName: string
  lastName: string
  email: string
  picturePath?: string
  specializations: string[]
  facilityName: string
  yearsOfExperience: number
  isOnline: boolean
}

interface OnlineNursesProps {
  nurses: Nurse[]
}

export function OnlineNurses({ nurses }: OnlineNursesProps) {
  const router = useRouter()

  const handleChat = (nurseId: string) => {
    router.push(`/chat/${nurseId}`)
  }

  const handleVideoCall = (nurseId: string) => {
    router.push(`/video-call/${nurseId}`)
  }

  if (nurses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No nurses are currently online</p>
        <p className="text-sm mt-2">Check back later or browse health materials</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {nurses.map((nurse) => (
        <Card key={nurse._id}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={nurse.picturePath ? `${API_BASE_URL}/assets/${nurse.picturePath}` : "/placeholder.svg"}
                    alt={nurse.firstName}
                  />
                  <AvatarFallback>
                    {nurse.firstName[0]}
                    {nurse.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">
                  {nurse.firstName} {nurse.lastName}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {nurse.facilityName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span>{nurse.yearsOfExperience} years experience</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Specializations:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {nurse.specializations.slice(0, 3).map((spec, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {nurse.specializations.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{nurse.specializations.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button className="flex-1 relative" onClick={() => handleChat(nurse._id)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
              <NotificationBadgeIcon type="chat" />
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent relative"
              onClick={() => handleVideoCall(nurse._id)}
            >
              <Video className="mr-2 h-4 w-4" />
              Video
              <NotificationBadgeIcon type="call" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
