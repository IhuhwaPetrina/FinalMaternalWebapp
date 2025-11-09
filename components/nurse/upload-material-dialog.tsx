"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { uploadHealthMaterial } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileUp, Video } from "lucide-react"

interface UploadMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const CATEGORIES = [
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

const FILE_TYPES = [
  { value: "pdf", label: "PDF Document" },
  { value: "pptx", label: "PowerPoint Presentation" },
  { value: "docx", label: "Word Document" },
  { value: "video", label: "Video" },
  { value: "url", label: "External URL" },
]

export function UploadMaterialDialog({ open, onOpenChange, onSuccess }: UploadMaterialDialogProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [fileType, setFileType] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    url: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !user) return

    if (fileType === "url" && !formData.url) {
      toast({
        title: "Error",
        description: "Please provide a URL",
        variant: "destructive",
      })
      return
    }

    if (fileType !== "url" && !file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("category", formData.category)
      formDataToSend.append("fileType", fileType)
      formDataToSend.append("uploadedBy", user._id)

      if (fileType === "url") {
        formDataToSend.append("url", formData.url)
      } else if (file) {
        if (fileType === "video") {
          formDataToSend.append("video", file)
        } else {
          formDataToSend.append("file", file)
        }
      }

      await uploadHealthMaterial(formDataToSend, token)

      toast({
        title: "Success",
        description: fileType === "video" ? "Video uploaded successfully" : "Material uploaded successfully",
      })

      setFormData({
        title: "",
        description: "",
        category: "",
        url: "",
      })
      setFileType("")
      setFile(null)

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload material",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Health Material</DialogTitle>
          <DialogDescription>Share educational resources with mothers in the community</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Prenatal Nutrition Guide"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a brief description of the material..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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

            <div className="space-y-2">
              <Label htmlFor="fileType">File Type *</Label>
              <Select value={fileType} onValueChange={setFileType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {fileType === "url" ? (
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/resource"
                required
              />
            </div>
          ) : (
            fileType && (
              <div className="space-y-2">
                <Label htmlFor="file">{fileType === "video" ? "Upload Video" : "Upload File"} *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept={
                      fileType === "pdf"
                        ? ".pdf"
                        : fileType === "pptx"
                          ? ".pptx,.ppt"
                          : fileType === "docx"
                            ? ".docx,.doc"
                            : fileType === "video"
                              ? "video/*"
                              : ""
                    }
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {fileType === "video" ? <Video className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
                      {file.name}
                    </div>
                  )}
                </div>
                {fileType === "video" && file && (
                  <p className="text-xs text-muted-foreground">
                    Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                    {file.size > 100 * 1024 * 1024 && " (Large file - upload may take a while)"}
                  </p>
                )}
              </div>
            )
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
