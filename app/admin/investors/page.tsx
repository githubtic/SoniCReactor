import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isAdmin } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import AdminLayout from "@/components/admin/admin-layout"

async function InvestorsContent() {
  // Check if user is admin
  const admin = await isAdmin()
  if (!admin) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Fetch investors
  const { data: investors } = await supabase.from("investors").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
          <p className="text-muted-foreground">Manage investor information and track investment status</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/investors/export">
            <Button variant="outline">Export Data</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investor List</CardTitle>
          <CardDescription>All investors who have expressed interest in SonicReactor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {investors?.map((investor) => (
                  <tr key={investor.id} className="border-b">
                    <td className="p-2 font-medium">{investor.name}</td>
                    <td className="p-2">{investor.email}</td>
                    <td className="p-2">{investor.phone || "N/A"}</td>
                    <td className="p-2 text-right">${investor.amount.toLocaleString()}</td>
                    <td className="p-2 text-center">
                      <Badge
                        variant={
                          investor.status === "approved"
                            ? "success"
                            : investor.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {investor.status.charAt(0).toUpperCase() + investor.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-2">{new Date(investor.created_at).toLocaleDateString()}</td>
                    <td className="p-2 text-right">
                      <Link href={`/admin/investors/${investor.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!investors || investors.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      No investors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investment Summary</CardTitle>
          <CardDescription>Overview of investment interest by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Pending</div>
              <div className="text-2xl font-bold">
                $
                {investors
                  ?.filter((i) => i.status === "pending")
                  .reduce((sum, i) => sum + i.amount, 0)
                  .toLocaleString() || "0"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {investors?.filter((i) => i.status === "pending").length || 0} investors
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Approved</div>
              <div className="text-2xl font-bold text-green-600">
                $
                {investors
                  ?.filter((i) => i.status === "approved")
                  .reduce((sum, i) => sum + i.amount, 0)
                  .toLocaleString() || "0"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {investors?.filter((i) => i.status === "approved").length || 0} investors
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Rejected</div>
              <div className="text-2xl font-bold text-red-600">
                $
                {investors
                  ?.filter((i) => i.status === "rejected")
                  .reduce((sum, i) => sum + i.amount, 0)
                  .toLocaleString() || "0"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {investors?.filter((i) => i.status === "rejected").length || 0} investors
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvestorsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading investors...</div>}>
        <InvestorsContent />
      </Suspense>
    </AdminLayout>
  )
}
