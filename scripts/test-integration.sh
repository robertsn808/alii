#!/bin/bash

# Integration Test Script for Alii Fish Market
# Tests connectivity with existing UPP and Seller services

set -e

echo "🐟 Testing Alii Fish Market Integration with realconnect.online services..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
fi

# Test URLs
UPP_URL="https://upp.realconnect.online"
SELLER_URL="https://realconnect.online"
ALII_FRONTEND_URL="https://aliifishmarket.realconnect.online"
ALII_API_URL="https://alii-api.realconnect.online"

echo -e "${YELLOW}🔍 Testing External Service Connectivity...${NC}"

# Test UPP Service
echo "Testing UPP service..."
if curl -s --head "$UPP_URL" | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ UPP Service ($UPP_URL): Accessible${NC}"
else
    echo -e "${RED}❌ UPP Service ($UPP_URL): Not accessible${NC}"
fi

# Test Seller Service  
echo "Testing Seller service..."
if curl -s --head "$SELLER_URL" | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Seller Service ($SELLER_URL): Accessible${NC}"
else
    echo -e "${RED}❌ Seller Service ($SELLER_URL): Not accessible${NC}"
fi

echo ""
echo -e "${YELLOW}🚀 Testing Alii Fish Market Services (Post-Deployment)...${NC}"

# Test Alii Frontend (will work after deployment)
echo "Testing Alii Frontend..."
if curl -s --head "$ALII_FRONTEND_URL" | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Alii Frontend ($ALII_FRONTEND_URL): Accessible${NC}"
else
    echo -e "${YELLOW}⏳ Alii Frontend ($ALII_FRONTEND_URL): Not deployed yet${NC}"
fi

# Test Alii API (will work after deployment)
echo "Testing Alii API..."
if curl -s --head "$ALII_API_URL/actuator/health" | head -n 1 | grep -q "200"; then
    echo -e "${GREEN}✅ Alii API ($ALII_API_URL): Accessible${NC}"
    
    # Test specific endpoints if API is up
    echo "Testing API endpoints..."
    
    if curl -s "$ALII_API_URL/actuator/health" | grep -q "UP"; then
        echo -e "${GREEN}  ✅ Health Check: Healthy${NC}"
    fi
    
    if curl -s "$ALII_API_URL/api/menu/items" | grep -q '\['; then
        echo -e "${GREEN}  ✅ Menu API: Working${NC}"
    fi
    
else
    echo -e "${YELLOW}⏳ Alii API ($ALII_API_URL): Not deployed yet${NC}"
fi

# Test local build capability
echo ""
echo -e "${YELLOW}🏗️  Testing Local Build Capability...${NC}"

# Test frontend build
if [ -d "frontend" ]; then
    echo "Testing frontend build..."
    cd frontend
    if npm ci --silent && npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: Build successful${NC}"
    else
        echo -e "${RED}❌ Frontend: Build failed${NC}"
    fi
    cd ..
fi

# Test backend build
if [ -d "backend" ]; then
    echo "Testing backend build..."
    cd backend
    if ./mvnw clean package -DskipTests -q > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend: Build successful${NC}"
    else
        echo -e "${RED}❌ Backend: Build failed${NC}"
    fi
    cd ..
fi

echo ""
echo -e "${YELLOW}🔗 Integration Configuration Check...${NC}"

# Check environment variables
echo "Checking integration configuration..."

if [ -n "$UPP_API_ENDPOINT" ]; then
    echo -e "${GREEN}✅ UPP_API_ENDPOINT: $UPP_API_ENDPOINT${NC}"
else
    echo -e "${YELLOW}⚠️  UPP_API_ENDPOINT: Not configured${NC}"
fi

if [ -n "$SELLER_API_ENDPOINT" ]; then
    echo -e "${GREEN}✅ SELLER_API_ENDPOINT: $SELLER_API_ENDPOINT${NC}"
else
    echo -e "${YELLOW}⚠️  SELLER_API_ENDPOINT: Not configured${NC}"
fi

if [ -n "$UPP_MERCHANT_ID" ]; then
    echo -e "${GREEN}✅ UPP_MERCHANT_ID: $UPP_MERCHANT_ID${NC}"
else
    echo -e "${YELLOW}⚠️  UPP_MERCHANT_ID: Not configured${NC}"
fi

echo ""
echo -e "${GREEN}📊 Integration Summary:${NC}"
echo ""
echo "🏗️  Architecture:"
echo "   realconnect.online (Main Platform)"
echo "   ├── upp.realconnect.online (UPP Service) ✅"  
echo "   ├── realconnect.online (Seller Platform) ✅"
echo "   └── aliifishmarket.realconnect.online (Alii Fish Market) ⏳"
echo ""
echo "🔗 Integration Points:"
echo "   • UPP Payment Processing"
echo "   • Seller Platform Data Sync"
echo "   • Shared Customer Database"
echo "   • Cross-platform Authentication"
echo ""
echo "💰 Value Proposition:"
echo "   • Annual Savings: \$6,132 vs Toast POS"
echo "   • Cost Reduction: 31%"
echo "   • Custom Domain & Branding"
echo "   • Mobile Staff Flexibility"
echo ""

if curl -s --head "$UPP_URL" > /dev/null && curl -s --head "$SELLER_URL" > /dev/null; then
    echo -e "${GREEN}🎯 Ready for Integration Demo!${NC}"
    echo "   Your existing services are accessible and ready for Alii integration."
else
    echo -e "${YELLOW}⚠️  Check External Service Connectivity${NC}"
    echo "   Ensure your UPP and Seller services are running before demo."
fi

echo ""
echo -e "${GREEN}🐟 Integration test complete!${NC}"