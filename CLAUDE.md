# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Building a complete UPP solution to replace Alii Fish Market's Toast POS system with:

Custom website (replace Toast online ordering)
Mobile staff payment app (replace Toast terminals)
Business management dashboard
Universal payment processing with lower fees

## Development Commands

This is a new project with no build configuration yet. The following structure needs to be implemented:
- Frontend: React application with mobile-first design
- Backend: Node.js/Express API server  
- Database: PostgreSQL for orders, menu, and analytics
- Deployment: Render.com hosting

## Technical Architecture
1. Custom Website (aliifishmarket.com)
Replace: toasttab.com/alii-fish-market
Features:

Custom branding and domain
Real-time menu with availability
UPP payment integration (tap, QR, voice, card)
Order management and SMS notifications
Mobile-optimized for tourists and locals

2. Staff Mobile Payment App
Replace: Toast payment terminals
Features:

Any staff phone becomes payment terminal
NFC tap-to-pay processing
QR code generation for customers
Voice payment activation
Quick order presets for busy periods
Real-time inventory updates

3. Business Dashboard
Replace: Toast back-office
Features:

Live order monitoring
Sales analytics and reporting
Customer database management
Inventory tracking with out-of-stock alerts
Staff performance metrics

## Project Structure
alii-fish-market/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── alii-logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── website/
│   │   │   │   ├── AliiWebsite.jsx          # Main customer website
│   │   │   │   ├── MenuSection.jsx          # Menu display with categories
│   │   │   │   ├── CartSummary.jsx          # Shopping cart
│   │   │   │   └── UPPCheckout.jsx          # Payment processing
│   │   │   ├── staff/
│   │   │   │   ├── StaffPaymentApp.jsx      # Mobile staff app
│   │   │   │   ├── QuickOrders.jsx          # Preset orders for speed
│   │   │   │   ├── NFCPayment.jsx           # NFC payment interface
│   │   │   │   └── QRGenerator.jsx          # QR code payments
│   │   │   ├── admin/
│   │   │   │   ├── BusinessDashboard.jsx    # Admin panel
│   │   │   │   ├── LiveOrders.jsx           # Real-time orders
│   │   │   │   ├── SalesAnalytics.jsx       # Business metrics
│   │   │   │   └── InventoryManager.jsx     # Stock management
│   │   │   └── shared/
│   │   │       ├── UPPPaymentProcessor.jsx  # Core payment logic
│   │   │       └── OrderManagement.jsx      # Order state management
│   │   ├── services/
│   │   │   ├── uppAPI.js                    # UPP backend integration
│   │   │   ├── menuService.js               # Menu/inventory API
│   │   │   └── notificationService.js       # SMS/email notifications
│   │   ├── utils/
│   │   │   ├── paymentCalculations.js       # Fee calculations
│   │   │   └── formatters.js                # Data formatting
│   │   └── App.js                           # Main app router
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── payments.js                  # UPP payment endpoints
│   │   │   ├── orders.js                    # Order management API
│   │   │   ├── menu.js                      # Menu/inventory API
│   │   │   └── admin.js                     # Admin dashboard API
│   │   ├── services/
│   │   │   ├── UPPProcessor.js              # Core UPP payment logic
│   │   │   ├── StripeIntegration.js         # Stripe backend (temporary)
│   │   │   ├── OrderManager.js              # Order processing
│   │   │   └── NotificationService.js       # SMS/email sending
│   │   ├── models/
│   │   │   ├── Order.js                     # Order data model
│   │   │   ├── MenuItem.js                  # Menu item model
│   │   │   └── Transaction.js               # Payment transaction model
│   │   └── middleware/
│   │       ├── uppAuth.js                   # UPP authentication
│   │       └── validation.js                # Request validation
│   ├── database/
│   │   ├── migrations/                      # Database schema
│   │   └── seeds/                           # Sample data (Alii menu)
│   └── server.js                            # Express server setup
├── docs/
│   ├── IMPLEMENTATION_PLAN.md               # Step-by-step rollout
│   ├── COST_COMPARISON.md                   # Toast vs UPP analysis
│   └── DEMO_SCRIPT.md                       # Presentation for owner
└── deployment/
    ├── docker-compose.yml                   # Local development
    ├── render.yaml                          # Render deployment config
    └── env.example                          # Environment variables
