import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isAdmin } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import AdminLayout from "@/components/admin/admin-layout"

async function PatternsContent() {
  // Check if user is admin
  const admin = await isAdmin()
  if (!admin) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Fetch sound patterns
  const { data: patterns } = await supabase
    .from("sound_patterns")
    .select("*, users(full_name)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sound Patterns</h1>
          <p className="text-muted-foreground">Manage and analyze sound patterns for detection</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/patterns/new">
            <Button>Add New Pattern</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pattern Library</CardTitle>
          <CardDescription>All sound patterns available for detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Label</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-left p-2">Created By</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patterns?.map((pattern) => (
                  <tr key={pattern.id} className="border-b">
                    <td className="p-2 font-medium">{pattern.label}</td>
                    <td className="p-2">{pattern.description || "No description"}</td>
                    <td className="p-2">{pattern.duration ? `${pattern.duration.toFixed(1)}s` : "N/A"}</td>
                    <td className="p-2">{pattern.users?.full_name || "System"}</td>
                    <td className="p-2 text-center">
                      <Badge variant={pattern.is_active ? "default" : "secondary"}>
                        {pattern.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-2">{new Date(pattern.created_at).toLocaleDateString()}</td>
                    <td className="p-2 text-right">
                      <Link href={`/admin/patterns/${pattern.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!patterns || patterns.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      No sound patterns found
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
}

export default function PatternsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading patterns...</div>}>
        <PatternsContent />
      </Suspense>
    </AdminLayout>
  )
}
