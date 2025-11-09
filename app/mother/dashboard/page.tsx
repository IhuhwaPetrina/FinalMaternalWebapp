"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getAllMaterials, getOnlineNurses } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Heart, Users, User } from "lucide-react"
import { MaterialsLibrary } from "@/components/mother/materials-library"
import { OnlineNurses } from "@/components/mother/online-nurses"
import { useToast } from "@/hooks/use-toast"
import { BackNavigation } from "@/components/back-navigation"
import { GlobalCallNotification } from "@/components/global-call-notification"

interface Material {
  _id: string
  title: string
  description: string
  category: string
  fileType: string
  filePath?: string
  url?: string
  views: number
  downloads: number
  uploadedBy: {
    _id: string
    firstName: string
    lastName: string
    picturePath?: string
  }
  createdAt: string
}

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

export default function MotherDashboard() {
  const { user, token, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [onlineNurses, setOnlineNurses] = useState<Nurse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "mother") {
      router.push("/login")
      return
    }

    fetchData()
  }, [isAuthenticated, user, router])

  const fetchData = async () => {
    if (!token) return

    try {
      const [materialsData, nursesData] = await Promise.all([getAllMaterials(token), getOnlineNurses(token)])
      setMaterials(materialsData)
      setOnlineNurses(nursesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-6 space-y-6">
        <BackNavigation />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Welcome, {user?.firstName}!</h1>
            <p className="text-muted-foreground mt-1">Your journey to motherhood, supported every step of the way</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/profile")} className="relative">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
              <Heart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{materials.length}</div>
              <p className="text-xs text-muted-foreground">Educational materials to support you</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nurses Online</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{onlineNurses.length}</div>
              <p className="text-xs text-muted-foreground">Available to chat and support you</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList>
            <TabsTrigger value="materials">Health Materials</TabsTrigger>
            <TabsTrigger value="nurses">Online Nurses</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Education Library</CardTitle>
                <CardDescription>Browse educational materials curated by healthcare professionals</CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialsLibrary materials={materials} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nurses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connect with Nurses</CardTitle>
                <CardDescription>Chat with available nurses for guidance and support</CardDescription>
              </CardHeader>
              <CardContent>
                <OnlineNurses nurses={onlineNurses} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
    <GlobalCallNotification />
  </div>

    </div>
  )
}
