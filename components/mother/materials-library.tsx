"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { incrementDownload } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Eye, ExternalLink, Calendar, User, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MaterialViewerDialog } from "@/components/material-viewer-dialog"

interface Material {
  _id: string
  title: string
  description: string
  category: string
  fileType: string
  filePath?: string
  videoPath?: string
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

interface MaterialsLibraryProps {
  materials: Material[]
}

const CATEGORIES = [
  "All",
  "Prenatal Care",
  "Nutrition",
  "Exercise",
  "Mental Health",
  "Labor & Delivery",
  "Postpartum Care",
  "Newborn Care",
  "Breastfeeding",
  "General Health",
  "Other",
]

export function MaterialsLibrary({ materials }: MaterialsLibraryProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "All" || material.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleView = (material: Material) => {
    setSelectedMaterial(material)
    setViewerOpen(true)
  }

  const handleDownload = async (material: Material) => {
    if (!token) return

    try {
      await incrementDownload(material._id, token)

      if (material.fileType === "url" && material.url) {
        window.open(material.url, "_blank")
      } else if (material.fileType === "video" && material.videoPath) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        const link = document.createElement("a")
        link.href = `${API_BASE_URL}/videos/${material.videoPath}`
        link.download = material.title
        link.click()
      } else if (material.filePath) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        const link = document.createElement("a")
        link.href = `${API_BASE_URL}/materials/${material.filePath}`
        link.download = material.title
        link.click()
      }

      toast({
        title: "Success",
        description: "Material downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download material",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === "video") {
      return <Video className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No materials found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <Card key={material._id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                    {getFileIcon(material.fileType)}
                    {material.fileType.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{material.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <Badge variant="outline">{material.category}</Badge>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {material.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {material.downloads}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>
                      {material.uploadedBy
                        ? `${material.uploadedBy.firstName} ${material.uploadedBy.lastName}`
                        : "Unknown User"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button className="flex-1" onClick={() => handleView(material)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {material.fileType === "video" ? "Watch" : "View"}
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleDownload(material)}>
                  {material.fileType === "url" ? (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedMaterial && (
        <MaterialViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          material={selectedMaterial}
          onDownload={() => handleDownload(selectedMaterial)}
        />
      )}
    </div>
  )
}
