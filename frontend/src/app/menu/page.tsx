import { MenuGrid } from '@/components/menu/MenuGrid'
import data from '@/data/menu.json'
import { MenuItem } from '@/types'

export const metadata = {
  title: "Menu - Ali'i Fish Market",
  description: 'Browse our full menu of poke, specialties, smoked meats, and desserts',
}

export default function MenuPage() {
  const items = (data.items as MenuItem[]) || []

  const handleAddToCart = () => {
    // TODO: wire to cart when ready
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-display font-bold gradient-text mb-6">Our Menu</h1>
      <MenuGrid items={items} onAddToCart={handleAddToCart as any} />
    </div>
  )
}


