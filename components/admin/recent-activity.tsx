"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: "detection" | "device" | "investor"
  title: string
  description: string
  timestamp: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        // Fetch recent detections
        const { data: detections, error: detectionsError } = await supabase
          .from("detection_history")
          .select("id, pattern_id, confidence, created_at, sound_patterns(label)")
          .order("created_at", { ascending: false })
          .limit(3)

        if (detectionsError) throw detectionsError

        // Fetch recent device activities
        const { data: deviceActivities, error: deviceError } = await supabase
          .from("device_activity_log")
          .select("id, device_id, action, status, created_at, devices(name)")
          .order("created_at", { ascending: false })
          .limit(3)

        if (deviceError) throw deviceError

        // Fetch recent investors
        const { data: investors, error: investorsError } = await supabase
          .from("investors")
          .select("id, name, email, amount, created_at")
          .order("created_at", { ascending: false })
          .limit(3)

        if (investorsError) throw investorsError

        // Format detections
        const formattedDetections: ActivityItem[] = (detections || []).map((detection) => ({
          id: `detection-${detection.id}`,
          type: "detection",
          title: `Pattern Detected: ${detection.sound_patterns?.label || "Unknown"}`,
          description: `Confidence: ${Math.round(detection.confidence * 100)}%`,
          timestamp: detection.created_at,
        }))

        // Format device activities
        const formattedDeviceActivities: ActivityItem[] = (deviceActivities || []).map((activity) => ({
          id: `device-${activity.id}`,
          type: "device",
          title: `Device: ${activity.devices?.name || "Unknown"}`,
          description: `Action: ${activity.action} (${activity.status})`,
          timestamp: activity.created_at,
        }))

        // Format investors
        const formattedInvestors: ActivityItem[] = (investors || []).map((investor) => ({
          id: `investor-${investor.id}`,
          type: "investor",
          title: `New Investor: ${investor.name}`,
          description: `Amount: $${investor.amount.toLocaleString()}`,
          timestamp: investor.created_at,
        }))

        // Combine and sort by timestamp
        const allActivities = [...formattedDetections, ...formattedDeviceActivities, ...formattedInvestors].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )

        setActivities(allActivities.slice(0, 5))
        setLoading(false)
      } catch (error) {
        console.error("Error fetching recent activity:", error)
        setError("Failed to load recent activity")
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system events and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {loading ? (
            // Loading skeletons
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4 space-y-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))
          ) : activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recent activity found</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <div className="relative mr-4">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      activity.type === "detection"
                        ? "bg-blue-100 text-blue-600"
                        : activity.type === "device"
                          ? "bg-green-100 text-green-600"
                          : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {activity.type === "detection" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12h2" />
                        <path d="M6 8v8" />
                        <path d="M10 4v16" />
                        <path d="M14 9v6" />
                        <path d="M18 6v12" />
                        <path d="M22 12h-2" />
                      </svg>
                    ) : activity.type === "device" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <rect x="9" y="9" width="6" height="6" />
                        <path d="M15 2v2" />
                        <path d="M15 20v2" />
                        <path d="M2 15h2" />
                        <path d="M20 15h2" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v20" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium">{activity.title}</h5>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
