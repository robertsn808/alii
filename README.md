# Ali'i Fish Market - Modern Ordering System

A complete Universal Payment Protocol (UPP) solution to replace Ali'i Fish Market's Toast POS system with a modern, cost-effective alternative.

## 🌊 Project Overview

**Cost Savings**: $6,132 annually (31% reduction from Toast POS)
- Current Toast costs: ~$1,661/month ($19,932/year)
- UPP solution cost: ~$1,150/month ($13,800/year)

## 🏗️ Architecture

### Frontend
- **Next.js 14** with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **Ocean-inspired design** with modern animations
- **Mobile-first** responsive design
- **PWA capabilities** for staff devices

### Backend  
- **Spring Boot 3.2** with Java 17
- **PostgreSQL** database with JPA/Hibernate
- **OpenAI integration** for content generation
- **Twilio SMS** notifications
- **Redis** caching layer

### Payment Processing
- **Universal Payment Protocol** integration
- **Multi-device support** (smartphones, tablets, IoT devices)
- **Multiple payment methods**: NFC, QR codes, voice payments, cards
- **2.5% transaction fees** vs Toast's higher rates

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- Java 17+ (for backend development)

### Environment Setup
1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual keys:
   - UPP API credentials
   - Stripe keys for payment processing
   - Twilio credentials for SMS
   - OpenAI key for content generation

### Development with Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **UPP Service**: http://localhost:3001
- **Database**: localhost:5432

## 🍽️ Key Features

### Customer Experience
- **Modern menu interface** with real-time availability
- **Multiple payment options** (tap, scan, voice, card)
- **Order tracking** with SMS notifications
- **Responsive design** for all devices

### Staff Features
- **Any device becomes a POS terminal**
- **NFC payment processing**
- **QR code generation** for customers
- **Real-time inventory updates**
- **Order management dashboard**

### Business Management
- **Live order monitoring**
- **Sales analytics** and reporting
- **Inventory tracking** with alerts
- **Customer database** management
- **AI-generated marketing content**

## 📱 Universal Payment Protocol

### Supported Payment Methods
- **NFC Tap**: Customer taps phone/card to staff device
- **QR Codes**: Customer scans with their phone
- **Voice Pay**: "Hey Google, pay Ali'i Fish Market $16.95"
- **Contactless Cards**: Traditional tap-to-pay
- **Manual Entry**: Staff enters card details if needed

### Device Support
- Smartphones (iOS/Android)
- Tablets (iPad, Android tablets)
- Smart TVs (for digital menus)
- IoT devices (future: smart speakers, car systems)

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
./mvnw spring-boot:run
```

### Database Migration
The database will auto-initialize with sample data on first run.

## 🔒 Security Features

- **PCI DSS Level 1 Compliant**
- **AES-256 encryption**
- **JWT authentication**
- **Rate limiting**
- **Comprehensive audit logging**
- **Input sanitization**

## 📊 Business Benefits

### vs Toast POS System
| Feature | Toast | Ali'i UPP |
|---------|-------|-----------|
| Monthly Cost | $1,661 | $1,150 |
| Transaction Fees | 2.49% + $0.15 + 3% | 2.5% |
| Domain | toasttab.com/alii | aliifishmarket.com |
| Hardware | Proprietary terminals | Any internet device |
| Contract | Multi-year | Month-to-month |
| Customization | Limited | Full control |

### Key Differentiators
- **31% cost reduction** vs Toast
- **Custom branding** with own domain
- **Universal payment methods** (voice, NFC, QR)
- **Any phone = payment terminal**
- **No long-term contracts**
- **Hawaii-based support**

## 🎯 Implementation Phases

### Phase 1: Core Website (Week 1)
- [x] Custom aliifishmarket.com website
- [x] UPP payment integration
- [x] Basic order management
- [x] Mobile-responsive design

### Phase 2: Staff App (Week 2)
- [ ] Progressive Web App for staff
- [ ] NFC payment processing
- [ ] QR code generation
- [ ] Quick order presets

### Phase 3: Dashboard (Week 3)
- [ ] Admin dashboard
- [ ] Real-time analytics
- [ ] Inventory management
- [ ] Customer database

### Phase 4: Launch (Week 4)
- [ ] Staff training
- [ ] Parallel testing with Toast
- [ ] Full cutover
- [ ] Performance monitoring

## 🌺 Hawaiian Menu Categories

- **Poke Bowls**: Traditional and spicy varieties
- **Fresh Fish**: Daily catch, sashimi-grade
- **Prepared Foods**: Kalua pig, lomi lomi salmon
- **Sides**: Rice, seaweed salad, mac salad
- **Beverages**: POG juice, coconut water
- **Desserts**: Haupia, malasadas

## 📧 Contact & Support

- **Business**: orders@aliifishmarket.com
- **Phone**: (808) 123-FISH
- **Address**: 123 Aloha Street, Honolulu, HI 96813

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

🌺 **Aloha and welcome to the future of fish market ordering!** 🌺