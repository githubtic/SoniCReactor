"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Play, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Type definitions
interface SoundPattern {
  id: number
  label: string
  processCode: string | null
  timestamp: string
  duration: number
  isSimulated: boolean
}

interface Device {
  id: number
  name: string
  type: string
  status: string
  ipAddress: string
}

interface Event {
  id: number
  patternId: number
  patternName: string
  deviceId: number
  deviceName: string
  action: string
  isActive: boolean
}

// Sample devices data
const sampleDevices = [
  { id: 1, name: "Office Computer", type: "computer", status: "online", ipAddress: "192.168.1.101" },
  { id: 2, name: "Reception Phone", type: "phone", status: "online", ipAddress: "192.168.1.102" },
  { id: 3, name: "Meeting Room Tablet", type: "phone", status: "offline", ipAddress: "192.168.1.103" },
  { id: 4, name: "Front Desk Display", type: "computer", status: "online", ipAddress: "192.168.1.104" },
]

export default function EventMatcher() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [soundPatterns, setSoundPatterns] = useState<SoundPattern[]>([])
  const [devices, setDevices] = useState<Device[]>(sampleDevices)
  const [selectedPattern, setSelectedPattern] = useState<string>("")
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [actionDescription, setActionDescription] = useState<string>("")
  const [isSimulating, setIsSimulating] = useState(false)

  // Load saved patterns and events from localStorage
  useEffect(() => {
    // Load patterns
    const patternsJson = localStorage.getItem("sonicreactor_patterns")
    if (patternsJson) {
      try {
        const patterns = JSON.parse(patternsJson)
        setSoundPatterns(patterns)
      } catch (error) {
        console.error("Error parsing patterns from localStorage:", error)
      }
    }

    // Load events
    const eventsJson = localStorage.getItem("sonicreactor_events")
    if (eventsJson) {
      try {
        const savedEvents = JSON.parse(eventsJson)
        setEvents(savedEvents)
      } catch (error) {
        console.error("Error parsing events from localStorage:", error)
      }
    }

    // Listen for new patterns being added
    const handlePatternAdded = (e: CustomEvent) => {
      setSoundPatterns((prev) => [...prev, e.detail])
    }

    window.addEventListener("patternAdded", handlePatternAdded as EventListener)

    return () => {
      window.removeEventListener("patternAdded", handlePatternAdded as EventListener)
    }
  }, [])

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("sonicreactor_events", JSON.stringify(events))
  }, [events])

  const handleAddEvent = () => {
    if (!selectedPattern || !selectedDevice || !actionDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to create an event.",
        variant: "destructive",
      })
      return
    }

    const patternId = Number.parseInt(selectedPattern)
    const deviceId = Number.parseInt(selectedDevice)
    const patternName = soundPatterns.find((p) => p.id === patternId)?.label || ""
    const deviceName = devices.find((d) => d.id === deviceId)?.name || ""

    const newEvent = {
      id: Date.now(),
      patternId,
      patternName,
      deviceId,
      deviceName,
      action: actionDescription,
      isActive: true,
    }

    setEvents([...events, newEvent])

    // Reset form
    setSelectedPattern("")
    setSelectedDevice("")
    setActionDescription("")

    toast({
      title: "Event Created",
      description: "New event has been created successfully.",
    })
  }

  const handleToggleEvent = (id: number) => {
    setEvents(events.map((event) => (event.id === id ? { ...event, isActive: !event.isActive } : event)))

    const event = events.find((e) => e.id === id)
    if (event) {
      toast({
        title: event.isActive ? "Event Disabled" : "Event Enabled",
        description: `Event "${event.patternName}" has been ${event.isActive ? "disabled" : "enabled"}.`,
      })
    }
  }

  const handleDeleteEvent = (id: number) => {
    const event = events.find((e) => e.id === id)
    setEvents(events.filter((event) => event.id !== id))

    if (event) {
      toast({
        title: "Event Deleted",
        description: `Event "${event.patternName}" has been deleted.`,
      })
    }
  }

  const simulatePatternDetection = () => {
    if (events.length === 0) {
      toast({
        title: "No Events Configured",
        description: "Create at least one event before simulating pattern detection.",
        variant: "destructive",
      })
      return
    }

    setIsSimulating(true)

    // Randomly select an active event to simulate
    const activeEvents = events.filter((event) => event.isActive)

    if (activeEvents.length === 0) {
      toast({
        title: "No Active Events",
        description: "Enable at least one event before simulating pattern detection.",
        variant: "destructive",
      })
      setIsSimulating(false)
      return
    }

    const randomIndex = Math.floor(Math.random() * activeEvents.length)
    const selectedEvent = activeEvents[randomIndex]

    // Simulate processing time
    setTimeout(() => {
      // Execute the action (in a real app, this would trigger the actual process)
      toast({
        title: "Pattern Detected!",
        description: `"${selectedEvent.patternName}" detected. Executing action on ${selectedEvent.deviceName}.`,
      })

      // Log the event execution
      console.log(`Executing action: ${selectedEvent.action} on device: ${selectedEvent.deviceName}`)

      // Simulate the action being completed
      setTimeout(() => {
        toast({
          title: "Action Completed",
          description: `Successfully executed: ${selectedEvent.action}`,
        })

        setIsSimulating(false)
      }, 2000)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Connect sound patterns to devices and define actions to take when patterns are detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          {soundPatterns.length === 0 ? (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No sound patterns available</AlertTitle>
              <AlertDescription>
                Create sound patterns in the Sound Wave Labeler tab before creating events.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sound-pattern">Sound Pattern</Label>
                <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                  <SelectTrigger id="sound-pattern">
                    <SelectValue placeholder="Select a sound pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {soundPatterns.map((pattern) => (
                      <SelectItem key={pattern.id} value={pattern.id.toString()}>
                        {pattern.label} {pattern.isSimulated ? "(Simulated)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device">Target Device</Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger id="device">
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices
                      .filter((d) => d.status === "online")
                      .map((device) => (
                        <SelectItem key={device.id} value={device.id.toString()}>
                          {device.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="action">Action Description</Label>
                <Textarea
                  id="action"
                  placeholder="Describe what should happen when this sound is detected"
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddEvent}
                className="md:col-span-2 flex items-center gap-2"
                disabled={soundPatterns.length === 0}
              >
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Configured Events</h3>
        <Button
          onClick={simulatePatternDetection}
          disabled={isSimulating || events.length === 0}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isSimulating ? "Simulating..." : "Simulate Detection"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Events</CardTitle>
          <CardDescription>Manage your sound pattern events and their associated actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sound Pattern</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.patternName}</TableCell>
                  <TableCell>{event.deviceName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{event.action}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={event.isActive}
                        onCheckedChange={() => handleToggleEvent(event.id)}
                        id={`event-${event.id}`}
                      />
                      <Label htmlFor={`event-${event.id}`}>{event.isActive ? "Active" : "Inactive"}</Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No events configured yet. Create your first event above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
