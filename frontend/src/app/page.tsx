'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { ShoppingCart, Star, Clock, Phone, MapPin, Waves } from 'lucide-react'

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        timeZone: 'Pacific/Honolulu',
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const popularItems = [
    {
      id: '1',
      name: 'Ahi Poke Bowl',
      price: 16.95,
      image: '/images/ahi-poke-bowl.jpg',
      popular: true,
      description: 'Fresh ahi tuna with traditional Hawaiian seasoning'
    },
    {
      id: '2', 
      name: 'Salmon Poke Bowl',
      price: 15.95,
      image: '/images/salmon-poke-bowl.jpg',
      description: 'Wild-caught salmon with island-style marinade'
    },
    {
      id: '3',
      name: 'Fresh Ahi Steak (1lb)',
      price: 24.95,
      image: '/images/fresh-ahi.jpg',
      popular: true,
      description: 'Sashimi-grade ahi tuna, perfect for grilling'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="glass-effect sticky top-0 z-50 border-b border-primary-200/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Waves className="h-8 w-8 text-primary-500 animate-float" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold gradient-text">
                  Ali'i Fish Market
                </h1>
                <p className="text-sm text-ocean-600">Fresh Hawaiian Seafood</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 text-sm text-ocean-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Hawaii Time: {currentTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>(808) 123-FISH</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                <span className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 ocean-gradient">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/50 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-fade-in">
              Fresh from the
              <span className="block text-yellow-300 animate-float">
                Hawaiian Waters
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl mb-8 text-primary-50 max-w-2xl mx-auto animate-slide-up">
              Experience the finest selection of daily-caught fish and authentic poke bowls. 
              From our ocean to your table.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4">
                Order Online Now
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                View Today's Fresh Catch
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 opacity-20 animate-float">
          <div className="w-20 h-20 rounded-full bg-white/20"></div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-20 animate-float" style={{animationDelay: '1s'}}>
          <div className="w-16 h-16 rounded-full bg-white/20"></div>
        </div>
      </section>

      {/* Popular Items Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-display font-bold gradient-text mb-4">
              Today's Popular Selections
            </h3>
            <p className="text-ocean-600 text-lg max-w-2xl mx-auto">
              Fresh daily catches and customer favorites, prepared with traditional Hawaiian techniques
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {popularItems.map((item, index) => (
              <div 
                key={item.id} 
                className="menu-item-card animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="relative mb-4">
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-primary-600">
                      <Waves className="h-16 w-16 opacity-50" />
                    </div>
                  </div>
                  
                  {item.popular && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Popular
                    </div>
                  )}
                </div>
                
                <h4 className="font-display font-semibold text-xl text-ocean-800 mb-2">
                  {item.name}
                </h4>
                
                <p className="text-ocean-600 text-sm mb-4">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">
                    ${item.price}
                  </span>
                  
                  <Button size="sm">
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              View Full Menu
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-ocean-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-display font-bold gradient-text mb-4">
              Why Choose Ali'i Fish Market?
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Waves,
                title: 'Daily Fresh Catch',
                description: 'Our fishermen bring in the freshest seafood every morning from Hawaiian waters'
              },
              {
                icon: Star,
                title: 'Traditional Poke',
                description: 'Authentic Hawaiian poke recipes passed down through generations'
              },
              {
                icon: Clock,
                title: 'Quick Service',
                description: 'Fast ordering with our Universal Payment Protocol - tap, scan, or voice order'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center animate-slide-up" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{animationDelay: `${index * 0.5}s`}}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                
                <h4 className="font-display font-semibold text-xl text-ocean-800 mb-2">
                  {feature.title}
                </h4>
                
                <p className="text-ocean-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-4xl font-display font-bold gradient-text mb-8">
              Visit Our Market
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-6 w-6 text-primary-500" />
                    <div>
                      <p className="font-semibold text-ocean-800">123 Aloha Street</p>
                      <p className="text-ocean-600">Honolulu, HI 96813</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-primary-500" />
                    <div>
                      <p className="font-semibold text-ocean-800">Daily: 6:00 AM - 8:00 PM</p>
                      <p className="text-ocean-600">Fresh fish arrives at 6 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-6 w-6 text-primary-500" />
                    <div>
                      <p className="font-semibold text-ocean-800">(808) 123-FISH</p>
                      <p className="text-ocean-600">Call ahead for large orders</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl p-8">
                <div className="text-center text-primary-700">
                  <Waves className="h-24 w-24 mx-auto mb-4 opacity-50 animate-float" />
                  <p className="text-sm">Interactive map coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ocean-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Waves className="h-8 w-8 text-primary-400 animate-float" />
              <h4 className="text-2xl font-display font-bold">Ali'i Fish Market</h4>
            </div>
            
            <p className="text-ocean-300 mb-6 max-w-md mx-auto">
              Bringing you the freshest Hawaiian seafood with modern convenience and traditional quality.
            </p>
            
            <div className="flex justify-center space-x-8 text-sm text-ocean-400">
              <span>&copy; 2025 Ali'i Fish Market</span>
              <span>•</span>
              <span>Made in Hawaii</span>
              <span>•</span>
              <span>Powered by UPP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}