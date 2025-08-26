"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Laptop, Smartphone, Server, Plus, RefreshCw, Trash2, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Type definitions
interface Device {
  id: number
  name: string
  type: string
  status: string
  ipAddress: string
  lastActive?: string
  activityLog?: ActivityLogEntry[]
}

interface ActivityLogEntry {
  timestamp: string
  action: string
  details: string
}

// Sample data - in a real app, this would come from your backend
const sampleDevices = [
  { id: 1, name: "Office Computer", type: "computer", status: "online", ipAddress: "192.168.1.101" },
  { id: 2, name: "Reception Phone", type: "phone", status: "online", ipAddress: "192.168.1.102" },
  { id: 3, name: "Meeting Room Tablet", type: "phone", status: "offline", ipAddress: "192.168.1.103" },
  { id: 4, name: "Front Desk Display", type: "computer", status: "online", ipAddress: "192.168.1.104" },
  { id: 5, name: "Warehouse Scanner", type: "phone", status: "online", ipAddress: "192.168.1.105" },
  { id: 6, name: "Inventory System", type: "server", status: "online", ipAddress: "192.168.1.106" },
  { id: 7, name: "Customer Database", type: "server", status: "online", ipAddress: "192.168.1.107" },
]

export default function DeviceConnector() {
  const { toast } = useToast()
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceName, setDeviceName] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [ipAddress, setIpAddress] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showActivityLog, setShowActivityLog] = useState(false)

  // Load devices from localStorage or use sample data
  useEffect(() => {
    const savedDevicesJson = localStorage.getItem("sonicreactor_devices")
    if (savedDevicesJson) {
      try {
        const savedDevices = JSON.parse(savedDevicesJson)
        setDevices(savedDevices)
      } catch (error) {
        console.error("Error parsing devices from localStorage:", error)
        setDevices(sampleDevices)
      }
    } else {
      setDevices(sampleDevices)
    }

    // Listen for pattern detection events
    const handlePatternDetected = (e: CustomEvent) => {
      const { deviceId, action } = e.detail

      // Update the device's activity log
      setDevices((prevDevices) => {
        return prevDevices.map((device) => {
          if (device.id === deviceId) {
            const now = new Date().toISOString()
            const activityLog = device.activityLog || []
            const newLog: ActivityLogEntry = {
              timestamp: now,
              action: "Pattern Detected",
              details: action,
            }

            return {
              ...device,
              lastActive: now,
              activityLog: [newLog, ...activityLog].slice(0, 20), // Keep only the last 20 entries
            }
          }
          return device
        })
      })
    }

    window.addEventListener("patternDetected", handlePatternDetected as EventListener)

    return () => {
      window.removeEventListener("patternDetected", handlePatternDetected as EventListener)
    }
  }, [])

  // Save devices to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("sonicreactor_devices", JSON.stringify(devices))
  }, [devices])

  const handleAddDevice = () => {
    if (!deviceName || !deviceType || !ipAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to add a device.",
        variant: "destructive",
      })
      return
    }

    const newDevice = {
      id: Date.now(),
      name: deviceName,
      type: deviceType,
      status: "online",
      ipAddress,
      lastActive: new Date().toISOString(),
      activityLog: [
        {
          timestamp: new Date().toISOString(),
          action: "Device Added",
          details: "Device was registered with the system",
        },
      ],
    }

    setDevices([...devices, newDevice])

    // Reset form
    setDeviceName("")
    setDeviceType("")
    setIpAddress("")

    toast({
      title: "Device Added",
      description: `Device "${deviceName}" has been added successfully.`,
    })
  }

  const handleRefreshDevices = () => {
    setRefreshing(true)

    // Simulate a refresh delay
    setTimeout(() => {
      // Randomly update some device statuses
      const updatedDevices = devices.map((device) => {
        // 10% chance to toggle status for simulation purposes
        if (Math.random() < 0.1) {
          const newStatus = device.status === "online" ? "offline" : "online"

          // Add to activity log
          const activityLog = device.activityLog || []
          const newLog: ActivityLogEntry = {
            timestamp: new Date().toISOString(),
            action: "Status Change",
            details: `Device status changed from ${device.status} to ${newStatus}`,
          }

          return {
            ...device,
            status: newStatus,
            lastActive: new Date().toISOString(),
            activityLog: [newLog, ...activityLog].slice(0, 20),
          }
        }
        return device
      })

      setDevices(updatedDevices)
      setRefreshing(false)

      toast({
        title: "Devices Refreshed",
        description: "All device statuses have been updated.",
      })
    }, 1500)
  }

  const handleDeleteDevice = (id: number) => {
    const device = devices.find((d) => d.id === id)
    setDevices(devices.filter((device) => device.id !== id))

    if (device) {
      toast({
        title: "Device Removed",
        description: `Device "${device.name}" has been removed.`,
      })
    }

    // If the deleted device was selected, clear the selection
    if (selectedDevice && selectedDevice.id === id) {
      setSelectedDevice(null)
      setShowActivityLog(false)
    }
  }

  const handleViewActivityLog = (device: Device) => {
    setSelectedDevice(device)
    setShowActivityLog(true)
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "computer":
        return <Laptop className="h-4 w-4" />
      case "phone":
        return <Smartphone className="h-4 w-4" />
      case "server":
        return <Server className="h-4 w-4" />
      default:
        return <Laptop className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {showActivityLog && selectedDevice ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Activity Log: {selectedDevice.name}</CardTitle>
              <CardDescription>Recent events and actions for this device</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowActivityLog(false)}>
              Back to Devices
            </Button>
          </CardHeader>
          <CardContent>
            {selectedDevice.activityLog && selectedDevice.activityLog.length > 0 ? (
              <div className="space-y-4">
                {selectedDevice.activityLog.map((entry, index) => (
                  <div key={index} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{entry.action}</div>
                      <div className="text-sm text-muted-foreground">{formatTimestamp(entry.timestamp)}</div>
                    </div>
                    <div className="text-sm mt-1">{entry.details}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No activity recorded for this device yet.</div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Add New Device</CardTitle>
              <CardDescription>Connect a new device to the SonicReactor system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    placeholder="e.g., Office Laptop"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device-type">Device Type</Label>
                  <Select value={deviceType} onValueChange={setDeviceType}>
                    <SelectTrigger id="device-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computer">Computer</SelectItem>
                      <SelectItem value="phone">Phone/Mobile</SelectItem>
                      <SelectItem value="server">Server/System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ip-address">IP Address</Label>
                  <Input
                    id="ip-address"
                    placeholder="e.g., 192.168.1.100"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddDevice} className="w-full flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Device
              </Button>
            </CardFooter>
          </Card>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Connected Devices</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshDevices}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Devices</TabsTrigger>
              <TabsTrigger value="computer">Computers</TabsTrigger>
              <TabsTrigger value="phone">Phones/Mobile</TabsTrigger>
              <TabsTrigger value="server">Servers/Systems</TabsTrigger>
            </TabsList>

            {["all", "computer", "phone", "server"].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {devices
                    .filter((device) => tabValue === "all" || device.type === tabValue)
                    .map((device) => (
                      <Card key={device.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(device.type)}
                              <CardTitle className="text-base">{device.name}</CardTitle>
                            </div>
                            <Badge variant={device.status === "online" ? "default" : "secondary"}>
                              {device.status}
                            </Badge>
                          </div>
                          <CardDescription>{device.ipAddress}</CardDescription>
                          {device.lastActive && (
                            <CardDescription className="text-xs mt-1">
                              Last active: {formatTimestamp(device.lastActive)}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardFooter className="pt-2 flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewActivityLog(device)}
                            className="text-xs"
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            Activity Log
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}

                  {devices.filter((device) => tabValue === "all" || device.type === tabValue).length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 py-8 text-center text-muted-foreground">
                      No devices found in this category. Add a new device to get started.
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  )
}
