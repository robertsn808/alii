// Core types for Alii Fish Market

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: MenuCategory
  imageUrl?: string
  available: boolean
  popular?: boolean
  spicyLevel?: 'mild' | 'medium' | 'spicy' | 'extra-spicy'
  allergens?: string[]
  nutritionalInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  preparationTime: number // in minutes
  tags?: string[]
}

// Allow dynamic categories from external sources
export type MenuCategory = string

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  customizations?: string[]
  specialInstructions?: string
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  total: number
  tax: number
  fees: number
  grandTotal: number
}

export interface Customer {
  id?: string
  name: string
  email: string
  phone: string
  loyaltyPoints?: number
  preferences?: {
    favoriteItems?: string[]
    dietaryRestrictions?: string[]
    spicePreference?: 'mild' | 'medium' | 'spicy' | 'extra-spicy'
  }
}

export interface Order {
  id: string
  customer: Customer
  items: CartItem[]
  status: OrderStatus
  orderType: 'pickup' | 'delivery'
  scheduledTime?: Date
  estimatedReady: Date
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  createdAt: Date
  updatedAt: Date
  specialInstructions?: string
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export type PaymentMethod = 
  | 'nfc'
  | 'qr-code'
  | 'voice'
  | 'card'
  | 'cash'

export interface UPPPaymentRequest {
  amount: number
  deviceType: 'smartphone' | 'tablet' | 'smart-tv' | 'iot-device'
  deviceId: string
  description: string
  customerEmail: string
  metadata?: Record<string, any>
}

export interface UPPPaymentResponse {
  success: boolean
  paymentId?: string
  transactionId?: string
  error?: string
  paymentUrl?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minimumStock: number
  unit: string
  pricePerUnit: number
  supplier: string
  lastRestocked: Date
  expirationDate?: Date
  freshness: 'excellent' | 'good' | 'fair' | 'expired'
  location: string
}

export interface StaffMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier' | 'kitchen'
  deviceIds: string[]
  permissions: string[]
  active: boolean
}

export interface BusinessMetrics {
  dailySales: number
  orderCount: number
  averageOrderValue: number
  popularItems: Array<{
    itemId: string
    name: string
    orderCount: number
  }>
  customerSatisfaction: number
  peakHours: Array<{
    hour: number
    orderCount: number
  }>
}