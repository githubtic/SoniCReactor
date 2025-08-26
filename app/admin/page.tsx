import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, PieChart } from "@/components/ui/charts"
import { isAdmin } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import AdminLayout from "@/components/admin/admin-layout"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

async function AdminDashboardContent() {
  try {
    // Check if user is admin
    const admin = await isAdmin()
    if (!admin) {
      redirect("/login")
    }

    const supabase = createServerSupabaseClient()

    // Fetch dashboard data with error handling
    const [investorsResult, patternsResult, devicesResult, detectionsResult] = await Promise.allSettled([
      supabase.from("investors").select("*", { count: "exact", head: true }),
      supabase.from("sound_patterns").select("*", { count: "exact", head: true }),
      supabase.from("devices").select("*", { count: "exact", head: true }),
      supabase.from("detection_history").select("*", { count: "exact", head: true }),
    ])

    const investorsCount = investorsResult.status === "fulfilled" ? investorsResult.value.count : 0
    const patternsCount = patternsResult.status === "fulfilled" ? patternsResult.value.count : 0
    const devicesCount = devicesResult.status === "fulfilled" ? devicesResult.value.count : 0
    const detectionsCount = detectionsResult.status === "fulfilled" ? detectionsResult.value.count : 0

    // Fetch recent detections with error handling
    let recentDetections = []
    try {
      const { data } = await supabase
        .from("detection_history")
        .select(`
          id,
          confidence,
          action_executed,
          detected_at,
          sound_patterns (label),
          devices (name)
        `)
        .order("detected_at", { ascending: false })
        .limit(5)

      recentDetections = data || []
    } catch (error) {
      console.error("Error fetching recent detections:", error)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of your SonicReactor system and analytics</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/patterns/new">
              <Button>Add New Pattern</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investorsCount}</div>
              <p className="text-xs text-muted-foreground">+10% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sound Patterns</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M2 10h20M2 14h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patternsCount}</div>
              <p className="text-xs text-muted-foreground">+12 new patterns this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devicesCount}</div>
              <p className="text-xs text-muted-foreground">+3 devices since last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pattern Detections</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{detectionsCount}</div>
              <p className="text-xs text-muted-foreground">+24% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Detection Analytics</CardTitle>
              <CardDescription>Pattern detection frequency over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <LineChart />
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Pattern Distribution</CardTitle>
              <CardDescription>Breakdown of detected sound patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <PieChart />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Detections</CardTitle>
            <CardDescription>Latest sound pattern detections across your devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Pattern</th>
                    <th className="text-left p-2">Device</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Action Executed</th>
                    <th className="text-left p-2">Detected At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDetections.map((detection) => (
                    <tr key={detection.id} className="border-b">
                      <td className="p-2">{detection.sound_patterns?.label || "Unknown"}</td>
                      <td className="p-2">{detection.devices?.name || "Unknown"}</td>
                      <td className="p-2">
                        {detection.confidence ? `${(detection.confidence * 100).toFixed(1)}%` : "N/A"}
                      </td>
                      <td className="p-2">{detection.action_executed ? "Yes" : "No"}</td>
                      <td className="p-2">{new Date(detection.detected_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {recentDetections.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No recent detections found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error in AdminDashboardContent:", error)
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Error Loading Dashboard</h1>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    )
  }
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <AdminDashboardContent />
      </Suspense>
    </AdminLayout>
  )
}
