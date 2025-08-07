'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  QrCode, 
  ArrowLeft, 
  RefreshCw, 
  Share2,
  Copy,
  CheckCircle,
  Smartphone,
  Timer,
  DollarSign,
  AlertTriangle
} from 'lucide-react'

interface QRGeneratorProps {
  order: {
    id: string
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    total: number
    customer?: string
  } | null
  onPaymentComplete: (amount: number) => void
  onBack: () => void
}

export function QRGenerator({ order, onPaymentComplete, onBack }: QRGeneratorProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [customAmount, setCustomAmount] = useState(false)
  const [qrExpiry, setQrExpiry] = useState(300) // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending')
  const [qrId, setQrId] = useState('')
  const [copied, setCopied] = useState(false)

  const amount = customAmount ? parseFloat(paymentAmount) || 0 : order?.total || 0

  // Generate unique QR ID
  useEffect(() => {
    setQrId(`QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  useEffect(() => {
    if (order) {
      setPaymentAmount(order.total.toString())
    }
  }, [order])

  // QR Code expiry countdown
  useEffect(() => {
    if (paymentStatus === 'pending' && qrExpiry > 0) {
      const timer = setInterval(() => {
        setQrExpiry(prev => {
          if (prev <= 1) {
            setPaymentStatus('expired')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [paymentStatus, qrExpiry])

  // Simulate payment monitoring (in real app, this would poll the backend)
  useEffect(() => {
    if (paymentStatus === 'pending') {
      // Simulate random payment completion for demo
      const paymentChecker = setInterval(() => {
        if (Math.random() < 0.05) { // 5% chance every second after 10 seconds
          setPaymentStatus('paid')
          setTimeout(() => {
            onPaymentComplete(amount)
          }, 1500)
        }
      }, 10000) // Check every 10 seconds

      return () => clearInterval(paymentChecker)
    }
  }, [paymentStatus, amount, onPaymentComplete])

  // Generate QR code data (UPP payment URL)
  const qrData = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_UPP_PAYMENT_URL || 'https://pay.upp.dev'
    const params = new URLSearchParams({
      merchant: 'alii-fish-market',
      amount: amount.toString(),
      currency: 'USD',
      qr_id: qrId,
      expires: Math.floor(Date.now() / 1000 + qrExpiry).toString(),
      callback: `${window.location.origin}/api/payments/callback`
    })
    return `${baseUrl}/qr?${params.toString()}`
  }, [amount, qrId, qrExpiry])

  // Generate QR code SVG (simplified version - in production, use a proper QR library)
  const generateQRSVG = (data: string, size: number = 200) => {
    // This is a simplified QR code representation
    // In production, use libraries like 'qrcode' or 'react-qr-code'
    const gridSize = 25
    const cellSize = size / gridSize
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">`
    
    // Create a simple pattern based on data hash
    const hash = data.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const shouldFill = (x + y + hash) % 3 === 0 || 
                          (x === 0 || x === gridSize-1 || y === 0 || y === gridSize-1) ||
                          (x < 7 && y < 7) || (x > gridSize-8 && y < 7) || (x < 7 && y > gridSize-8)
        
        if (shouldFill) {
          svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="currentColor" />`
        }
      }
    }
    
    svg += '</svg>'
    return svg
  }

  const refreshQR = () => {
    setQrExpiry(300)
    setPaymentStatus('pending')
    setQrId(`QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  }

  const copyQRLink = async () => {
    try {
      await navigator.clipboard.writeText(qrData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ali\'i Fish Market Payment',
          text: `Pay $${amount.toFixed(2)} to Ali'i Fish Market`,
          url: qrData
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      copyQRLink()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const quickAmounts = [5, 10, 15, 20, 25, 50]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-ocean-800">QR Payment</h2>
        <div className="w-9"></div>
      </div>

      {/* Order Summary */}
      {order && (
        <div className="bg-white rounded-xl p-4 border border-ocean-200">
          <h3 className="font-semibold text-ocean-800 mb-2">Order #{order.id.slice(-4)}</h3>
          <div className="space-y-1 text-sm">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="bg-white rounded-xl p-4 border border-ocean-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ocean-800">Payment Amount</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCustomAmount(!customAmount)}
            className="text-primary-600"
          >
            {customAmount ? 'Use Order Total' : 'Custom Amount'}
          </Button>
        </div>

        {customAmount ? (
          <div className="space-y-3">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ocean-400" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-2xl font-bold text-center border border-ocean-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(quickAmount.toString())}
                  className="text-sm"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              ${amount.toFixed(2)}
            </div>
            <div className="text-sm text-ocean-600">From current order</div>
          </div>
        )}
      </div>

      {/* QR Code Display */}
      <div className="bg-white rounded-xl p-6 border border-ocean-200">
        <div className="text-center space-y-4">
          {paymentStatus === 'pending' && (
            <>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-2xl">
                <div 
                  className="w-48 h-48 mx-auto bg-white p-4 rounded-xl shadow-lg text-primary-900"
                  dangerouslySetInnerHTML={{ __html: generateQRSVG(qrData, 192) }}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-ocean-800">
                  Customer Scans to Pay ${amount.toFixed(2)}
                </h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-ocean-600">
                  <Timer className="h-4 w-4" />
                  <span>Expires in {formatTime(qrExpiry)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={refreshQR}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={copyQRLink}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {copied ? (
                    <><CheckCircle className="h-4 w-4 mr-2" />Copied</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" />Copy Link</>
                  )}
                </Button>
                <Button
                  onClick={shareQR}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </>
          )}

          {paymentStatus === 'paid' && (
            <>
              <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold text-green-800">Payment Received!</h3>
              <p className="text-green-600 text-sm">
                Customer paid ${amount.toFixed(2)} successfully
              </p>
              <div className="bg-green-100 rounded-lg p-3 text-sm text-green-800">
                Transaction completed via QR scan
              </div>
            </>
          )}

          {paymentStatus === 'expired' && (
            <>
              <AlertTriangle className="h-20 w-20 mx-auto text-orange-500" />
              <h3 className="text-lg font-semibold text-orange-800">QR Code Expired</h3>
              <p className="text-orange-600 text-sm">
                Generate a new QR code for customer payment
              </p>
              <Button
                onClick={refreshQR}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New QR Code
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
        <h4 className="font-semibold text-primary-800 mb-2 flex items-center">
          <Smartphone className="h-4 w-4 mr-2" />
          Customer Instructions
        </h4>
        <div className="space-y-1 text-sm text-primary-700">
          <div>1. Open camera or payment app on their phone</div>
          <div>2. Point camera at QR code to scan</div>
          <div>3. Confirm payment amount and complete transaction</div>
          <div>4. Show confirmation screen to staff</div>
        </div>
      </div>

      {/* QR Details */}
      <div className="bg-ocean-50 rounded-lg p-4">
        <h4 className="font-semibold text-ocean-800 mb-2">QR Code Details</h4>
        <div className="space-y-1 text-xs font-mono text-ocean-600">
          <div>ID: {qrId}</div>
          <div>Amount: ${amount.toFixed(2)} USD</div>
          <div>Expires: {formatTime(qrExpiry)} remaining</div>
          <div className="text-xs text-ocean-500 break-all mt-2">
            {qrData.length > 50 ? `${qrData.substring(0, 50)}...` : qrData}
          </div>
        </div>
      </div>
    </div>
  )
}