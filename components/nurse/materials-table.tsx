"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { deleteMaterial } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Eye, Download, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Material {
  _id: string
  title: string
  description: string
  category: string
  fileType: string
  views: number
  downloads: number
  createdAt: string
}

interface MaterialsTableProps {
  materials: Material[]
  onRefresh: () => void
}

export function MaterialsTable({ materials, onRefresh }: MaterialsTableProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  const handleDelete = async () => {
    if (!token || !selectedMaterial) return

    try {
      await deleteMaterial(selectedMaterial._id, token)
      toast({
        title: "Success",
        description: "Material deleted successfully",
      })
      setDeleteDialogOpen(false)
      setSelectedMaterial(null)
      onRefresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete material",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No materials uploaded yet
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {material.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{material.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.fileType.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {material.views}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3 text-muted-foreground" />
                      {material.downloads}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(material.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMaterial(material)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedMaterial?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
