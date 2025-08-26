"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Upload, Play, Square, AlertCircle, FileAudio } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function PatternDetectorPage() {
  const [activeTab, setActiveTab] = useState("record")
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)

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
      setAnalysisResult(null)

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
      setAnalysisResult(null)

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
      canvasCtx.fillText("Upload an audio file to analyze", width / 2, height / 2 - 20)
    }
  }

  // Initialize the canvas with static visualization
  useEffect(() => {
    renderStaticWaveform()

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [activeTab])

  const analyzeAudio = async () => {
    if (!audioBlob && !uploadedFile) {
      setError("Please record or upload an audio file first")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Create a FormData object to send the audio file
      const formData = new FormData()
      formData.append("audio", audioBlob || uploadedFile!)

      // Send the audio file to the server for analysis
      const response = await fetch("/api/audio/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze audio")
      }

      const result = await response.json()
      setAnalysisResult(result)

      // If a pattern was matched, execute the associated action
      if (result.matched_pattern && result.matched_pattern.id) {
        // Get events associated with this pattern
        const { data: events } = await supabase
          .from("events")
          .select("*")
          .eq("pattern_id", result.matched_pattern.id)
          .eq("is_active", true)

        if (events && events.length > 0) {
          // Execute the first matching event's action
          await fetch("/api/audio/execute-action", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventId: events[0].id,
              patternId: result.matched_pattern.id,
            }),
          })
        }
      }
    } catch (error) {
      console.error("Error analyzing audio:", error)
      setError(error instanceof Error ? error.message : "Failed to analyze audio")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Sound Pattern Detector</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Audio Source</CardTitle>
            <CardDescription>Record a new sound or upload an audio file for analysis</CardDescription>
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
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={analyzeAudio} disabled={isAnalyzing || (!audioBlob && !uploadedFile)} className="w-full">
              {isAnalyzing ? "Analyzing..." : "Analyze Audio"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Pattern matching results and waveform comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {!analysisResult ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileAudio className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Record or upload audio and click "Analyze Audio" to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Pattern Match Result</h3>

                  {analysisResult.matched_pattern ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pattern:</span>
                        <span className="font-medium">{analysisResult.matched_pattern.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <span className="font-medium">
                          {(analysisResult.matched_pattern.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No matching pattern found</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Waveform Comparison</h3>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Input Audio:</p>
                    <div className="border rounded-md overflow-hidden">
                      <img
                        src={analysisResult.waveform_images?.input || "/placeholder.svg"}
                        alt="Input waveform"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>

                  {analysisResult.matched_pattern && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Reference Pattern:</p>
                      <div className="border rounded-md overflow-hidden">
                        <img
                          src={analysisResult.waveform_images?.reference || "/placeholder.svg"}
                          alt="Reference waveform"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
