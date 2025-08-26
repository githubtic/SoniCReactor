"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Menu,
  AudioWaveformIcon as Waveform,
  Zap,
  Cpu,
  Settings,
  Users,
  BarChart3,
  ShieldAlert,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useMobile } from "@/hooks/use-mobile"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  submenu?: NavItem[]
  isExpanded?: boolean
}

export function AppSidebar() {
  const pathname = usePathname()
  const { toast } = useToast()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [navItems, setNavItems] = useState<NavItem[]>([])

  // Initialize navigation items
  useEffect(() => {
    const items: NavItem[] = [
      {
        title: "Navigation",
        href: "",
        icon: <Home className="h-4 w-4" />,
        submenu: [
          {
            title: "Dashboard",
            href: "/dashboard",
            icon: <Home className="h-4 w-4" />,
          },
          {
            title: "Settings",
            href: "/settings",
            icon: <Settings className="h-4 w-4" />,
          },
        ],
        isExpanded: true,
      },
      {
        title: "Sound Tools",
        href: "",
        icon: <Waveform className="h-4 w-4" />,
        submenu: [
          {
            title: "Pattern Detector",
            href: "/dashboard/pattern-detector",
            icon: <Waveform className="h-4 w-4" />,
          },
          {
            title: "Sound Wave Labeler",
            href: "/dashboard/sound-wave-labeler",
            icon: <Zap className="h-4 w-4" />,
          },
          {
            title: "Event Matcher",
            href: "/dashboard/event-matcher",
            icon: <Zap className="h-4 w-4" />,
          },
          {
            title: "Device Connector",
            href: "/dashboard/device-connector",
            icon: <Cpu className="h-4 w-4" />,
          },
        ],
        isExpanded: true,
      },
      {
        title: "Admin",
        href: "",
        icon: <ShieldAlert className="h-4 w-4" />,
        adminOnly: true,
        submenu: [
          {
            title: "System Overview",
            href: "/admin/overview",
            icon: <BarChart3 className="h-4 w-4" />,
          },
          {
            title: "Investor Management",
            href: "/admin/investors",
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: "Pattern Management",
            href: "/admin/patterns",
            icon: <Waveform className="h-4 w-4" />,
          },
          {
            title: "Device Management",
            href: "/admin/devices",
            icon: <Cpu className="h-4 w-4" />,
          },
        ],
        isExpanded: false,
      },
    ]

    setNavItems(items)
  }, [])

  // Check user and admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)

        // Check if user is admin
        const { data: userData } = await supabase.from("users").select("role").eq("id", data.user.id).single()

        setIsAdmin(userData?.role === "admin")
      }
    }

    checkUser()
  }, [])

  const toggleSubmenu = (index: number) => {
    setNavItems((prev) => prev.map((item, i) => (i === index ? { ...item, isExpanded: !item.isExpanded } : item)))
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      })
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out",
        variant: "destructive",
      })
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Waveform className="h-6 w-6" />
          <span>SonicReactor</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map(
            (section, sectionIndex) =>
              (!section.adminOnly || isAdmin) && (
                <div key={section.title} className="mb-4">
                  <div
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground"
                    onClick={() => section.submenu && toggleSubmenu(sectionIndex)}
                  >
                    <div className="flex items-center gap-1">
                      {section.icon}
                      <span>{section.title}</span>
                    </div>
                    {section.submenu &&
                      (section.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                  </div>

                  {section.submenu && section.isExpanded && (
                    <div className="mt-1 pl-4 grid gap-1">
                      {section.submenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => isMobile && setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            pathname === item.href
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                          {item.title === "System Overview" && (
                            <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                              5
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ),
          )}
        </nav>
      </ScrollArea>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="grid gap-0.5">
            <div className="text-sm font-medium">{user?.email || "User"}</div>
            {isAdmin && (
              <div className="flex items-center text-xs text-muted-foreground">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Admin
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="absolute left-4 top-4 z-40 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div className="hidden border-r bg-background md:block">
      <SidebarContent />
    </div>
  )
}
