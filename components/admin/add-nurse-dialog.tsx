"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { registerNurse } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface AddNurseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddNurseDialog({ open, onOpenChange, onSuccess }: AddNurseDialogProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    rnNumber: "",
    specializations: "",
    facilityName: "",
    yearsOfExperience: "",
    licenseExpiryDate: "",
    location: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("firstName", formData.firstName)
      formDataToSend.append("lastName", formData.lastName)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("rnNumber", formData.rnNumber)
      formDataToSend.append("specializations", formData.specializations)
      formDataToSend.append("facilityName", formData.facilityName)
      formDataToSend.append("yearsOfExperience", formData.yearsOfExperience)
      formDataToSend.append("licenseExpiryDate", formData.licenseExpiryDate)
      formDataToSend.append("location", formData.location)

      await registerNurse(formDataToSend, token)

      toast({
        title: "Success",
        description: "Nurse registered successfully",
      })

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        rnNumber: "",
        specializations: "",
        facilityName: "",
        yearsOfExperience: "",
        licenseExpiryDate: "",
        location: "",
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register nurse",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Nurse</DialogTitle>
          <DialogDescription>
            Add a new nurse to the system. They will be able to log in with these credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rnNumber">RN Number *</Label>
              <Input
                id="rnNumber"
                value={formData.rnNumber}
                onChange={(e) => setFormData({ ...formData, rnNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityName">Facility Name *</Label>
              <Input
                id="facilityName"
                value={formData.facilityName}
                onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specializations">Specializations (comma-separated) *</Label>
            <Textarea
              id="specializations"
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              placeholder="e.g., Prenatal Care, Labor & Delivery, Postpartum Care"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                min="0"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseExpiryDate">License Expiry Date *</Label>
              <Input
                id="licenseExpiryDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.licenseExpiryDate}
                onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, State"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register Nurse"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
