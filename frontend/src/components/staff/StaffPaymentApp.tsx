'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { NFCPayment } from './NFCPayment'
import { QRGenerator } from './QRGenerator'
import { QuickOrders } from './QuickOrders'
import { 
  CreditCard, 
  QrCode, 
  Zap, 
  Clock, 
  DollarSign, 
  Smartphone,
  Wifi,
  Battery,
  Signal,
  Menu,
  X,
  Home,
  ShoppingCart,
  Settings
} from 'lucide-react'

interface Order {
  id: string
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  total: number
  customer?: string
}

export function StaffPaymentApp() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [isOnline, setIsOnline] = useState(true)
  const [activeMode, setActiveMode] = useState<'nfc' | 'qr' | 'quick' | 'home'>('home')
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [dailyTotal, setDailyTotal] = useState(2845.50)
  const [todayOrders, setTodayOrders] = useState(47)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        timeZone: 'Pacific/Honolulu',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)

    // Simulate battery updates
    const batteryInterval = setInterval(() => {
      setBatteryLevel(prev => Math.max(20, prev - Math.random() * 0.1))
    }, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(batteryInterval)
    }
  }, [])

  const handleQuickOrder = (order: Order) => {
    setCurrentOrder(order)
    setActiveMode('nfc')
  }

  const handlePaymentComplete = (amount: number) => {
    setDailyTotal(prev => prev + amount)
    setTodayOrders(prev => prev + 1)
    setCurrentOrder(null)
    setActiveMode('home')
    
    // Show success feedback
    setTimeout(() => {
      alert(`Payment of $${amount.toFixed(2)} processed successfully!`)
    }, 500)
  }

  const StatusBar = () => (
    <div className="bg-ocean-900 text-white px-4 py-2 flex items-center justify-between text-xs">
      <div className="flex items-center space-x-2">
        <Signal className="h-3 w-3" />
        <Wifi className={`h-3 w-3 ${isOnline ? 'text-green-400' : 'text-red-400'}`} />
        <span>Verizon</span>
      </div>
      <div className="font-mono">{currentTime}</div>
      <div className="flex items-center space-x-1">
        <span>{Math.round(batteryLevel)}%</span>
        <Battery className={`h-3 w-3 ${batteryLevel > 20 ? 'text-green-400' : 'text-red-400'}`} />
      </div>
    </div>
  )

  const Navigation = () => (
    <div className="bg-primary-600 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="text-white p-1"
          >
            {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <h1 className="text-lg font-bold">Ali'i Staff Terminal</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-center">
            <div className="font-semibold">${dailyTotal.toFixed(2)}</div>
            <div className="opacity-75">{todayOrders} orders</div>
          </div>
        </div>
      </div>

      {showMenu && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant={activeMode === 'home' ? 'secondary' : 'ghost'}
            onClick={() => { setActiveMode('home'); setShowMenu(false) }}
            className="justify-start text-white"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button
            variant={activeMode === 'quick' ? 'secondary' : 'ghost'}
            onClick={() => { setActiveMode('quick'); setShowMenu(false) }}
            className="justify-start text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Orders
          </Button>
          <Button
            variant={activeMode === 'nfc' ? 'secondary' : 'ghost'}
            onClick={() => { setActiveMode('nfc'); setShowMenu(false) }}
            className="justify-start text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            NFC Payment
          </Button>
          <Button
            variant={activeMode === 'qr' ? 'secondary' : 'ghost'}
            onClick={() => { setActiveMode('qr'); setShowMenu(false) }}
            className="justify-start text-white"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Payment
          </Button>
        </div>
      )}
    </div>
  )

  const HomeScreen = () => (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">${dailyTotal.toFixed(2)}</div>
          <div className="text-sm opacity-90">Today's Sales</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{todayOrders}</div>
          <div className="text-sm opacity-90">Orders Today</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-ocean-800">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={() => setActiveMode('quick')}
            className="h-16 text-left justify-start bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            size="lg"
          >
            <Zap className="h-6 w-6 mr-3" />
            <div>
              <div className="font-semibold">Quick Orders</div>
              <div className="text-sm opacity-90">Popular items for fast service</div>
            </div>
          </Button>

          <Button
            onClick={() => setActiveMode('nfc')}
            variant="outline"
            className="h-16 text-left justify-start border-2"
            size="lg"
          >
            <CreditCard className="h-6 w-6 mr-3 text-primary-600" />
            <div>
              <div className="font-semibold">NFC Payment</div>
              <div className="text-sm text-ocean-600">Tap to pay with phone or card</div>
            </div>
          </Button>

          <Button
            onClick={() => setActiveMode('qr')}
            variant="outline"
            className="h-16 text-left justify-start border-2"
            size="lg"
          >
            <QrCode className="h-6 w-6 mr-3 text-primary-600" />
            <div>
              <div className="font-semibold">QR Code Payment</div>
              <div className="text-sm text-ocean-600">Generate QR for customer to scan</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Device Status */}
      <div className="bg-ocean-50 p-4 rounded-lg">
        <h4 className="font-semibold text-ocean-800 mb-2">Device Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Connection</span>
            <span className={`flex items-center ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              <Wifi className="h-4 w-4 mr-1" />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Battery</span>
            <span className={`flex items-center ${batteryLevel > 20 ? 'text-green-600' : 'text-red-600'}`}>
              <Battery className="h-4 w-4 mr-1" />
              {Math.round(batteryLevel)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>UPP Service</span>
            <span className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ocean-50 max-w-md mx-auto relative overflow-hidden">
      <StatusBar />
      <Navigation />
      
      <div className="pb-20">
        {activeMode === 'home' && <HomeScreen />}
        {activeMode === 'quick' && (
          <QuickOrders onOrderSelect={handleQuickOrder} />
        )}
        {activeMode === 'nfc' && (
          <NFCPayment 
            order={currentOrder}
            onPaymentComplete={handlePaymentComplete}
            onBack={() => setActiveMode('home')}
          />
        )}
        {activeMode === 'qr' && (
          <QRGenerator 
            order={currentOrder}
            onPaymentComplete={handlePaymentComplete}
            onBack={() => setActiveMode('home')}
          />
        )}
      </div>

      {/* Bottom indicator for PWA */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
    </div>
  )
}