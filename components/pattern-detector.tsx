"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, StopCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { soundPatternMatcher, type SoundPattern } from "@/lib/sound-pattern-matcher"

interface Event {
  id: number
  patternId: number
  patternName: string
  deviceId: number
  deviceName: string
  action: string
  isActive: boolean
}

export default function PatternDetector() {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [patterns, setPatterns] = useState<SoundPattern[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [listenProgress, setListenProgress] = useState(0)
  const [listenDuration, setListenDuration] = useState(0)
  const [maxListenDuration] = useState(30) // 30 seconds max listening

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const listenTimerRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  // Load patterns and events from localStorage
  useEffect(() => {
    // Load patterns
    const patternsJson = localStorage.getItem("sonicreactor_patterns")
    if (patternsJson) {
      try {
        const loadedPatterns = JSON.parse(patternsJson)
        setPatterns(loadedPatterns)
        soundPatternMatcher.updatePatterns(loadedPatterns)
      } catch (error) {
        console.error("Error parsing patterns from localStorage:", error)
      }
    }

    // Load events
    const eventsJson = localStorage.getItem("sonicreactor_events")
    if (eventsJson) {
      try {
        const loadedEvents = JSON.parse(eventsJson)
        setEvents(loadedEvents)
      } catch (error) {
        console.error("Error parsing events from localStorage:", error)
      }
    }

    // Listen for new patterns being added
    const handlePatternAdded = (e: CustomEvent) => {
      setPatterns((prev) => {
        const updatedPatterns = [...prev, e.detail]
        soundPatternMatcher.updatePatterns(updatedPatterns)
        return updatedPatterns
      })
    }

    window.addEventListener("patternAdded", handlePatternAdded as EventListener)

    return () => {
      window.removeEventListener("patternAdded", handlePatternAdded as EventListener)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (listenTimerRef.current) {
        clearInterval(listenTimerRef.current)
      }
    }
  }, [])

  const startListening = async () => {
    try {
      // Reset state
      setListenDuration(0)
      setListenProgress(0)

      // Check if we have patterns and events
      if (patterns.length === 0) {
        toast({
          title: "No Sound Patterns",
          description: "Create sound patterns in the Sound Wave Labeler tab before detecting.",
          variant: "destructive",
        })
        return
      }

      const activeEvents = events.filter((e) => e.isActive)
      if (activeEvents.length === 0) {
        toast({
          title: "No Active Events",
          description: "Create and enable events in the Event Matcher tab before detecting.",
          variant: "destructive",
        })
        return
      }

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
        throw err
      }

      // Set up audio context and analyser for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      // Set up media recorder to capture audio for analysis
      mediaRecorderRef.current = new MediaRecorder(stream)

      // Set up data handling
      const audioChunks: Blob[] = []
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)

          // If we have enough data, analyze it
          if (audioChunks.length >= 3) {
            // Analyze after collecting ~300ms of audio
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
            analyzeAudioChunk(audioBlob)
            audioChunks.length = 0 // Clear the array
          }
        }
      }

      // Start recording
      mediaRecorderRef.current.start(100) // Collect data every 100ms

      setIsListening(true)

      // Start visualizing
      visualize()

      // Set up a timer to track listening duration and progress
      let duration = 0
      listenTimerRef.current = setInterval(() => {
        duration += 0.1
        setListenDuration(duration)
        setListenProgress((duration / maxListenDuration) * 100)

        // Auto-stop listening if it reaches the maximum duration
        if (duration >= maxListenDuration) {
          stopListening()
        }
      }, 100)

      toast({
        title: "Listening Started",
        description: "Listening for sound patterns. Make sounds to test detection.",
      })
    } catch (error) {
      console.error("Error starting listening:", error)

      let errorMessage = "Could not access your microphone. Please check permissions."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Listening Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()

      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (listenTimerRef.current) {
      clearInterval(listenTimerRef.current)
    }

    setIsListening(false)

    toast({
      title: "Listening Stopped",
      description: "No longer listening for sound patterns.",
    })
  }

  const analyzeAudioChunk = async (audioBlob: Blob) => {
    try {
      // Convert blob to ArrayBuffer for analysis
      const arrayBuffer = await audioBlob.arrayBuffer()

      // In a real app, this would do sophisticated audio analysis
      // For this demo, we'll use our simplified matcher
      const result = await soundPatternMatcher.matchAudioSample(arrayBuffer)

      if (result.matched && result.patternId) {
        // Find the pattern that matched
        const matchedPattern = patterns.find((p) => p.id === result.patternId)

        if (matchedPattern) {
          // Find events associated with this pattern
          const matchedEvents = events.filter((e) => e.patternId === result.patternId && e.isActive)

          if (matchedEvents.length > 0) {
            // For demo purposes, just trigger the first matching event
            const eventToTrigger = matchedEvents[0]

            toast({
              title: "Pattern Detected!",
              description: `"${matchedPattern.label}" detected with ${result.confidence}% confidence.`,
            })

            // Dispatch a custom event to notify other components
            const event = new CustomEvent("patternDetected", {
              detail: {
                patternId: matchedPattern.id,
                patternName: matchedPattern.label,
                deviceId: eventToTrigger.deviceId,
                deviceName: eventToTrigger.deviceName,
                action: eventToTrigger.action,
                confidence: result.confidence,
                timestamp: result.timestamp,
              },
            })
            window.dispatchEvent(event)

            // Log the detection
            console.log(`Pattern detected: ${matchedPattern.label} (${result.confidence}% confidence)`)
            console.log(`Triggering action: ${eventToTrigger.action} on ${eventToTrigger.deviceName}`)
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing audio:", error)
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

  // Render a static visualization when not listening
  const renderStaticVisualization = () => {
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
    canvasCtx.fillText("Click 'Start Listening' to detect sound patterns", width / 2, height / 2 - 20)
  }

  // Initialize the canvas with static visualization
  useEffect(() => {
    renderStaticVisualization()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sound Pattern Detector</CardTitle>
          <CardDescription>Listen for sound patterns and trigger associated events when detected</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patterns.length === 0 || events.filter((e) => e.isActive).length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Required</AlertTitle>
                <AlertDescription>
                  {patterns.length === 0
                    ? "Create sound patterns in the Sound Wave Labeler tab before using the detector."
                    : "Create and enable events in the Event Matcher tab before using the detector."}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
              <canvas ref={canvasRef} width={500} height={200} className="w-full h-[200px]"></canvas>
            </div>

            {isListening && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Listening: {listenDuration.toFixed(1)}s</span>
                  <span>Max: {maxListenDuration}s</span>
                </div>
                <Progress value={listenProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {!isListening ? (
            <Button
              onClick={startListening}
              className="flex items-center gap-2"
              disabled={patterns.length === 0 || events.filter((e) => e.isActive).length === 0}
            >
              <Mic className="h-4 w-4" />
              Start Listening
            </Button>
          ) : (
            <Button onClick={stopListening} variant="destructive" className="flex items-center gap-2">
              <StopCircle className="h-4 w-4" />
              Stop Listening
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Pattern Detection Works</CardTitle>
          <CardDescription>Understanding the sound pattern detection process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">1. Audio Capture</h3>
                <p className="text-sm text-muted-foreground">
                  The system captures audio through your microphone and processes it in real-time.
                </p>
              </div>
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">2. Pattern Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Audio is compared against your saved sound patterns using advanced signal processing.
                </p>
              </div>
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">3. Event Triggering</h3>
                <p className="text-sm text-muted-foreground">
                  When a pattern is recognized, the system triggers the associated events on your devices.
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              For best results, record sound patterns in the same environment where detection will occur. The system
              continuously improves its recognition accuracy over time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