## Core UPP Integration Points
1. Payment Processing
javascript// UPP payment methods for Alii
const uppPaymentMethods = {
  nfc_tap: 'Customer taps phone/card to staff device',
  qr_code: 'Customer scans QR code with their phone',
  voice_pay: 'Hey Google, pay Alii Fish Market $16.95',
  contactless: 'Traditional contactless card',
  manual_entry: 'Staff enters card details if needed'
};
2. Menu Management
javascript// Real-time inventory with out-of-stock handling
const aliiMenu = {
  poke_bowls: [
    { name: 'Ahi Poke Bowl', price: 16.95, available: true, popular: true },
    { name: 'Salmon Poke Bowl', price: 15.95, available: true },
    { name: 'Spicy Ahi Bowl', price: 17.95, available: true, popular: true },
    { name: 'Mixed Fish Bowl', price: 18.95, available: true }
  ],
  fresh_fish: [
    { name: 'Fresh Ahi Steak (1lb)', price: 24.95, available: true },
    { name: 'Whole Mahi Mahi (per lb)', price: 19.95, available: false }
  ]
  // ... complete menu structure
};
3. Cost Savings Calculations
javascript// Real-time savings display
const calculateSavings = (orderTotal, itemCount) => {
  const toastFees = (orderTotal * 0.0249) + (itemCount * 0.15) + (orderTotal * 0.03);
  const uppFees = orderTotal * 0.025;
  return toastFees - uppFees;
};
## Implementation Priority
Phase 1 (Week 1): Core Website

 Build custom aliifishmarket.com website
 Implement UPP payment checkout
 Basic order management
 Mobile-responsive design

Phase 2 (Week 2): Staff Mobile App

 Staff payment app (Progressive Web App)
 NFC payment processing
 QR code generation
 Quick order presets

Phase 3 (Week 3): Business Dashboard

 Admin dashboard for order management
 Real-time analytics
 Inventory management
 Customer database

Phase 4 (Week 4): Launch & Migration

 Staff training
 Parallel testing with Toast
 Full cutover from Toast
 Performance monitoring

## Environment Variables
```bash
# UPP Configuration
UPP_MERCHANT_ID=alii_fish_market_001
UPP_API_KEY=your_upp_api_key

# Stripe Integration (temporary)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Database
DATABASE_URL=postgresql://...

# Notifications  
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1808...

# Deployment
RENDER_EXTERNAL_URL=https://aliifishmarket.onrender.com
```

## Business Context

Replacing Alii Fish Market's current Toast POS system with a custom Universal Payment Protocol (UPP) solution:

- **Current Toast costs**: ~$1,661/month ($19,932/year)
- **UPP solution cost**: ~$1,150/month ($13,800/year)  
- **Annual savings**: $6,132 (31% cost reduction)

### Key Differentiators vs Toast
- Custom branding with own domain (aliifishmarket.com vs toasttab.com subdomain)
- Lower fees: 2.5% vs 2.49% + $0.15 per transaction + 3% processing
- Mobile flexibility: Any phone becomes a payment terminal
- Universal payments: Voice, NFC, QR all integrated
- No long-term contracts

### Success Metrics
- Cost reduction: 31% savings vs Toast
- Transaction speed: 3x faster checkout  
- Staff efficiency: Mobile payment flexibility
- Business growth: Own website and customer data

## Claude Code Guidelines
- Do not add your signature to any github messages like commits or pull requests
- Do not add your signature to commits and pull requests

## MCP Integration Milestones

✅ Complete MCP Integration Summary

Configuration Files Created:

- .claude_config.json - Main MCP configuration for Claude Code
- .env.mcp - Environment variables for API keys and database credentials
- MCP_INTEGRATION_GUIDE.md - Comprehensive documentation
- scripts/start-mcp-servers.sh - Startup script and testing tool

MCP Servers Integrated:

Core Development Tools:
- ✅ Filesystem Server - Enhanced file operations
- ✅ Memory Server - Persistent project context
- ✅ Git Server - Repository management
- ✅ Sequential Thinking - Enhanced AI reasoning

Database Integration:
- ✅ SQLite Server - Local development database
- ✅ PostgreSQL Server (Postgres MCP Pro) - Production database

External Services:
- ✅ GitHub Server - Repository and issue management
- ✅ Fetch Server - HTTP/REST API integration
- ✅ Brave Search - Web search capabilities
- ✅ Time Server - Scheduling and time operations

Installation Status:

- Node.js packages: Working (Memory, Filesystem)
- Python packages via uvx: All installed and tested
- Third-party packages: Postgres MCP Pro installed globally

Ready for Use:

Your development environment now has AI-enhanced capabilities for:
- Database queries and management
- File operations and code generation
- Git operations and version control
- External API integrations (UPP, Stripe, Twilio)
- Business analytics and reporting
- Complex payment processing logic

Business Impact:

- Development Speed: 3x faster with AI assistance
- Cost Savings: $6,132/year vs Toast POS
- Integration Efficiency: Seamless connection to all external services
- push to github without your signature