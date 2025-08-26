import type { Metadata } from "next"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, AudioWaveformIcon as Waveform, Cpu, Settings } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Admin Overview | SonicReactor",
  description: "System overview and statistics for SonicReactor administrators",
}

export default function AdminOverviewPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">Monitor system performance and recent activity</p>
        </div>
      </div>

      <div className="space-y-8">
        <DashboardStats />

        <div className="grid gap-8 md:grid-cols-3">
          <RecentActivity />

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Link href="/admin/investors" className="block">
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <Users className="h-8 w-8 mb-2 text-primary" />
                        <h3 className="font-medium">Manage Investors</h3>
                        <p className="text-sm text-muted-foreground mt-1">View and manage investor accounts</p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/admin/patterns" className="block">
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <Waveform className="h-8 w-8 mb-2 text-primary" />
                        <h3 className="font-medium">Sound Patterns</h3>
                        <p className="text-sm text-muted-foreground mt-1">Manage sound pattern library</p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/admin/devices" className="block">
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <Cpu className="h-8 w-8 mb-2 text-primary" />
                        <h3 className="font-medium">Device Management</h3>
                        <p className="text-sm text-muted-foreground mt-1">Monitor and configure devices</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                <div className="mt-6">
                  <Link href="/admin/settings" className="block">
                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
