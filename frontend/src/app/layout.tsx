import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import { ErrorMonitoringProvider } from '../components/ErrorMonitoringProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-poppins',
  weight: ['400', '600', '700'] 
})

export const metadata: Metadata = {
  title: 'Ali\'i Fish Market - Fresh Hawaiian Seafood',
  description: 'Hawaii\'s premier fish market offering the freshest daily catch, poke bowls, and authentic Hawaiian seafood. Order online for pickup or delivery.',
  keywords: ['fish market', 'hawaii seafood', 'poke bowls', 'fresh fish', 'hawaiian food', 'alii fish market'],
  authors: [{ name: 'Ali\'i Fish Market' }],
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aliifishmarket.com'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ali\'i Fish Market'
  },
  openGraph: {
    title: 'Ali\'i Fish Market - Fresh Hawaiian Seafood',
    description: 'Hawaii\'s premier fish market offering the freshest daily catch, poke bowls, and authentic Hawaiian seafood.',
    url: 'https://aliifishmarket.com',
    siteName: 'Ali\'i Fish Market',
    images: [
      {
        url: '/images/alii-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Fresh Hawaiian seafood at Ali\'i Fish Market',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ali\'i Fish Market - Fresh Hawaiian Seafood',
    description: 'Hawaii\'s premier fish market offering the freshest daily catch and poke bowls.',
    images: ['/images/alii-hero.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className={inter.className}>
        <ErrorMonitoringProvider>
          <ErrorBoundary context="app_root">
            <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-primary-50">
              {children}
            </div>
          </ErrorBoundary>
        </ErrorMonitoringProvider>
      </body>
    </html>
  )
}