import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// This route is for development purposes only and should be disabled in production
export async function GET(request: Request) {
  // Check if we're in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
  }

  try {
    const supabase = createServerSupabaseClient()

    // Use a predefined admin email and password
    // In a real app, these would be environment variables
    const email = "admin@example.com"
    const password = "password123"

    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // If the user doesn't exist, create one
      if (error.message.includes("Invalid login credentials")) {
        // Create a new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          return NextResponse.json({ error: signUpError.message }, { status: 500 })
        }

        // If user was created, make them an admin
        if (signUpData.user) {
          // Confirm email directly (admin only operation)
          await supabase.auth.admin.updateUserById(signUpData.user.id, {
            email_confirmed_at: new Date().toISOString(),
          })

          // Insert into users table with admin role
          await supabase.from("users").insert({
            id: signUpData.user.id,
            email,
            full_name: "Admin User",
            role: "admin",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          // Sign in with the newly created user
          const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (newSignInError) {
            return NextResponse.json({ error: newSignInError.message }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            message: "Dev admin user created and signed in",
            redirectTo: "/dashboard",
          })
        }
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dev login successful",
      redirectTo: "/dashboard",
    })
  } catch (error: any) {
    console.error("Dev login error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
