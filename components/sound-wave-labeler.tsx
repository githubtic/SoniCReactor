"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, StopCircle, Save, Play, Square } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function SoundWaveLabeler() {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [label, setLabel] = useState("")
  const [processCode, setProcessCode] = useState("")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [maxRecordingDuration] = useState(10) // 10 seconds max recording

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const animationFrameRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio element for playback
    audioElementRef.current = new Audio()

    // Check if the browser supports the MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support audio recording. Please try a different browser.",
        variant: "destructive",
      })
      simulateWaveform()
      return
    }

    // Check if microphones are available
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const hasMicrophone = devices.some((device) => device.kind === "audioinput")
        if (!hasMicrophone) {
          toast({
            title: "No Microphone Detected",
            description: "No microphone found. Connect a microphone to record sound patterns.",
            variant: "destructive",
          })
          simulateWaveform()
        }
      })
      .catch((err) => {
        console.error("Error checking for audio devices:", err)
      })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      // Reset previous recording data
      audioChunksRef.current = []
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingDuration(0)
      setRecordingProgress(0)

      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices API not supported in this browser")
      }

      // Try to get the audio stream
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err) {
        // Handle specific error types
        if (err instanceof DOMException) {
          if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            throw new Error("No microphone found. Please connect a microphone and try again.")
          } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            throw new Error("Microphone permission denied. Please allow microphone access and try again.")
          } else if (err.name === "AbortError" || err.name === "NotReadableError") {
            throw new Error("Microphone is already in use or not functioning properly.")
          }
        }
        // If it's another type of error, rethrow it
        throw err
      }

      // If we get here, we have a valid stream
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

        toast({
          title: "Recording Saved",
          description: `${recordingDuration.toFixed(1)} seconds of audio captured.`,
        })
      }

      // Start recording
      mediaRecorderRef.current.start(100) // Collect data every 100ms

      setIsRecording(true)

      // Start visualizing
      visualize()

      // Set up a timer to track recording duration and progress
      let duration = 0
      recordingTimerRef.current = setInterval(() => {
        duration += 0.1
        setRecordingDuration(duration)
        setRecordingProgress((duration / maxRecordingDuration) * 100)

        // Auto-stop recording if it reaches the maximum duration
        if (duration >= maxRecordingDuration) {
          stopRecording()
        }
      }, 100)

      toast({
        title: "Recording Started",
        description: "Speak now to record your sound pattern.",
      })
    } catch (error) {
      console.error("Error accessing microphone:", error)

      // Provide a more specific error message to the user
      let errorMessage = "Could not access your microphone. Please check permissions."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive",
      })

      // Create a simulated waveform if no microphone is available
      simulateWaveform()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()

      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())

      setIsRecording(false)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const playRecording = () => {
    if (audioElementRef.current && audioUrl) {
      audioElementRef.current.play()
      setIsPlaying(true)

      audioElementRef.current.onended = () => {
        setIsPlaying(false)
      }
    } else {
      toast({
        title: "No Recording",
        description: "Record a sound pattern first before playing.",
        variant: "destructive",
      })
    }
  }

  const stopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    if (!canvasCtx) return

    const width = canvas.width
    const height = canvas.height

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

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

  const simulateWaveform = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    if (!canvasCtx) return

    const width = canvas.width
    const height = canvas.height

    // Clear the canvas
    canvasCtx.fillStyle = "rgb(240, 240, 240)"
    canvasCtx.fillRect(0, 0, width, height)

    // Draw a static waveform to show the user what it would look like
    canvasCtx.lineWidth = 2
    canvasCtx.strokeStyle = "rgb(200, 200, 200)"
    canvasCtx.beginPath()

    const simulatedWaveform = []
    // Generate a simple sine wave pattern
    for (let i = 0; i < width; i++) {
      simulatedWaveform.push(Math.sin(i * 0.05) * 30 + height / 2)
    }

    for (let i = 0; i < simulatedWaveform.length; i++) {
      if (i === 0) {
        canvasCtx.moveTo(i, simulatedWaveform[i])
      } else {
        canvasCtx.lineTo(i, simulatedWaveform[i])
      }
    }

    canvasCtx.stroke()

    // Add text to inform the user
    canvasCtx.font = "14px Arial"
    canvasCtx.fillStyle = "rgb(100, 100, 100)"
    canvasCtx.textAlign = "center"
    canvasCtx.fillText("Microphone not available - Using simulated data", width / 2, 30)
  }

  const savePattern = async () => {
    if (!label) {
      toast({
        title: "Label Required",
        description: "Please provide a label for this sound pattern.",
        variant: "destructive",
      })
      return
    }

    // Check if we have a real recording or are using simulated data
    const isSimulated = !audioBlob

    try {
      // In a real application, you would upload the audio blob to your server
      // For this demo, we'll simulate saving to localStorage

      // Create a pattern object
      const pattern = {
        id: Date.now(),
        label,
        processCode: processCode || null,
        timestamp: new Date().toISOString(),
        duration: recordingDuration,
        isSimulated,
      }

      // Get existing patterns from localStorage
      const existingPatternsJson = localStorage.getItem("sonicreactor_patterns")
      const existingPatterns = existingPatternsJson ? JSON.parse(existingPatternsJson) : []

      // Add the new pattern
      existingPatterns.push(pattern)

      // Save back to localStorage
      localStorage.setItem("sonicreactor_patterns", JSON.stringify(existingPatterns))

      // If we have actual audio data, we would save it to a server
      // For this demo, we'll just simulate success

      toast({
        title: "Sound Pattern Saved",
        description: `Pattern "${label}" has been ${isSimulated ? "simulated and " : ""}saved successfully.`,
      })

      // Reset form
      setLabel("")
      setProcessCode("")
      setAudioBlob(null)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }

      // Trigger a custom event to notify other components that a new pattern was added
      const event = new CustomEvent("patternAdded", { detail: pattern })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error saving pattern:", error)
      toast({
        title: "Save Failed",
        description: "There was an error saving your sound pattern.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Record Sound Pattern</CardTitle>
          <CardDescription>Record a sound pattern to label and associate with a process or action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
              <canvas ref={canvasRef} width={500} height={200} className="w-full h-[200px]"></canvas>
            </div>

            {isRecording && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recording: {recordingDuration.toFixed(1)}s</span>
                  <span>Max: {maxRecordingDuration}s</span>
                </div>
                <Progress value={recordingProgress} className="h-2" />
              </div>
            )}

            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                  <StopCircle className="h-4 w-4" />
                  Stop Recording
                </Button>
              )}

              {audioUrl && !isPlaying && (
                <Button onClick={playRecording} variant="outline" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Play
                </Button>
              )}

              {isPlaying && (
                <Button onClick={stopPlayback} variant="outline" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Label Sound Pattern</CardTitle>
          <CardDescription>Add a label and associate a process code with this sound pattern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Pattern Label</Label>
              <Input
                id="label"
                placeholder="e.g., Office Door Opening"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="process-code">Process or Action Code (Optional)</Label>
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
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={savePattern} className="w-full flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Sound Pattern
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
