import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { requireAdmin } from "@/lib/auth"

const execPromise = promisify(exec)

// Temporary directory for scripts
const SCRIPTS_DIR = path.join(process.cwd(), "tmp", "scripts")

// Ensure scripts directory exists
if (!fs.existsSync(SCRIPTS_DIR)) {
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    try {
      await requireAdmin()
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const { scriptId, params } = await request.json()

    if (!scriptId) {
      return NextResponse.json({ error: "Script ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the script from the database
    const { data: script } = await supabase.from("action_scripts").select("*").eq("id", scriptId).single()

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 })
    }

    if (!script.is_active) {
      return NextResponse.json({ error: "Script is not active" }, { status: 400 })
    }

    // Create a temporary script file
    const scriptFileName = `${uuidv4()}.${script.script_type === "python" ? "py" : script.script_type === "javascript" ? "js" : "sh"}`
    const scriptPath = path.join(SCRIPTS_DIR, scriptFileName)

    // Write the script content to the file
    fs.writeFileSync(scriptPath, script.script_content)

    // Make the script executable if it's a bash script
    if (script.script_type === "bash") {
      fs.chmodSync(scriptPath, "755")
    }

    // Prepare the command to execute the script
    let command
    switch (script.script_type) {
      case "python":
        command = `python "${scriptPath}" ${params ? params.join(" ") : ""}`
        break
      case "javascript":
        command = `node "${scriptPath}" ${params ? params.join(" ") : ""}`
        break
      case "bash":
        command = `"${scriptPath}" ${params ? params.join(" ") : ""}`
        break
      default:
        throw new Error(`Unsupported script type: ${script.script_type}`)
    }

    // Execute the script
    const { stdout, stderr } = await execPromise(command)

    // Clean up the temporary script file
    fs.unlinkSync(scriptPath)

    // Return the script output
    return NextResponse.json({
      success: true,
      output: stdout,
      error: stderr || null,
    })
  } catch (error) {
    console.error("Error executing script:", error)
    return NextResponse.json({ error: "Failed to execute script" }, { status: 500 })
  }
}
