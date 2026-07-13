"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

// Routes that should render WITHOUT the dashboard sidebar shell
// (public marketing + auth pages).
const PUBLIC_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/dev-login"]

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()

  // The landing page ("/") and all auth pages render on their own.
  const isPublicPage = pathname === "/" || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isPublicPage) {
    return <>{children}</>
  }

  // Dashboard / admin routes get the sidebar shell. The sidebar manages
  // its own user/admin state internally.
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
