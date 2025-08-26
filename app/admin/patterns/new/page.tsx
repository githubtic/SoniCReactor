"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Upload, Save, Play, Square } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import AdminLayout from "@/components/admin/admin-layout"

export default function NewPatternPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("record")
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [processCode, setProcessCode] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize audio element for playback
  if (typeof window !== "undefined" && !audioElementRef.current) {
    audioElementRef.current = new Audio()
  }

  const startRecording = async () => {
    try {
      // Reset previous recording data
      audioChunksRef.current = []
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingDuration(0)

      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices API not supported in this browser")
      }

      // Try to get the audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio context and analyser
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      // Set up media recorder with audio/webm MIME type
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      // Set up event handlers for the media recorder
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        // Create a blob from all the chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(audioBlob)

        // Create a URL for the blob
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioUrl(audioUrl)

        // Set up the audio element for playback
        if (audioElementRef.current) {
          audioElementRef.current.src = audioUrl
        }
      }

      // Start recording
      mediaRecorderRef.current.start(100) // Collect data every 100ms

      setIsRecording(true)

      // Start visualizing
      visualize()

      // Set up a timer to track recording duration
      let duration = 0
      recordingTimerRef.current = setInterval(() => {
        duration += 0.1
        setRecordingDuration(duration)
      }, 100)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setError(error instanceof Error ? error.message : "Failed to access microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()

      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())

      setIsRecording(false)

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const playAudio = () => {
    if (audioElementRef.current && (audioUrl || uploadedFile)) {
      audioElementRef.current.play()
      setIsPlaying(true)

      audioElementRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }

  const stopAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check if file is an audio file
      if (!file.type.startsWith("audio/")) {
        setError("Please upload an audio file")
        return
      }

      setUploadedFile(file)

      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file)
      setAudioUrl(fileUrl)

      // Set up the audio element for playback
      if (audioElementRef.current) {
        audioElementRef.current.src = fileUrl

        // Get duration when metadata is loaded
        audioElementRef.current.onloadedmetadata = () => {
          if (audioElementRef.current) {
            setRecordingDuration(audioElementRef.current.duration)
          }
        }
      }

      // Clear any previous recording
      setAudioBlob(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    if (!canvasCtx) return

    const width = canvas.width
    const height = canvas.height

    const draw = () => {
      requestAnimationFrame(draw)

      analyserRef.current!.getByteTimeDomainData(dataArrayRef.current!)

      canvasCtx.fillStyle = "rgb(240, 240, 240)"
      canvasCtx.fillRect(0, 0, width, height)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = "rgb(0, 125, 255)"
      canvasCtx.beginPath()

      const sliceWidth = width / dataArrayRef.current!.length
      let x = 0

      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        const v = dataArrayRef.current![i] / 128.0
        const y = (v * height) / 2

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      canvasCtx.lineTo(width, height / 2)
      canvasCtx.stroke()
    }

    draw()
  }

  const renderStaticWaveform = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    if (!canvasCtx) return

    const width = canvas.width
    const height = canvas.height

    // Clear the canvas
    canvasCtx.fillStyle = "rgb(240, 240, 240)"
    canvasCtx.fillRect(0, 0, width, height)

    // Draw a flat line
    canvasCtx.lineWidth = 2
    canvasCtx.strokeStyle = "rgb(180, 180, 180)"
    canvasCtx.beginPath()
    canvasCtx.moveTo(0, height / 2)
    canvasCtx.lineTo(width, height / 2)
    canvasCtx.stroke()

    // Add text
    canvasCtx.font = "14px Arial"
    canvasCtx.fillStyle = "rgb(100, 100, 100)"
    canvasCtx.textAlign = "center"

    if (activeTab === "record") {
      canvasCtx.fillText('Click "Start Recording" to record a sound pattern', width / 2, height / 2 - 20)
    } else {
      canvasCtx.fillText("Upload an audio file to visualize the waveform", width / 2, height / 2 - 20)
    }
  }

  // Initialize the canvas with static visualization
  if (typeof window !== "undefined" && canvasRef.current) {
    renderStaticWaveform()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!label) {
      setError("Pattern label is required")
      return
    }

    if (!audioBlob && !uploadedFile) {
      setError("Please record or upload an audio file")
      return
    }

    setIsSubmitting(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to create a pattern")
      }

      // Upload the audio file to storage
      const audioFile = audioBlob || uploadedFile
      const fileExt = audioBlob ? "webm" : uploadedFile?.name.split(".").pop() || "wav"
      const filePath = `patterns/${user.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("audio").upload(filePath, audioFile!)

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("audio").getPublicUrl(filePath)

      // Create the sound pattern record
      const { data: pattern, error: patternError } = await supabase.from("sound_patterns").insert({
        label,
        description,
        process_code: processCode || null,
        audio_url: publicUrl,
        duration: recordingDuration,
        is_active: isActive,
        created_by: user.id,
      })

      if (patternError) {
        throw patternError
      }

      // Generate a waveform image (in a real implementation)
      // This would call a server function to generate a waveform image

      // Success! Redirect to the patterns list
      router.push("/admin/patterns")
    } catch (error) {
      console.error("Error creating pattern:", error)
      setError(error instanceof Error ? error.message : "Failed to create pattern")
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Sound Pattern</h1>
          <p className="text-muted-foreground">Record or upload a sound pattern for detection</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pattern Information</CardTitle>
                <CardDescription>Enter details about the sound pattern</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Pattern Label</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Office Door Opening"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the sound pattern and when it occurs"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process-code">Process Code (Optional)</Label>
                  <Input
                    id="process-code"
                    placeholder="e.g., trigger_welcome_message"
                    value={processCode}
                    onChange={(e) => setProcessCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a code that will be executed when this sound pattern is detected
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="is-active">Pattern is active and available for detection</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audio Source</CardTitle>
                <CardDescription>Record a new sound pattern or upload an existing audio file</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="record">Record Audio</TabsTrigger>
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                  </TabsList>

                  <TabsContent value="record" className="space-y-4">
                    <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
                      <canvas ref={canvasRef} width={500} height={200} className="w-full h-[200px]"></canvas>
                    </div>

                    <div className="flex justify-center gap-4">
                      {!isRecording ? (
                        <Button type="button" onClick={startRecording} className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={stopRecording}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Square className="h-4 w-4" />
                          Stop Recording
                        </Button>
                      )}

                      {audioUrl && !isPlaying && (
                        <Button type="button" onClick={playAudio} variant="outline" className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Play
                        </Button>
                      )}

                      {isPlaying && (
                        <Button type="button" onClick={stopAudio} variant="outline" className="flex items-center gap-2">
                          <Square className="h-4 w-4" />
                          Stop
                        </Button>
                      )}
                    </div>

                    {recordingDuration > 0 && (
                      <p className="text-center text-sm">Recording duration: {recordingDuration.toFixed(1)} seconds</p>
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
                      <canvas ref={canvasRef} width={500} height={200} className="w-full h-[200px]"></canvas>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        onClick={triggerFileInput}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Audio File
                      </Button>

                      {uploadedFile && (
                        <div className="text-center">
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                            {recordingDuration > 0 && ` • ${recordingDuration.toFixed(1)} seconds`}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-4">
                        {audioUrl && !isPlaying && (
                          <Button
                            type="button"
                            onClick={playAudio}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Play className="h-4 w-4" />
                            Play
                          </Button>
                        )}

                        {isPlaying && (
                          <Button
                            type="button"
                            onClick={stopAudio}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Square className="h-4 w-4" />
                            Stop
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/patterns")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!audioBlob && !uploadedFile)}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Pattern
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
