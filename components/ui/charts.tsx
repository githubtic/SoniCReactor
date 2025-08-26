"use client"

import { useEffect, useRef } from "react"

// This is a simplified chart component for demonstration purposes
// In a real application, you would use a library like Chart.js, Recharts, or D3.js

export function LineChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Generate sample data
    const days = 30
    const data = Array.from({ length: days }, () => Math.floor(Math.random() * 50) + 10)

    // Draw chart
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2
    const maxValue = Math.max(...data)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw axes
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.strokeStyle = "#ccc"
    ctx.stroke()

    // Draw data line
    ctx.beginPath()
    data.forEach((value, index) => {
      const x = padding + (index / (days - 1)) * chartWidth
      const y = canvas.height - padding - (value / maxValue) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.stroke()

    // Fill area under the line
    ctx.lineTo(padding + chartWidth, canvas.height - padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
    ctx.fill()

    // Draw points
    data.forEach((value, index) => {
      const x = padding + (index / (days - 1)) * chartWidth
      const y = canvas.height - padding - (value / maxValue) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = "#3b82f6"
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = "#666"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"

    // X-axis labels (days)
    for (let i = 0; i < days; i += 5) {
      const x = padding + (i / (days - 1)) * chartWidth
      ctx.fillText(`${i + 1}`, x, canvas.height - padding + 20)
    }

    // Y-axis labels
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((i / 5) * maxValue)
      const y = canvas.height - padding - (i / 5) * chartHeight
      ctx.fillText(`${value}`, padding - 10, y + 5)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

export function BarChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Generate sample data
    const categories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const data = categories.map(() => Math.floor(Math.random() * 50) + 10)

    // Draw chart
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2
    const maxValue = Math.max(...data)
    const barWidth = (chartWidth / categories.length) * 0.8
    const barSpacing = (chartWidth / categories.length) * 0.2

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw axes
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.strokeStyle = "#ccc"
    ctx.stroke()

    // Draw bars
    categories.forEach((category, index) => {
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2
      const barHeight = (data[index] / maxValue) * chartHeight
      const y = canvas.height - padding - barHeight

      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw category label
      ctx.fillStyle = "#666"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(category, x + barWidth / 2, canvas.height - padding + 20)
    })

    // Draw y-axis labels
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((i / 5) * maxValue)
      const y = canvas.height - padding - (i / 5) * chartHeight
      ctx.fillText(`${value}`, padding - 10, y + 5)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

export function PieChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Generate sample data
    const data = [
      { label: "Door Opening", value: 35, color: "#3b82f6" },
      { label: "Phone Ringing", value: 25, color: "#10b981" },
      { label: "Coffee Machine", value: 20, color: "#f59e0b" },
      { label: "Keyboard Typing", value: 15, color: "#ef4444" },
      { label: "Other", value: 5, color: "#8b5cf6" },
    ]

    const total = data.reduce((sum, item) => sum + item.value, 0)

    // Draw chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) * 0.8

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw pie slices
    let startAngle = 0
    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = item.color
      ctx.fill()

      // Draw label
      const labelAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 0.7
      const labelX = centerX + Math.cos(labelAngle) * labelRadius
      const labelY = centerY + Math.sin(labelAngle) * labelRadius

      ctx.fillStyle = "#fff"
      ctx.font = "bold 12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      if (item.value >= 10) {
        // Only show label if slice is big enough
        ctx.fillText(`${item.value}%`, labelX, labelY)
      }

      startAngle += sliceAngle
    })

    // Draw legend
    const legendX = canvas.width - 120
    const legendY = 20

    data.forEach((item, index) => {
      const y = legendY + index * 25

      // Draw color box
      ctx.fillStyle = item.color
      ctx.fillRect(legendX, y, 15, 15)

      // Draw label
      ctx.fillStyle = "#666"
      ctx.font = "12px Arial"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(item.label, legendX + 25, y + 7.5)
    })
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
