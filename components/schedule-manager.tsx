"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { createLogger } from "@/lib/logger"

const logger = createLogger("ScheduleManager")

interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
  type?: string
  lastRun?: string
  productCount?: number
  generatedCards?: string[]
  errors?: string[]
}

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("08:00")
  const [frequency, setFrequency] = useState("once")
  const [type, setType] = useState("standard")
  const { toast } = useToast()

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/schedule")

      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error: any) {
      logger.error("Error fetching schedules:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch schedules",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleCreateSchedule = async () => {
    if (!date) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a date",
      })
      return
    }

    try {
      setIsCreating(true)

      const schedule: Schedule = {
        id: uuidv4(),
        date: format(date, "yyyy-MM-dd"),
        time,
        frequency,
        status: "pending",
        type,
      }

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schedule),
      })

      if (!response.ok) {
        throw new Error(`Failed to create schedule: ${response.status} ${response.statusText}`)
      }

      toast({
        title: "Success",
        description: "Schedule created successfully",
      })

      fetchSchedules()
    } catch (error: any) {
      logger.error("Error creating schedule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create schedule",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/schedule?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete schedule: ${response.status} ${response.statusText}`)
      }

      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      })

      fetchSchedules()
    } catch (error: any) {
      logger.error("Error deleting schedule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete schedule",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      return format(new Date(`${dateStr}T${timeStr}`), "PPP 'at' p")
    } catch (error) {
      return `${dateStr} ${timeStr}`
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="text-yellow-500">Pending</span>
      case "completed":
        return <span className="text-green-500">Completed</span>
      case "failed":
        return <span className="text-red-500">Failed</span>
      default:
        return <span>{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Schedule</CardTitle>
          <CardDescription>Schedule automated card generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isCreating}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Select value={time} onValueChange={setTime} disabled={isCreating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="00:00">12:00 AM</SelectItem>
                  <SelectItem value="03:00">3:00 AM</SelectItem>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                  <SelectItem value="21:00">9:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency</label>
              <Select value={frequency} onValueChange={setFrequency} disabled={isCreating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType} disabled={isCreating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="auto-download">Auto Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateSchedule} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>View and manage your scheduled tasks</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSchedules} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : schedules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{formatDateTime(schedule.date, schedule.time)}</TableCell>
                    <TableCell className="capitalize">{schedule.frequency}</TableCell>
                    <TableCell className="capitalize">{schedule.type || "standard"}</TableCell>
                    <TableCell>{formatStatus(schedule.status)}</TableCell>
                    <TableCell>
                      {schedule.lastRun ? format(new Date(schedule.lastRun), "PPP 'at' p") : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No schedules found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
