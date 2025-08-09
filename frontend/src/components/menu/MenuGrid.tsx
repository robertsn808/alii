'use client'

import { useState, useMemo } from 'react'
import { MenuCard } from './MenuCard'
import { MenuItem, MenuCategory } from '@/types'
import { Search, Filter } from 'lucide-react'

interface MenuGridProps {
  items: MenuItem[]
  onAddToCart: (item: MenuItem, quantity: number) => void
}

// With dynamic categories, use the raw category as display, title-cased
const toTitle = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export function MenuGrid({ items, onAddToCart }: MenuGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all')
  const [showAvailableOnly, setShowAvailableOnly] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popular'>('popular')

  // Get unique categories from items
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category)))
    return uniqueCategories.sort()
  }, [items])

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.tags && item.tags.some(tag => 
                            tag.toLowerCase().includes(searchTerm.toLowerCase())
                          ))
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      
      // Availability filter
      const matchesAvailability = !showAvailableOnly || item.available
      
      return matchesSearch && matchesCategory && matchesAvailability
    })

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return a.price - b.price
        case 'popular':
          if (a.popular && !b.popular) return -1
          if (!a.popular && b.popular) return 1
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }, [items, searchTerm, selectedCategory, showAvailableOnly, sortBy])

  // Group items by category for display
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {}
    
    filteredAndSortedItems.forEach(item => {
      const categoryKey = item.category
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = []
      }
      grouped[categoryKey].push(item)
    })
    
    return grouped
  }, [filteredAndSortedItems])

  return (
    <div className="space-y-8">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ocean-400" />
          <input
            type="text"
            placeholder="Search menu items, descriptions, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-ocean-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ocean-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as MenuCategory | 'all')}
              className="border border-ocean-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {toTitle(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'popular')}
            className="border border-ocean-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="popular">Popular First</option>
            <option value="name">Name (A-Z)</option>
            <option value="price">Price (Low to High)</option>
          </select>

          {/* Available Only Toggle */}
          <label className="flex items-center gap-2 text-sm text-ocean-600">
            <input
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="rounded border-ocean-300 text-primary-600 focus:ring-primary-500"
            />
            Available only
          </label>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-ocean-500">
          {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? 's' : ''} found
          {searchTerm && (
            <span> for "{searchTerm}"</span>
          )}
        </div>
      </div>

      {/* Menu Items by Category */}
      {Object.entries(itemsByCategory).length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-ocean-800 mb-2">No items found</h3>
          <p className="text-ocean-600 mb-4">
            Try adjusting your search terms or filters
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
              setShowAvailableOnly(true)
            }}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <div key={category} className="space-y-6">
            {/* Category Header */}
            <div className="text-center">
              <h2 className="text-3xl font-display font-bold gradient-text mb-2">
                {toTitle(category)}
              </h2>
              <div className="w-24 h-1 ocean-gradient mx-auto rounded-full"></div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryItems.map((item) => (
                <div 
                  key={item.id} 
                  className="animate-slide-up"
                >
                  <MenuCard 
                    item={item} 
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}