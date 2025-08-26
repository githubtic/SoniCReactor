import type React from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { DashboardHeader } from "@/components/layout/dashboard-header"

async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin()

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader user={user} isAdmin={userIsAdmin} />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
