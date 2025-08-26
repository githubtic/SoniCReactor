import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Instead of directly querying auth.users, use the admin API to get users by email
    const {
      data: { users },
      error: getUserError,
    } = await supabase.auth.admin.listUsers({
      filter: {
        email: email,
      },
    })

    if (getUserError) {
      console.error("Error finding user:", getUserError)
      return NextResponse.json({ error: "Error finding user" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // For development purposes only, we'll update the user's email_confirmed_at
    // This is a workaround and should not be used in production
    const timestamp = new Date().toISOString()

    // This requires admin privileges via the service role key
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirmed_at: timestamp,
    })

    if (updateError) {
      console.error("Error confirming email:", updateError)
      return NextResponse.json({ error: "Failed to confirm email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Bypass confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
