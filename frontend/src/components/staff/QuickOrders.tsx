'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Zap, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Star, 
  Clock, 
  DollarSign,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react'

interface QuickOrder {
  id: string
  name: string
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  total: number
  popular: boolean
  category: 'poke' | 'combo' | 'sides' | 'drinks'
  estimatedTime: number // minutes
}

interface QuickOrdersProps {
  onOrderSelect: (order: {
    id: string
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    total: number
  }) => void
}

export function QuickOrders({ onOrderSelect }: QuickOrdersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'poke' | 'combo' | 'sides' | 'drinks'>('all')
  const [cart, setCart] = useState<{[key: string]: number}>({})

  // Pre-configured quick orders for busy periods
  const quickOrders: QuickOrder[] = [
    {
      id: 'q1',
      name: 'Regular Ahi Poke Bowl',
      items: [
        { name: 'Ahi Poke Bowl', price: 16.95, quantity: 1 }
      ],
      total: 16.95,
      popular: true,
      category: 'poke',
      estimatedTime: 2
    },
    {
      id: 'q2', 
      name: 'Spicy Ahi Combo',
      items: [
        { name: 'Spicy Ahi Bowl', price: 17.95, quantity: 1 },
        { name: 'POG Juice', price: 3.50, quantity: 1 }
      ],
      total: 21.45,
      popular: true,
      category: 'combo',
      estimatedTime: 3
    },
    {
      id: 'q3',
      name: 'Salmon Poke Special',
      items: [
        { name: 'Salmon Poke Bowl', price: 15.95, quantity: 1 },
        { name: 'Seaweed Salad', price: 4.95, quantity: 1 }
      ],
      total: 20.90,
      popular: false,
      category: 'combo',
      estimatedTime: 3
    },
    {
      id: 'q4',
      name: 'Mixed Fish Deluxe',
      items: [
        { name: 'Mixed Fish Bowl', price: 18.95, quantity: 1 },
        { name: 'Mac Salad', price: 3.95, quantity: 1 },
        { name: 'Coconut Water', price: 2.95, quantity: 1 }
      ],
      total: 25.85,
      popular: false,
      category: 'combo',
      estimatedTime: 4
    },
    {
      id: 'q5',
      name: 'Tourist Combo',
      items: [
        { name: 'Ahi Poke Bowl', price: 16.95, quantity: 1 },
        { name: 'Kalua Pig', price: 12.95, quantity: 1 },
        { name: 'POG Juice', price: 3.50, quantity: 1 }
      ],
      total: 33.40,
      popular: true,
      category: 'combo',
      estimatedTime: 5
    },
    {
      id: 'q6',
      name: 'Quick Sides Pack',
      items: [
        { name: 'Mac Salad', price: 3.95, quantity: 2 },
        { name: 'Rice', price: 2.50, quantity: 2 }
      ],
      total: 12.90,
      popular: false,
      category: 'sides',
      estimatedTime: 1
    },
    {
      id: 'q7',
      name: 'Drink Pack',
      items: [
        { name: 'POG Juice', price: 3.50, quantity: 2 },
        { name: 'Coconut Water', price: 2.95, quantity: 2 }
      ],
      total: 12.90,
      popular: false,
      category: 'drinks',
      estimatedTime: 1
    },
    {
      id: 'q8',
      name: 'Family Bowl Set',
      items: [
        { name: 'Ahi Poke Bowl', price: 16.95, quantity: 2 },
        { name: 'Salmon Poke Bowl', price: 15.95, quantity: 1 },
        { name: 'Mixed Fish Bowl', price: 18.95, quantity: 1 }
      ],
      total: 68.80,
      popular: true,
      category: 'combo',
      estimatedTime: 8
    }
  ]

  const filteredOrders = useMemo(() => {
    return quickOrders.filter(order => {
      const matchesSearch = order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || order.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  const addToCart = (orderId: string, quantity: number = 1) => {
    setCart(prev => ({
      ...prev,
      [orderId]: (prev[orderId] || 0) + quantity
    }))
  }

  const removeFromCart = (orderId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[orderId] > 1) {
        newCart[orderId]--
      } else {
        delete newCart[orderId]
      }
      return newCart
    })
  }

  const getTotalCartValue = () => {
    return Object.entries(cart).reduce((total, [orderId, quantity]) => {
      const order = quickOrders.find(o => o.id === orderId)
      return total + (order ? order.total * quantity : 0)
    }, 0)
  }

  const getTotalCartItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  }

  const processCart = () => {
    const allItems: Array<{name: string, price: number, quantity: number}> = []
    let totalAmount = 0

    Object.entries(cart).forEach(([orderId, quantity]) => {
      const order = quickOrders.find(o => o.id === orderId)
      if (order) {
        order.items.forEach(item => {
          // Check if item already exists in allItems
          const existingItem = allItems.find(i => i.name === item.name)
          if (existingItem) {
            existingItem.quantity += item.quantity * quantity
          } else {
            allItems.push({
              ...item,
              quantity: item.quantity * quantity
            })
          }
        })
        totalAmount += order.total * quantity
      }
    })

    const combinedOrder = {
      id: `quick-${Date.now()}`,
      items: allItems,
      total: totalAmount
    }

    onOrderSelect(combinedOrder)
  }

  const categoryLabels = {
    'all': 'All Items',
    'poke': 'Poke Bowls',
    'combo': 'Combos',
    'sides': 'Sides',
    'drinks': 'Drinks'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-ocean-800 mb-2">Quick Orders</h2>
        <p className="text-ocean-600 text-sm">Pre-configured orders for fast service</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 border border-ocean-200">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ocean-400" />
            <input
              type="text"
              placeholder="Search quick orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-ocean-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-ocean-600 flex-shrink-0" />
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(key as any)}
                className="whitespace-nowrap"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Orders Grid */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const cartQuantity = cart[order.id] || 0
          
          return (
            <div 
              key={order.id} 
              className="bg-white rounded-xl p-4 border border-ocean-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-ocean-800">{order.name}</h3>
                    {order.popular && (
                      <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Popular
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-ocean-500 mb-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx}>
                        {item.quantity}x {item.name} (${item.price.toFixed(2)})
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-ocean-600">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-semibold text-primary-600">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{order.estimatedTime} min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromCart(order.id)}
                    disabled={cartQuantity === 0}
                    className="w-8 h-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="w-8 text-center font-semibold">
                    {cartQuantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToCart(order.id)}
                    className="w-8 h-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => onOrderSelect({
                    id: `quick-${order.id}-${Date.now()}`,
                    items: order.items,
                    total: order.total
                  })}
                  size="sm"
                  className="bg-gradient-to-r from-primary-500 to-primary-600"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Quick Pay
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cart Summary */}
      {getTotalCartItems() > 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold">Cart Summary</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">${getTotalCartValue().toFixed(2)}</div>
              <div className="text-sm opacity-90">{getTotalCartItems()} items</div>
            </div>
          </div>
          
          <Button
            onClick={processCart}
            className="w-full bg-white text-primary-600 hover:bg-primary-50 font-semibold"
          >
            Process Combined Order
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
        <h4 className="font-semibold text-primary-800 mb-2 flex items-center">
          <Zap className="h-4 w-4 mr-2" />
          Quick Order Tips
        </h4>
        <div className="space-y-1 text-sm text-primary-700">
          <div>• Tap "Quick Pay" for immediate single order processing</div>
          <div>• Use +/- buttons to add multiple of same order to cart</div>
          <div>• "Process Combined Order" merges cart items for bulk orders</div>
          <div>• Popular items are marked with star for busy periods</div>
        </div>
      </div>
    </div>
  )
}