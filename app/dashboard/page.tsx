import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SoundWaveLabeler from "@/components/sound-wave-labeler"
import EventMatcher from "@/components/event-matcher"
import DeviceConnector from "@/components/device-connector"
import PatternDetector from "@/components/pattern-detector"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <h1 className="text-lg font-semibold">SonicReactor Dashboard</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sound Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">+1 from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+3 from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Successful Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">+14 from last week</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="sound-labeler">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sound-labeler">Sound Wave Labeler</TabsTrigger>
            <TabsTrigger value="event-matcher">Event Matcher</TabsTrigger>
            <TabsTrigger value="device-connector">Device Connector</TabsTrigger>
            <TabsTrigger value="pattern-detector">Pattern Detector</TabsTrigger>
          </TabsList>
          <TabsContent value="sound-labeler" className="border-none p-0 pt-4">
            <SoundWaveLabeler />
          </TabsContent>
          <TabsContent value="event-matcher" className="border-none p-0 pt-4">
            <EventMatcher />
          </TabsContent>
          <TabsContent value="device-connector" className="border-none p-0 pt-4">
            <DeviceConnector />
          </TabsContent>
          <TabsContent value="pattern-detector" className="border-none p-0 pt-4">
            <PatternDetector />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
