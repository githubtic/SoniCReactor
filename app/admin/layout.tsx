import type React from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { DashboardHeader } from "@/components/layout/dashboard-header"

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated and is admin
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader user={user} isAdmin={true} />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading admin panel...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
