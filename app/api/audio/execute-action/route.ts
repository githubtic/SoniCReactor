import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { exec } from "child_process"
import { promisify } from "util"
import { requireAdmin } from "@/lib/auth"

const execPromise = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    try {
      await requireAdmin()
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const supabase = createServerSupabaseClient()
    const { eventId, patternId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Get the event and associated action script
    const { data: event } = await supabase.from("events").select("*, action_scripts(*)").eq("id", eventId).single()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.is_active) {
      return NextResponse.json({ error: "Event is not active" }, { status: 400 })
    }

    // Get the action script
    const actionScript = event.action_scripts[0]

    if (!actionScript || !actionScript.is_active) {
      return NextResponse.json({ error: "No active action script found for this event" }, { status: 404 })
    }

    // In a real implementation, you would execute the script
    // For this example, we'll simulate the execution

    // Record the detection in history
    const { data: detectionRecord } = await supabase
      .from("detection_history")
      .insert({
        pattern_id: patternId,
        device_id: event.device_id,
        event_id: eventId,
        confidence: 0.87, // Example confidence
        action_executed: true,
        execution_result: "Action executed successfully",
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      message: "Action executed successfully",
      detectionId: detectionRecord.id,
    })
  } catch (error) {
    console.error("Error executing action:", error)
    return NextResponse.json({ error: "Failed to execute action" }, { status: 500 })
  }
}
