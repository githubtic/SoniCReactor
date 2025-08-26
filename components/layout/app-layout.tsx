"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { supabase } from "@/lib/supabase/client"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    async function getUser() {
      try {
        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Get the user's profile including role
          const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

          if (profile) {
            setUser({ ...user, ...profile })
            setIsAdmin(profile.role === "admin")
          } else {
            setUser(user)
          }
        }
      } catch (error) {
        console.error("Error getting user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Get the user's profile
        const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (profile) {
          setUser({ ...session.user, ...profile })
          setIsAdmin(profile.role === "admin")
        } else {
          setUser(session.user)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setIsAdmin(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Check if this is an auth page
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password"

  // If it's an auth page and user is already logged in, we still show the layout
  // but we could redirect them to dashboard instead

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar user={user} isAdmin={isAdmin} />
        <SidebarInset>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
