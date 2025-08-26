import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = createServerSupabaseClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Try to get the user's profile including role
    try {
      const { data: profile, error } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (error) {
        console.warn("Error fetching user profile:", error)
        // If we can't get the profile, return basic user info with default role
        return {
          ...user,
          role: "user", // Default role
        }
      }

      if (profile) {
        return {
          ...user,
          ...profile,
        }
      }
    } catch (error) {
      console.error("Error getting user profile:", error)
      // If we can't get the profile, return basic user info with default role
    }

    // Return basic user info if we can't get the profile
    return {
      ...user,
      role: "user", // Default role
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function isAdmin() {
  try {
    const user = await getCurrentUser()
    return user?.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

export async function requireAdmin() {
  try {
    const isUserAdmin = await isAdmin()

    if (!isUserAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    return true
  } catch (error) {
    console.error("Admin check failed:", error)
    throw error
  }
}
