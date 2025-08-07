'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Star, Plus, Minus, Flame, Clock } from 'lucide-react'
import { MenuItem } from '@/types'

interface MenuCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem, quantity: number) => void
}

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      await onAddToCart(item, quantity)
      // Optional: Show success message
    } finally {
      setIsAdding(false)
    }
  }

  const incrementQuantity = () => {
    if (quantity < 10) setQuantity(quantity + 1)
  }

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const getSpicyLevelColor = (level: string) => {
    switch (level) {
      case 'mild': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'spicy': return 'text-orange-500'
      case 'extra-spicy': return 'text-red-500'
      default: return 'text-gray-400'
    }
  }

  const getSpicyLevelIcons = (level: string) => {
    const iconCount = level === 'mild' ? 1 : level === 'medium' ? 2 : level === 'spicy' ? 3 : 4
    return Array.from({ length: iconCount }, (_, i) => (
      <Flame key={i} className={`h-3 w-3 ${getSpicyLevelColor(level)} fill-current`} />
    ))
  }

  return (
    <div className={`menu-item-card group ${!item.available ? 'opacity-60' : ''}`}>
      {/* Image Section */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={300}
            height={200}
            className="aspect-[3/2] object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-[3/2] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <div className="text-center text-primary-600">
              <div className="text-4xl mb-2">🐟</div>
              <p className="text-sm opacity-75">No image</p>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.popular && (
            <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Popular
            </div>
          )}
          {!item.available && (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Sold Out
            </div>
          )}
        </div>

        {/* Spicy Level */}
        {item.spicyLevel && (
          <div className="absolute top-2 right-2 flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
            {getSpicyLevelIcons(item.spicyLevel)}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-semibold text-xl text-ocean-800 line-clamp-2">
            {item.name}
          </h3>
          <span className="text-2xl font-bold text-primary-600 ml-2">
            ${item.price.toFixed(2)}
          </span>
        </div>

        <p className="text-ocean-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Preparation Time */}
        <div className="flex items-center gap-4 mb-4 text-sm text-ocean-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{item.preparationTime} min</span>
          </div>
          
          {item.nutritionalInfo && (
            <span className="text-xs">
              {item.nutritionalInfo.calories} cal
            </span>
          )}
        </div>

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-ocean-500">
              <span className="font-semibold">Contains:</span> {item.allergens.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Action Section */}
      <div className="border-t border-ocean-100 pt-4 mt-4">
        {item.available ? (
          <div className="flex items-center justify-between">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full border border-primary-300 flex items-center justify-center text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              
              <span className="w-8 text-center font-semibold text-ocean-800">
                {quantity}
              </span>
              
              <button
                onClick={incrementQuantity}
                disabled={quantity >= 10}
                className="w-8 h-8 rounded-full border border-primary-300 flex items-center justify-center text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              loading={isAdding}
              size="sm"
              className="min-w-[120px]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-red-600 font-semibold">Currently Unavailable</span>
            <p className="text-xs text-ocean-500 mt-1">Check back later or ask staff</p>
          </div>
        )}
      </div>
    </div>
  )
}