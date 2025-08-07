'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Calculator,
  DollarSign,
  Delete,
  Check,
  X,
  Receipt,
  User,
  Clock,
  CreditCard,
  Banknote,
  ArrowLeft,
  History,
  TrendingUp
} from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  paymentMethod: 'cash' | 'card' | 'nfc' | 'qr'
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  staffId: string
  staffName: string
  timestamp: Date
  receiptNumber: string
}

interface CashRegisterProps {
  staffId: string
  staffName: string
  onBack: () => void
}

export function CashRegister({ staffId, staffName, onBack }: CashRegisterProps) {
  const [display, setDisplay] = useState('0.00')
  const [currentTransaction, setCurrentTransaction] = useState<{
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    subtotal: number
    tax: number
    total: number
  }>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  })
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'nfc' | 'qr' | null>(null)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [dailyTotal, setDailyTotal] = useState(2845.50)
  const [transactionCount, setTransactionCount] = useState(47)

  // Quick menu items for cash register
  const quickItems = [
    { name: 'Ahi Poke Bowl', price: 16.95 },
    { name: 'Salmon Poke Bowl', price: 15.95 },
    { name: 'Spicy Ahi Bowl', price: 17.95 },
    { name: 'Mixed Fish Bowl', price: 18.95 },
    { name: 'Fresh Ahi Steak (1lb)', price: 24.95 },
    { name: 'Kalua Pig', price: 12.95 },
    { name: 'Mac Salad', price: 3.95 },
    { name: 'Rice', price: 2.50 },
    { name: 'POG Juice', price: 3.50 },
    { name: 'Coconut Water', price: 2.95 }
  ]

  const addItem = (item: { name: string, price: number }) => {
    const existingItem = currentTransaction.items.find(i => i.name === item.name)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      currentTransaction.items.push({ ...item, quantity: 1 })
    }

    calculateTotals()
  }

  const removeItem = (itemName: string) => {
    const itemIndex = currentTransaction.items.findIndex(i => i.name === itemName)
    if (itemIndex > -1) {
      const item = currentTransaction.items[itemIndex]
      if (item.quantity > 1) {
        item.quantity -= 1
      } else {
        currentTransaction.items.splice(itemIndex, 1)
      }
      calculateTotals()
    }
  }

  const calculateTotals = () => {
    const subtotal = currentTransaction.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.04712 // Hawaii tax rate
    const total = subtotal + tax

    setCurrentTransaction(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }))

    setDisplay(total.toFixed(2))
  }

  const processPayment = async () => {
    if (!paymentMethod || currentTransaction.total === 0) return

    const transaction: Transaction = {
      id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: currentTransaction.total,
      paymentMethod,
      items: [...currentTransaction.items],
      staffId,
      staffName,
      timestamp: new Date(),
      receiptNumber: `R${Date.now().toString().slice(-6)}`
    }

    try {
      // In a real app, this would call the backend API
      await logTransaction(transaction)
      
      setLastTransaction(transaction)
      setDailyTotal(prev => prev + transaction.amount)
      setTransactionCount(prev => prev + 1)
      setShowReceipt(true)
      
      // Reset for next transaction
      setTimeout(() => {
        resetTransaction()
      }, 3000)
      
    } catch (error) {
      console.error('Failed to process transaction:', error)
      alert('Transaction failed. Please try again.')
    }
  }

  const logTransaction = async (transaction: Transaction) => {
    // This would be replaced with actual API call
    console.log('Logging transaction:', transaction)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation, this would save to database
    const existingTransactions = JSON.parse(localStorage.getItem('daily_transactions') || '[]')
    existingTransactions.push(transaction)
    localStorage.setItem('daily_transactions', JSON.stringify(existingTransactions))
  }

  const resetTransaction = () => {
    setCurrentTransaction({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    })
    setDisplay('0.00')
    setPaymentMethod(null)
    setCashReceived(0)
    setShowReceipt(false)
  }

  const numberPad = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.']

  const handleNumberPad = (value: string) => {
    if (value === 'C') {
      setDisplay('0.00')
      setCashReceived(0)
    } else if (value === '.') {
      if (!display.includes('.')) {
        setDisplay(prev => prev + '.')
      }
    } else {
      setDisplay(prev => {
        if (prev === '0.00') return value + '.00'
        return prev.replace('.00', '') + value + '.00'
      })
      setCashReceived(parseFloat(display.replace('.00', '') + value + '.00') || 0)
    }
  }

  if (showReceipt && lastTransaction) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-green-800">Payment Successful!</h2>
          <p className="text-green-600">${lastTransaction.amount.toFixed(2)} processed</p>
        </div>

        {/* Receipt */}
        <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-lg font-mono text-sm">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">ALI'I FISH MARKET</h3>
            <p>123 Aloha Street, Honolulu, HI</p>
            <p>(808) 123-FISH</p>
            <div className="border-b border-dashed my-2"></div>
          </div>

          <div className="space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span>{lastTransaction.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{lastTransaction.timestamp.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{lastTransaction.timestamp.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{lastTransaction.staffName}</span>
            </div>
          </div>

          <div className="border-b border-dashed mb-2"></div>
          
          {lastTransaction.items.map((item, index) => (
            <div key={index} className="flex justify-between mb-1">
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="border-b border-dashed my-2"></div>
          
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${currentTransaction.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (4.712%):</span>
            <span>${currentTransaction.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>${lastTransaction.amount.toFixed(2)}</span>
          </div>
          
          <div className="border-b border-dashed my-2"></div>
          
          <div className="flex justify-between">
            <span>Payment:</span>
            <span>{lastTransaction.paymentMethod.toUpperCase()}</span>
          </div>
          
          {paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between">
                <span>Cash Received:</span>
                <span>${cashReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>${(cashReceived - lastTransaction.amount).toFixed(2)}</span>
              </div>
            </>
          )}
          
          <div className="text-center mt-4 text-xs">
            <p>Mahalo for your business!</p>
            <p>Visit us at aliifishmarket.com</p>
          </div>
        </div>

        <Button
          onClick={resetTransaction}
          className="w-full"
          size="lg"
        >
          New Transaction
        </Button>
      </div>
    )
  }

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
        <div className="text-center">
          <h2 className="text-xl font-bold text-ocean-800">Cash Register</h2>
          <p className="text-sm text-ocean-600">Cashier: {staffName}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <History className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
          <div className="text-lg font-bold">${dailyTotal.toFixed(2)}</div>
          <div className="text-sm opacity-90">Daily Sales</div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
          <div className="text-lg font-bold">{transactionCount}</div>
          <div className="text-sm opacity-90">Transactions</div>
        </div>
      </div>

      {/* Current Transaction Display */}
      <div className="bg-black text-green-400 p-6 rounded-lg font-mono">
        <div className="text-right">
          <div className="text-4xl font-bold mb-2">${display}</div>
          <div className="text-sm opacity-75">
            Items: {currentTransaction.items.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
        </div>
      </div>

      {/* Transaction Items */}
      {currentTransaction.items.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-ocean-200 max-h-48 overflow-y-auto">
          <h3 className="font-semibold mb-3">Current Order</h3>
          {currentTransaction.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex-1">
                <span className="font-medium">{item.quantity}x {item.name}</span>
                <div className="text-sm text-ocean-600">${item.price.toFixed(2)} each</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.name)}
                  className="text-red-500 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${currentTransaction.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>${currentTransaction.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${currentTransaction.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Items */}
      <div className="bg-white rounded-xl p-4 border border-ocean-200">
        <h3 className="font-semibold mb-3">Quick Add Items</h3>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {quickItems.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => addItem(item)}
              className="text-left justify-start h-auto p-3"
            >
              <div>
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-ocean-600">${item.price.toFixed(2)}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      {currentTransaction.total > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('cash')}
              className="h-16"
            >
              <Banknote className="h-6 w-6 mr-2" />
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('card')}
              className="h-16"
            >
              <CreditCard className="h-6 w-6 mr-2" />
              Card
            </Button>
          </div>

          {/* Cash Payment Entry */}
          {paymentMethod === 'cash' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Cash Received</label>
                <div className="text-2xl font-bold text-center p-3 bg-white border rounded">
                  ${cashReceived.toFixed(2)}
                </div>
                {cashReceived > currentTransaction.total && (
                  <div className="text-center mt-2">
                    <span className="text-green-600 font-semibold">
                      Change: ${(cashReceived - currentTransaction.total).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {numberPad.map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    onClick={() => handleNumberPad(num)}
                    className="h-12"
                  >
                    {num === 'C' ? <Delete className="h-4 w-4" /> : num}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Process Payment Button */}
          <Button
            onClick={processPayment}
            disabled={!paymentMethod || (paymentMethod === 'cash' && cashReceived < currentTransaction.total)}
            className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-primary-500 to-primary-600"
            size="lg"
          >
            <Receipt className="h-6 w-6 mr-2" />
            Process Payment ${currentTransaction.total.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )
}