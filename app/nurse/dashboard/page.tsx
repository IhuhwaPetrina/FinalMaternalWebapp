"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getAllMaterials, getAllMothers } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, LogOut, Eye, Download, Users, User } from "lucide-react"
import { UploadMaterialDialog } from "@/components/nurse/upload-material-dialog"
import { MaterialsTable } from "@/components/nurse/materials-table"
import { MothersList } from "@/components/nurse/mothers-list"
import { useToast } from "@/hooks/use-toast"
import { BackNavigation } from "@/components/back-navigation"

interface Material {
  _id: string
  title: string
  description: string
  category: string
  fileType: string
  views: number
  downloads: number
  createdAt: string
  uploadedBy?: {
    _id: string
  }
}

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

export default function NurseDashboard() {
  const { user, token, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [mothers, setMothers] = useState<Mother[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "nurse") {
      router.push("/nurse/login")
      return
    }

    fetchData()
  }, [isAuthenticated, user, router])

  const fetchData = async () => {
    if (!token) return

    try {
      const [materialsData, mothersData] = await Promise.all([getAllMaterials(token), getAllMothers(token)])
      setMaterials(materialsData)
      setMothers(mothersData)
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
    router.push("/nurse/login")
  }

  const myMaterials = materials.filter((m) => m.uploadedBy?._id === user?._id)
  const totalViews = myMaterials.reduce((sum, m) => sum + m.views, 0)
  const totalDownloads = myMaterials.reduce((sum, m) => sum + m.downloads, 0)
  const onlineMothers = mothers.filter((m) => m.isOnline)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-green-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50/30">
      <div className="container mx-auto p-6 space-y-6">
        <BackNavigation />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance text-gray-900">Nurse Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/profile")}
              className="hover:bg-green-50 border-green-200"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button onClick={handleLogout} className="bg-green-600 hover:bg-green-700 text-white">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Materials</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{myMaterials.length}</div>
              <p className="text-xs text-muted-foreground">Educational resources uploaded</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{totalViews}</div>
              <p className="text-xs text-muted-foreground">Across all your materials</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{totalDownloads}</div>
              <p className="text-xs text-muted-foreground">Resources downloaded by mothers</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mothers Online</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{onlineMothers.length}</div>
              <p className="text-xs text-muted-foreground">Available for consultation</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Materials and Mothers */}
        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList className="bg-green-100">
            <TabsTrigger value="materials" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Health Materials
            </TabsTrigger>
            <TabsTrigger value="mothers" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Mothers ({mothers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <Card className="border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Health Materials</CardTitle>
                    <CardDescription>Manage your uploaded educational resources</CardDescription>
                  </div>
                  <Button onClick={() => setShowUpload(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <MaterialsTable materials={myMaterials} onRefresh={fetchData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mothers">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>Registered Mothers</CardTitle>
                <CardDescription>Connect with mothers for consultations and support</CardDescription>
              </CardHeader>
              <CardContent>
                <MothersList mothers={mothers} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <UploadMaterialDialog open={showUpload} onOpenChange={setShowUpload} onSuccess={fetchData} />
    </div>
  )
}
