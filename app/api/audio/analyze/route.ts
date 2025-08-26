import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { requireAdmin } from "@/lib/auth"

const execPromise = promisify(exec)

// Temporary directory for uploaded files
const TEMP_DIR = path.join(process.cwd(), "tmp")

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    try {
      await requireAdmin()
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Get form data with audio file
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Create a unique filename
    const fileExtension = audioFile.name.split(".").pop() || "wav"
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = path.join(TEMP_DIR, fileName)

    // Save the file
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    // Call Python script for analysis
    // In a real implementation, you would have a Python script that analyzes the audio
    // For this example, we'll simulate the response

    // Simulate calling Python script
    // const { stdout } = await execPromise(`python analyze_audio.py "${filePath}"`)

    // Simulate Python script output
    const simulatedOutput = JSON.stringify({
      matched_pattern: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        label: "Office Door Opening",
        confidence: 0.87,
      },
      waveform_images: {
        input: `/api/waveform/${fileName}`,
        reference: `/api/waveform/reference_550e8400-e29b-41d4-a716-446655440000.png`,
      },
    })

    // Parse the output
    const analysisResult = JSON.parse(simulatedOutput)

    // Clean up the temporary file
    fs.unlinkSync(filePath)

    // Return the analysis result
    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Error analyzing audio:", error)
    return NextResponse.json({ error: "Failed to analyze audio file" }, { status: 500 })
  }
}
