"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Phone,
  Users,
  Calculator,
  Plus,
  Trash2,
  Zap,
  Droplets,
  Receipt,
  MessageSquare,
  UserPlus,
  History,
  Download,
  Archive,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Roommate {
  id: string
  name: string
  mobile: string
  waterBillPaid: number
  ebBillPaid: number
  otherBillPaid: number
}

interface Room {
  name: string
  monthlyRent: number // Reverted to single monthlyRent
  roommates: Roommate[]
}

interface MonthlyRecord {
  id: string
  month: string
  year: number
  room: Room
  calculations: {
    roommateId: string
    name: string
    baseRent: number
    waterBill: number
    ebBill: number
    otherBill: number
    finalAmount: number
  }[]
  timestamp: number
}

export default function RoomRentCalculator() {
  const [currentStep, setCurrentStep] = useState<"login" | "otp" | "room-setup" | "dashboard">("login")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [room, setRoom] = useState<Room>({ name: "", monthlyRent: 0, roommates: [] }) // Reverted room state
  const [newRoommate, setNewRoommate] = useState({ name: "", mobile: "" })
  const [isAddingBill, setIsAddingBill] = useState(false)
  const [selectedRoommate, setSelectedRoommate] = useState<string>("")
  const [billType, setBillType] = useState<"water" | "eb" | "other">("water")
  const [billAmount, setBillAmount] = useState("")
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const { toast } = useToast()

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedRoom = localStorage.getItem("roomData")
    const savedRecords = localStorage.getItem("monthlyRecords")
    const savedStep = localStorage.getItem("currentStep")
    const savedPhone = localStorage.getItem("phoneNumber")

    if (savedRoom) {
      setRoom(JSON.parse(savedRoom))
    }
    if (savedRecords) {
      setMonthlyRecords(JSON.parse(savedRecords))
    }
    if (savedStep && savedPhone) {
      setCurrentStep(savedStep as any)
      setPhoneNumber(savedPhone)
    }
  }, [])

  // Save data to localStorage whenever room or records change
  useEffect(() => {
    if (room.name) {
      localStorage.setItem("roomData", JSON.stringify(room))
    }
  }, [room])

  useEffect(() => {
    if (monthlyRecords.length > 0) {
      localStorage.setItem("monthlyRecords", JSON.stringify(monthlyRecords))
    }
  }, [monthlyRecords])

  useEffect(() => {
    localStorage.setItem("currentStep", currentStep)
    localStorage.setItem("phoneNumber", phoneNumber)
  }, [currentStep, phoneNumber])

  const handleLogin = () => {
    if (phoneNumber.length === 10) {
      setCurrentStep("otp")
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +91 ${phoneNumber}`,
      })
    }
  }

  const handleOtpVerify = () => {
    if (otp.length === 6) {
      setCurrentStep("room-setup")
      toast({
        title: "Login Successful",
        description: "Welcome to Room Rent Calculator",
      })
    }
  }

  const handleRoomSetup = () => {
    if (room.name && room.monthlyRent > 0 && room.roommates.length > 0) {
      setCurrentStep("dashboard")
      toast({
        title: "Room Setup Complete",
        description: `${room.name} created with ${room.roommates.length} roommates`,
      })
    }
  }

  const addRoommate = () => {
    if (newRoommate.name && newRoommate.mobile.length === 10) {
      const roommate: Roommate = {
        id: Date.now().toString(),
        name: newRoommate.name,
        mobile: newRoommate.mobile,
        waterBillPaid: 0,
        ebBillPaid: 0,
        otherBillPaid: 0,
      }
      setRoom((prev) => ({
        ...prev,
        roommates: [...prev.roommates, roommate],
      }))
      setNewRoommate({ name: "", mobile: "" })
      toast({
        title: "Roommate Added",
        description: `${roommate.name} has been added to the room`,
      })
    }
  }

  const removeRoommate = (id: string) => {
    setRoom((prev) => ({
      ...prev,
      roommates: prev.roommates.filter((r) => r.id !== id),
    }))
  }

  const addBill = () => {
    if (selectedRoommate && billAmount) {
      setRoom((prev) => ({
        ...prev,
        roommates: prev.roommates.map((r) => {
          if (r.id === selectedRoommate) {
            return {
              ...r,
              [billType === "water" ? "waterBillPaid" : billType === "eb" ? "ebBillPaid" : "otherBillPaid"]:
                r[billType === "water" ? "waterBillPaid" : billType === "eb" ? "ebBillPaid" : "otherBillPaid"] +
                Number.parseFloat(billAmount),
            }
          }
          return r
        }),
      }))
      setIsAddingBill(false)
      setSelectedRoommate("")
      setBillAmount("")
      toast({
        title: "Bill Added",
        description: `${billType.toUpperCase()} bill of ₹${billAmount} added successfully`,
      })
    }
  }

  const calculateRentPerPerson = () => {
    const memberCount = room.roommates.length
    if (!memberCount || room.monthlyRent == null) return 0 // ↞ prevents null/undefined
    const share = Number(room.monthlyRent) / memberCount
    return isFinite(share) ? share : 0
  }

  const calculateFinalAmount = (roommate: Roommate) => {
    const base = calculateRentPerPerson()
    if (!isFinite(base)) return 0
    return (
      base -
      (Number(roommate.waterBillPaid) || 0) -
      (Number(roommate.ebBillPaid) || 0) -
      (Number(roommate.otherBillPaid) || 0)
    )
  }

  const generateMessage = () => {
    const rentPerPerson = calculateRentPerPerson()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    let message = `🏠 ${room.name} - ${monthNames[currentMonth]} ${currentYear} Rent\n\n`
    message += `💰 Total Rent: ₹${room.monthlyRent}\n`
    message += `👥 Total Members: ${room.roommates.length}\n`
    message += `📊 Rent per person: ₹${Number(rentPerPerson).toFixed(2)}\n\n`
    message += `📋 Individual Calculations:\n`
    message += `${"=".repeat(30)}\n\n`

    room.roommates.forEach((roommate, index) => {
      const finalAmount = calculateFinalAmount(roommate)
      message += `${index + 1}. ${roommate.name} (+91${roommate.mobile})\n`
      message += `   Base Rent: ₹${Number(rentPerPerson).toFixed(2)}\n`
      if (roommate.waterBillPaid > 0) message += `   💧 Water Bill: -₹${roommate.waterBillPaid}\n`
      if (roommate.ebBillPaid > 0) message += `   ⚡ EB Bill: -₹${roommate.ebBillPaid}\n`
      if (roommate.otherBillPaid > 0) message += `   🧾 Other Bill: -₹${roommate.otherBillPaid}\n`
      message += `   💳 Final Amount: ₹${Number(finalAmount).toFixed(2)}\n\n`
    })

    message += `📱 Calculated via Room Rent Calculator App`
    return message
  }

  const generatePDF = async (record?: MonthlyRecord) => {
    const dataToUse = record || {
      month: new Date().toLocaleString("default", { month: "long" }),
      year: currentYear,
      room: room,
      calculations: room.roommates.map((roommate) => ({
        roommateId: roommate.id,
        name: roommate.name,
        baseRent: calculateRentPerPerson(),
        waterBill: roommate.waterBillPaid,
        ebBill: roommate.ebBillPaid,
        otherBill: roommate.otherBillPaid,
        finalAmount: calculateFinalAmount(roommate),
      })),
      timestamp: Date.now(),
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rent Calculation - ${dataToUse.month} ${dataToUse.year}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1e293b;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .summary {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-item .label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
          }
          .summary-item .value {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
          }
          .calculations {
            margin-top: 30px;
          }
          .calculations h2 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          .roommate-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
          }
          .roommate-header {
            background: #f8fafc;
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          .roommate-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }
          .roommate-details {
            padding: 20px;
          }
          .calculation-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .calculation-row:last-child {
            border-bottom: none;
            font-weight: 600;
            font-size: 16px;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px solid #e2e8f0;
          }
          .calculation-label {
            color: #475569;
          }
          .calculation-value {
            font-weight: 500;
          }
          .positive {
            color: #059669;
          }
          .negative {
            color: #dc2626;
          }
          .deduction {
            color: #2563eb;
          }
          .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
          .bill-icon {
            display: inline-block;
            margin-right: 5px;
          }
          @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 ${dataToUse.room.name}</h1>
            <p>Monthly Rent Calculation - ${dataToUse.month} ${dataToUse.year}</p>
          </div>
          
          <div class="content">
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="label">Total Monthly Rent</div>
                  <div class="value">₹${dataToUse.room.monthlyRent.toLocaleString()}</div>
                </div>
                <div class="summary-item">
                  <div class="label">Total Roommates</div>
                  <div class="value">${dataToUse.room.roommates.length}</div>
                </div>
                <div class="summary-item">
                  <div class="label">Rent Per Person</div>
                  <div class="value">₹${Number(dataToUse.room.monthlyRent / dataToUse.room.roommates.length).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div class="calculations">
              <h2>📋 Individual Calculations</h2>
              
              ${dataToUse.calculations
                .map(
                  (calc) => `
                <div class="roommate-card">
                  <div class="roommate-header">
                    <h3 class="roommate-name">${calc.name}</h3>
                  </div>
                  <div class="roommate-details">
                    <div class="calculation-row">
                      <span class="calculation-label">Base Rent</span>
                      <span class="calculation-value">₹${Number(calc.baseRent).toFixed(2)}</span>
                    </div>
                    ${
                      calc.waterBill > 0
                        ? `
                      <div class="calculation-row">
                        <span class="calculation-label"><span class="bill-icon">💧</span>Water Bill Paid</span>
                        <span class="calculation-value deduction">-₹${calc.waterBill.toFixed(2)}</span>
                      </div>
                    `
                        : ""
                    }
                    ${
                      calc.ebBill > 0
                        ? `
                      <div class="calculation-row">
                        <span class="calculation-label"><span class="bill-icon">⚡</span>EB Bill Paid</span>
                        <span class="calculation-value deduction">-₹${calc.ebBill.toFixed(2)}</span>
                      </div>
                    `
                        : ""
                    }
                    ${
                      calc.otherBill > 0
                        ? `
                      <div class="calculation-row">
                        <span class="calculation-label"><span class="bill-icon">🧾</span>Other Bill Paid</span>
                        <span class="calculation-value deduction">-₹${calc.otherBill.toFixed(2)}</span>
                      </div>
                    `
                        : ""
                    }
                    <div class="calculation-row">
                      <span class="calculation-label"><strong>💳 Final Amount</strong></span>
                      <span class="calculation-value ${calc.finalAmount >= 0 ? "positive" : "negative"}">
                        <strong>₹${Number(calc.finalAmount).toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
            <p>📱 Room Rent Calculator App</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      toast({
        title: "PDF Generated",
        description: `Rent calculation PDF for ${dataToUse.month} ${dataToUse.year} is ready to save`,
      })
    }
  }

  const copyMessage = () => {
    const message = generateMessage()
    navigator.clipboard.writeText(message)
    toast({
      title: "Message Copied",
      description: "Rent calculation message copied to clipboard",
    })
  }

  const sendSMS = () => {
    const message = generateMessage()
    const encodedMessage = encodeURIComponent(message)

    // Get all roommate phone numbers
    const phoneNumbers = room.roommates.map((r) => r.mobile).join(",")

    // Create SMS URL - this will open the device's SMS app
    const smsUrl = `sms:${phoneNumbers}?body=${encodedMessage}`

    // Open SMS app
    window.location.href = smsUrl

    toast({
      title: "SMS App Opened",
      description: "Message loaded in SMS app, ready to send!",
    })
  }

  const saveContact = (roommate: Roommate) => {
    // Create vCard format for contact
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${roommate.name}
TEL;TYPE=MOBILE:+91${roommate.mobile}
NOTE:Roommate at ${room.name}
END:VCARD`

    // Create blob and download link
    const blob = new Blob([vCard], { type: "text/vcard" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${roommate.name.replace(/\s+/g, "_")}_contact.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Contact Saved",
      description: `${roommate.name}'s contact downloaded. Import to your contacts app.`,
    })
  }

  const saveMonthlyRecord = () => {
    const rentPerPerson = calculateRentPerPerson()
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const newRecord: MonthlyRecord = {
      id: Date.now().toString(),
      month: monthNames[currentMonth],
      year: currentYear,
      room: { ...room },
      calculations: room.roommates.map((roommate) => ({
        roommateId: roommate.id,
        name: roommate.name,
        baseRent: rentPerPerson,
        waterBill: roommate.waterBillPaid,
        ebBill: roommate.ebBillPaid,
        otherBill: roommate.otherBillPaid,
        finalAmount: calculateFinalAmount(roommate),
      })),
      timestamp: Date.now(),
    }

    setMonthlyRecords((prev) => {
      const filtered = prev.filter((record) => !(record.month === newRecord.month && record.year === newRecord.year))
      const updated = [...filtered, newRecord]
      return updated.slice(-5) // Keep only last 5 months
    })

    // Reset bills for next month
    setRoom((prev) => ({
      ...prev,
      roommates: prev.roommates.map((roommate) => ({
        ...roommate,
        waterBillPaid: 0,
        ebBillPaid: 0,
        otherBillPaid: 0,
      })),
    }))

    toast({
      title: "Month Saved",
      description: `${monthNames[currentMonth]} ${currentYear} calculations saved to history`,
    })
  }

  const clearAllData = () => {
    localStorage.clear()
    setRoom({ name: "", monthlyRent: 0, roommates: [] }) // Reverted room state reset
    setMonthlyRecords([])
    setCurrentStep("login")
    setPhoneNumber("")
    setOtp("")
    toast({
      title: "Data Cleared",
      description: "All app data has been cleared",
    })
  }

  if (currentStep === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Room Rent Calculator</CardTitle>
            <CardDescription>Enter your mobile number to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                  <span className="text-sm">+91</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="rounded-l-none"
                />
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={phoneNumber.length !== 10}>
              Send OTP
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "otp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify OTP</CardTitle>
            <CardDescription>Enter the 6-digit code sent to +91 {phoneNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <Button onClick={handleOtpVerify} className="w-full" disabled={otp.length !== 6}>
              Verify & Continue
            </Button>
            <Button variant="ghost" onClick={() => setCurrentStep("login")} className="w-full">
              Change Number
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "room-setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Room Setup
              </CardTitle>
              <CardDescription>Set up your room and add roommates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="e.g., Apartment 3B, PG Room 1"
                  value={room.name}
                  onChange={(e) => setRoom((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rent (₹)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  placeholder="Enter total monthly rent"
                  value={room.monthlyRent || ""}
                  onChange={(e) =>
                    setRoom((prev) => ({ ...prev, monthlyRent: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Roommates</CardTitle>
              <CardDescription>Add all roommates who will share the rent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Roommate name"
                    value={newRoommate.name}
                    onChange={(e) => setNewRoommate((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="10-digit number"
                    value={newRoommate.mobile}
                    onChange={(e) =>
                      setNewRoommate((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={addRoommate}
                className="w-full"
                disabled={!newRoommate.name || newRoommate.mobile.length !== 10}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Roommate
              </Button>

              {room.roommates.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Roommates ({room.roommates.length})</Label>
                  <div className="space-y-2">
                    {room.roommates.map((roommate) => (
                      <div key={roommate.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{roommate.name}</p>
                          <p className="text-sm text-muted-foreground">+91 {roommate.mobile}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => saveContact(roommate)}>
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeRoommate(roommate.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleRoomSetup}
            className="w-full"
            disabled={!room.name || room.monthlyRent <= 0 || room.roommates.length === 0}
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{room.name}</span>
              <Badge variant="secondary">₹{room.monthlyRent}</Badge>
            </CardTitle>
            <CardDescription>
              {room.roommates.length} roommates • ₹{Number(calculateRentPerPerson()).toFixed(2)} per person
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="calculate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculate">Calculate</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="calculate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Rent Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.roommates.map((roommate, index) => {
                  const finalAmount = calculateFinalAmount(roommate)
                  return (
                    <div key={roommate.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{roommate.name}</h3>
                          <p className="text-sm text-muted-foreground">+91 {roommate.mobile}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => saveContact(roommate)}>
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Badge variant={finalAmount >= 0 ? "default" : "destructive"}>
                            ₹{Number(finalAmount).toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Base Rent:</span>
                          <span>₹{Number(calculateRentPerPerson()).toFixed(2)}</span>
                        </div>
                        {roommate.waterBillPaid > 0 && (
                          <div className="flex justify-between text-blue-600">
                            <span>💧 Water Bill:</span>
                            <span>-₹{roommate.waterBillPaid}</span>
                          </div>
                        )}
                        {roommate.ebBillPaid > 0 && (
                          <div className="flex justify-between text-yellow-600">
                            <span>⚡ EB Bill:</span>
                            <span>-₹{roommate.ebBillPaid}</span>
                          </div>
                        )}
                        {roommate.otherBillPaid > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>🧾 Other Bill:</span>
                            <span>-₹{roommate.otherBillPaid}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Final Amount:</span>
                          <span className={finalAmount >= 0 ? "text-green-600" : "text-red-600"}>
                            ₹{Number(finalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={copyMessage} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button onClick={sendSMS} size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    SMS
                  </Button>
                  <Button onClick={() => generatePDF()} variant="secondary" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>

                <Button onClick={saveMonthlyRecord} className="w-full" variant="secondary">
                  <Archive className="w-4 h-4 mr-2" />
                  Save This Month & Reset
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Bill Management</span>
                  <Dialog open={isAddingBill} onOpenChange={setIsAddingBill}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Bill Payment</DialogTitle>
                        <DialogDescription>Record a bill payment made by a roommate</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Roommate</Label>
                          <Select value={selectedRoommate} onValueChange={setSelectedRoommate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select roommate" />
                            </SelectTrigger>
                            <SelectContent>
                              {room.roommates.map((roommate) => (
                                <SelectItem key={roommate.id} value={roommate.id}>
                                  {roommate.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Bill Type</Label>
                          <Select
                            value={billType}
                            onValueChange={(value: "water" | "eb" | "other") => setBillType(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="water">💧 Water Bill</SelectItem>
                              <SelectItem value="eb">⚡ EB Bill</SelectItem>
                              <SelectItem value="other">🧾 Other Bill</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Enter bill amount"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                          />
                        </div>
                        <Button onClick={addBill} className="w-full" disabled={!selectedRoommate || !billAmount}>
                          Add Bill Payment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {room.roommates.map((roommate) => (
                    <div key={roommate.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{roommate.name}</h3>
                        <Button variant="ghost" size="sm" onClick={() => saveContact(roommate)}>
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                          <p className="text-blue-600 font-medium">₹{roommate.waterBillPaid}</p>
                          <p className="text-xs text-muted-foreground">Water</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
                          <p className="text-yellow-600 font-medium">₹{roommate.ebBillPaid}</p>
                          <p className="text-xs text-muted-foreground">EB</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <Receipt className="w-4 h-4 mx-auto mb-1 text-green-600" />
                          <p className="text-green-600 font-medium">₹{roommate.otherBillPaid}</p>
                          <p className="text-xs text-muted-foreground">Other</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Monthly History
                </CardTitle>
                <CardDescription>Last 5 months of rent calculations</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No history available yet</p>
                ) : (
                  <div className="space-y-4">
                    {monthlyRecords
                      .slice()
                      .reverse()
                      .map((record) => (
                        <Card key={record.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                              {record.month} {record.year}
                            </h3>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => generatePDF(record)}>
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Badge variant="outline">₹{record.room.monthlyRent}</Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {record.calculations.map((calc) => (
                              <div key={calc.roommateId} className="flex items-center justify-between text-sm">
                                <span>{calc.name}</span>
                                <div className="text-right">
                                  <p className="font-medium">₹{Number(calc.finalAmount).toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Number(calc.baseRent).toFixed(0)} -{" "}
                                    {(calc.waterBill + calc.ebBill + calc.otherBill).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                  </div>
                )}

                {monthlyRecords.length > 0 && (
                  <Button onClick={clearAllData} variant="destructive" className="w-full mt-4">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
