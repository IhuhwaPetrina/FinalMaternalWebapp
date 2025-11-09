"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { incrementView } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { VideoPlayer } from "@/components/video-player"

interface MaterialViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: {
    _id: string
    title: string
    fileType: string
    filePath?: string
    videoPath?: string
    url?: string
  }
  onDownload: () => void
}

export function MaterialViewerDialog({ open, onOpenChange, material, onDownload }: MaterialViewerDialogProps) {
  const { token } = useAuth()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fileUrl =
    material.fileType === "url"
      ? material.url
      : material.fileType === "video" && material.videoPath
        ? `${API_BASE_URL}/videos/${material.videoPath}`
        : `${API_BASE_URL}/materials/${material.filePath}`

  useEffect(() => {
    if (open && token) {
      incrementView(material._id, token).catch(console.error)
    }
  }, [open, material._id, token])

  const renderViewer = () => {
    if (material.fileType === "url") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">This is an external link. Click below to open it.</p>
          <Button onClick={() => window.open(material.url, "_blank")} className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Link
          </Button>
        </div>
      )
    }

    if (material.fileType === "video") {
      return (
        <div className="space-y-4">
          <VideoPlayer src={fileUrl!} title={material.title} />
          <p className="text-xs text-muted-foreground text-center">
            Use the controls to play, pause, adjust volume, and go fullscreen.
          </p>
        </div>
      )
    }

    if (material.fileType === "pdf") {
      return (
        <div className="space-y-4">
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-[600px] border rounded-md"
            title={material.title}
            onError={(e) => {
              console.error("Failed to load PDF:", e)
            }}
          />
          <p className="text-xs text-muted-foreground">If PDF doesn't display, use the download button to view it.</p>
        </div>
      )
    }

    // For other file types (pptx, docx), show download option
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-sm text-muted-foreground">
          Preview not available for {material.fileType.toUpperCase()} files.
        </p>
        <p className="text-sm text-muted-foreground">Download the file to view it.</p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{material.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {renderViewer()}
          {material.fileType !== "video" && (
            <Button onClick={onDownload} variant="outline" className="w-full bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
