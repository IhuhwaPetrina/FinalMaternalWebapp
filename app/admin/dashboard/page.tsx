"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getAllUsers } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, UserX, Activity, UserPlus, LogOut } from "lucide-react"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { AddNurseDialog } from "@/components/admin/add-nurse-dialog"
import { useToast } from "@/hooks/use-toast"
import { BackNavigation } from "@/components/back-navigation"

interface Stats {
  total: number
  active: number
  inactive: number
  online: number
  nurses: number
  mothers: number
}

interface AdminUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  isOnline: boolean
  createdAt: string
}

export default function AdminDashboard() {
  const { user, token, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddNurse, setShowAddNurse] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/admin/login")
      return
    }

    fetchUsers()
  }, [isAuthenticated, user, router])

  const fetchUsers = async () => {
    if (!token) return

    try {
      const data = await getAllUsers(token)
      setUsers(data.users)
      setStats(data.stats)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

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
            <h1 className="text-4xl font-bold text-balance text-gray-900">Admin Dashboard</h1>
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
              <LogOut className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button onClick={handleLogout} className="bg-green-600 hover:bg-green-700 text-white">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.nurses || 0} nurses, {stats?.mothers || 0} mothers
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">Accounts in good standing</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats?.inactive || 0}</div>
              <p className="text-xs text-muted-foreground">Deactivated accounts</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Online</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats?.online || 0}</div>
              <p className="text-xs text-muted-foreground">Active right now</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all users, nurses, and mothers in the system</CardDescription>
              </div>
              <Button onClick={() => setShowAddNurse(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Nurse
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <UserManagementTable users={users} onRefresh={fetchUsers} />
          </CardContent>
        </Card>
      </div>

      <AddNurseDialog open={showAddNurse} onOpenChange={setShowAddNurse} onSuccess={fetchUsers} />
    </div>
  )
}
