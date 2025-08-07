'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Smartphone, 
  CreditCard, 
  Waves, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Clock,
  Zap
} from 'lucide-react'

interface NFCPaymentProps {
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

export function NFCPayment({ order, onPaymentComplete, onBack }: NFCPaymentProps) {
  const [nfcStatus, setNfcStatus] = useState<'waiting' | 'detecting' | 'processing' | 'success' | 'error'>('waiting')
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [customAmount, setCustomAmount] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const amount = customAmount ? parseFloat(paymentAmount) || 0 : order?.total || 0

  useEffect(() => {
    if (order) {
      setPaymentAmount(order.total.toString())
    }
  }, [order])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [countdown])

  const startNFCPayment = async () => {
    if (amount <= 0) {
      setErrorMessage('Please enter a valid amount')
      return
    }

    setNfcStatus('detecting')
    setCountdown(30) // 30 second timeout
    
    try {
      // Simulate NFC detection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if Web NFC is available (for real implementation)
      if ('NDEFReader' in window) {
        // Real NFC implementation would go here
        setNfcStatus('processing')
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Simulate successful payment
        setNfcStatus('success')
        setTimeout(() => {
          onPaymentComplete(amount)
        }, 2000)
      } else {
        // Fallback simulation for demonstration
        setNfcStatus('processing')
        await new Promise(resolve => setTimeout(resolve, 1500))
        setNfcStatus('success')
        setTimeout(() => {
          onPaymentComplete(amount)
        }, 2000)
      }
    } catch (error) {
      setNfcStatus('error')
      setErrorMessage('Payment failed. Please try again.')
      setTimeout(() => setNfcStatus('waiting'), 3000)
    }
  }

  const cancelPayment = () => {
    setNfcStatus('waiting')
    setCountdown(0)
    setErrorMessage('')
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
        <h2 className="text-xl font-bold text-ocean-800">NFC Payment</h2>
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

      {/* NFC Payment Interface */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
        <div className="text-center space-y-4">
          {nfcStatus === 'waiting' && (
            <>
              <div className="relative">
                <Smartphone className="h-20 w-20 mx-auto text-primary-500 animate-pulse" />
                <CreditCard className="h-8 w-8 absolute -bottom-1 -right-1 text-secondary-500" />
              </div>
              <h3 className="text-lg font-semibold text-primary-800">Ready for Payment</h3>
              <p className="text-primary-600 text-sm">
                Tap "Start NFC" and have customer tap their phone or card
              </p>
              <Button
                onClick={startNFCPayment}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start NFC Payment
              </Button>
            </>
          )}

          {nfcStatus === 'detecting' && (
            <>
              <div className="relative">
                <Smartphone className="h-20 w-20 mx-auto text-primary-500">
                  <Waves className="h-8 w-8 absolute inset-0 m-auto animate-ping text-blue-500" />
                </Smartphone>
              </div>
              <h3 className="text-lg font-semibold text-primary-800">Waiting for Device</h3>
              <p className="text-primary-600 text-sm">
                Have customer hold their phone or card near your device
              </p>
              {countdown > 0 && (
                <div className="text-2xl font-bold text-primary-700">
                  <Clock className="h-5 w-5 inline mr-2" />
                  {countdown}s
                </div>
              )}
              <Button
                onClick={cancelPayment}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </>
          )}

          {nfcStatus === 'processing' && (
            <>
              <div className="relative">
                <div className="h-20 w-20 mx-auto rounded-full bg-primary-500 flex items-center justify-center animate-pulse">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-primary-800">Processing Payment</h3>
              <p className="text-primary-600 text-sm">
                ${amount.toFixed(2)} • Please wait...
              </p>
              <div className="w-full bg-primary-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            </>
          )}

          {nfcStatus === 'success' && (
            <>
              <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
              <p className="text-green-600 text-sm">
                ${amount.toFixed(2)} charged successfully
              </p>
              <div className="bg-green-100 rounded-lg p-3 text-sm text-green-800">
                Transaction will be recorded automatically
              </div>
            </>
          )}

          {nfcStatus === 'error' && (
            <>
              <AlertCircle className="h-20 w-20 mx-auto text-red-500" />
              <h3 className="text-lg font-semibold text-red-800">Payment Failed</h3>
              <p className="text-red-600 text-sm">{errorMessage}</p>
              <Button
                onClick={() => setNfcStatus('waiting')}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-ocean-50 rounded-lg p-4">
        <h4 className="font-semibold text-ocean-800 mb-2">Payment Methods Supported</h4>
        <div className="space-y-1 text-sm text-ocean-600">
          <div className="flex items-center">
            <Smartphone className="h-4 w-4 mr-2" />
            Apple Pay, Google Pay, Samsung Pay
          </div>
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Contactless credit/debit cards
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Any NFC-enabled payment device
          </div>
        </div>
      </div>
    </div>
  )
}