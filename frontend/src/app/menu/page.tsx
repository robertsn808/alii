import data from '@/data/menu.json'
import { MenuItem } from '@/types'
import MenuPageClient from './MenuPageClient'

export const metadata = {
  title: "Menu - Ali'i Fish Market",
  description: 'Browse our full menu of poke, specialties, smoked meats, and desserts',
  alternates: { canonical: '/menu' },
  openGraph: {
    title: "Menu - Ali'i Fish Market",
    description: 'Full menu of poke, specialties, smoked meats, and desserts',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: "Menu - Ali'i Fish Market",
    description: 'Full menu of poke, specialties, smoked meats, and desserts'
  }
}

export const revalidate = 3600

export default function MenuPage() {
  const items = (data.items as MenuItem[]) || []
  return <MenuPageClient items={items} />
}


