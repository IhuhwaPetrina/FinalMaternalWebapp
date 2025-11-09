"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile, updateUserProfile, changePassword } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, User, Lock, ArrowLeft } from "lucide-react"
import { BackNavigation } from "@/components/back-navigation"

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Get today's date for due date validation
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (!user || !token) {
      router.push("/login")
      return
    }

    loadProfile()
  }, [user, token])

  const loadProfile = async () => {
    if (!user || !token) return

    try {
      setLoading(true)
      const data = await getUserProfile(user._id, token)

      if (data) {
        setProfileData(data)
        if (data.picturePath) {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          setPreviewUrl(`${API_BASE_URL}/assets/${data.picturePath}`)
        }
      } else {
        // Create default profile data using auth context user data
        const defaultProfile = {
          _id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          location: user.location || "",
          occupation: user.role === "mother" ? (user.occupation || "") : "",
          picturePath: user.picturePath || null,
          dueDate: user.dueDate || "",
          pregnancyWeek: user.pregnancyWeek || 0,
          rnNumber: user.rnNumber || "",
          facilityName: user.facilityName || "",
          yearsOfExperience: user.yearsOfExperience || 0,
        }
        setProfileData(defaultProfile)

        if (user.picturePath) {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          setPreviewUrl(`${API_BASE_URL}/assets/${user.picturePath}`)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePicture(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !token) return

    setSaving(true)
    try {
      const formData = new FormData()

      // Add all form fields
      const form = e.target as HTMLFormElement
      const formElements = form.elements as any

      if (formElements.firstName?.value) formData.append("firstName", formElements.firstName.value)
      if (formElements.lastName?.value) formData.append("lastName", formElements.lastName.value)
      if (formElements.location?.value) formData.append("location", formElements.location.value)
      
      // Only add occupation for mothers
      if (user.role === "mother" && formElements.occupation?.value) {
        formData.append("occupation", formElements.occupation.value)
      }

      // Mother-specific fields
      if (user.role === "mother") {
        if (formElements.dueDate?.value) formData.append("dueDate", formElements.dueDate.value)
        if (formElements.pregnancyWeek?.value) formData.append("pregnancyWeek", formElements.pregnancyWeek.value)
      }

      // Nurse-specific fields
      if (user.role === "nurse") {
        if (formElements.facilityName?.value) formData.append("facilityName", formElements.facilityName.value)
        if (formElements.yearsOfExperience?.value)
          formData.append("yearsOfExperience", formElements.yearsOfExperience.value)
      }

      if (profilePicture) {
        formData.append("picture", profilePicture)
      }

      const updatedUser = await updateUserProfile(user._id, formData, token)
      updateUser(updatedUser)
      setProfileData(updatedUser)
      setProfilePicture(null)

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !token) return

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await changePassword(user._id, currentPassword, newPassword, token)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    } catch (error) {
      console.error("[v0] Error changing password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profileData) return null

  return (
    <div className="container max-w-4xl py-8">
      {/* Back Navigation */}
      <BackNavigation title="My Profile" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Profile picture" />
                    <AvatarFallback className="text-2xl">
                      {profileData.firstName?.[0]}
                      {profileData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="picture" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <Upload className="h-4 w-4" />
                        Upload Photo
                      </div>
                      <Input id="picture" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </Label>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" defaultValue={profileData.firstName} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" defaultValue={profileData.lastName} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profileData.email} disabled className="bg-muted" />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" defaultValue={profileData.location} />
                  </div>
                  
                  {/* Occupation field - Only for mothers */}
                  {user?.role === "mother" && (
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input 
                        id="occupation" 
                        name="occupation" 
                        defaultValue={profileData.occupation} 
                        placeholder="Your current occupation"
                      />
                    </div>
                  )}
                </div>

                {/* Mother-specific fields */}
                {user?.role === "mother" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        min={today} // Prevent past dates
                        defaultValue={
                          profileData.dueDate ? new Date(profileData.dueDate).toISOString().split("T")[0] : ""
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Please select a future date
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pregnancyWeek">Pregnancy Week</Label>
                      <Input
                        id="pregnancyWeek"
                        name="pregnancyWeek"
                        type="number"
                        min="1"
                        max="42"
                        placeholder="Current week of pregnancy"
                        defaultValue={profileData.pregnancyWeek}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter current week (1-42)
                      </p>
                    </div>
                  </div>
                )}

                {/* Nurse-specific fields */}
                {user?.role === "nurse" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="rnNumber">RN Number</Label>
                      <Input id="rnNumber" value={profileData.rnNumber} disabled className="bg-muted" />
                      <p className="text-sm text-muted-foreground">RN Number cannot be changed</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="facilityName">Facility Name</Label>
                        <Input 
                          id="facilityName" 
                          name="facilityName" 
                          defaultValue={profileData.facilityName} 
                          placeholder="Hospital or clinic name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                        <Input
                          id="yearsOfExperience"
                          name="yearsOfExperience"
                          type="number"
                          min="0"
                          max="50"
                          placeholder="Number of years"
                          defaultValue={profileData.yearsOfExperience}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}