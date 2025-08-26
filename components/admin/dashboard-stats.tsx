"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, AudioWaveformIcon as Waveform, Cpu, Activity } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface StatsData {
  userCount: number
  patternCount: number
  deviceCount: number
  detectionCount: number
  loading: boolean
  error: string | null
}

export function DashboardStats() {
  const [stats, setStats] = useState<StatsData>({
    userCount: 0,
    patternCount: 0,
    deviceCount: 0,
    detectionCount: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch user count
        const { count: userCount, error: userError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })

        if (userError) throw userError

        // Fetch pattern count
        const { count: patternCount, error: patternError } = await supabase
          .from("sound_patterns")
          .select("*", { count: "exact", head: true })

        if (patternError) throw patternError

        // Fetch device count
        const { count: deviceCount, error: deviceError } = await supabase
          .from("devices")
          .select("*", { count: "exact", head: true })

        if (deviceError) throw deviceError

        // Fetch detection count
        const { count: detectionCount, error: detectionError } = await supabase
          .from("detection_history")
          .select("*", { count: "exact", head: true })

        if (detectionError) throw detectionError

        setStats({
          userCount: userCount || 0,
          patternCount: patternCount || 0,
          deviceCount: deviceCount || 0,
          detectionCount: detectionCount || 0,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load dashboard statistics",
        }))
      }
    }

    fetchStats()
  }, [])

  if (stats.error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {stats.error}</span>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.loading ? (
            <Skeleton className="h-8 w-[60px]" />
          ) : (
            <div className="text-2xl font-bold">{stats.userCount}</div>
          )}
          <p className="text-xs text-muted-foreground">Registered users in the system</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sound Patterns</CardTitle>
          <Waveform className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.loading ? (
            <Skeleton className="h-8 w-[60px]" />
          ) : (
            <div className="text-2xl font-bold">{stats.patternCount}</div>
          )}
          <p className="text-xs text-muted-foreground">Registered sound patterns</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.loading ? (
            <Skeleton className="h-8 w-[60px]" />
          ) : (
            <div className="text-2xl font-bold">{stats.deviceCount}</div>
          )}
          <p className="text-xs text-muted-foreground">Registered IoT devices</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pattern Detections</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.loading ? (
            <Skeleton className="h-8 w-[60px]" />
          ) : (
            <div className="text-2xl font-bold">{stats.detectionCount}</div>
          )}
          <p className="text-xs text-muted-foreground">Total pattern detections</p>
        </CardContent>
      </Card>
    </div>
  )
}
