"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

export default function InvestmentForm() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    amount: 1,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, amount: value[0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Set form to loading state
      setIsLoading(true)

      // Validate form data
      if (!formData.name.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide your full name.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!formData.email.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide your email address.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Insert data into Supabase investors table
      const { data, error } = await supabase.from("investors").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        amount: formData.amount,
        status: "pending", // Default status
      })

      if (error) {
        console.error("Error submitting investment interest:", error)
        toast({
          title: "Submission Failed",
          description: "There was an error submitting your information. Please try again later.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Success - show notification
      toast({
        title: "Investment Interest Recorded",
        description: "Thank you for your interest in SonicReactor. Our team will contact you shortly.",
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        amount: 1000,
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Submission Failed",
        description: "There was an unexpected error. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4" id="invest">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Steve John K"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="io.cooltech@gmail.com"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (USD)</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="amount"
                min={100}
                max={100000}
                step={100}
                value={[formData.amount]}
                onValueChange={handleSliderChange}
                className="flex-1"
              />
              <span className="w-20 text-right font-medium">${formData.amount.toLocaleString()}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Express Interest"}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            This is not a binding commitment. Our team will contact you with more information about the investment
            opportunity.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
