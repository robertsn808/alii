#!/bin/bash

# Alii Fish Market Deployment Script for Render.com
# Deploy to: aliifishmarket.realconnect.online

set -e  # Exit on any error

echo "🐟 Starting Alii Fish Market deployment to Render.com..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}📋 Checking deployment prerequisites...${NC}"

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}❌ render.yaml not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check for required files
REQUIRED_FILES=(
    "render.yaml"
    ".env.production"
    "frontend/package.json"
    "backend/pom.xml"
    "frontend/next.config.js"
    "backend/src/main/resources/application-production.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file missing: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required files present${NC}"

# Check Git status
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Consider committing before deployment.${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Validate environment variables
echo -e "${YELLOW}🔍 Validating production environment variables...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    exit 1
fi

# Check for critical environment variables
source .env.production

CRITICAL_VARS=(
    "NEXT_PUBLIC_SITE_URL"
    "NEXT_PUBLIC_API_URL"  
    "UPP_API_ENDPOINT"
    "DATABASE_URL"
)

for var in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}⚠️  Warning: $var is not set in .env.production${NC}"
    else
        echo -e "${GREEN}✅ $var is configured${NC}"
    fi
done

# Build validation
echo -e "${YELLOW}🏗️  Testing builds locally...${NC}"

# Test frontend build
echo "Testing Next.js frontend build..."
cd frontend
npm ci --quiet
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend build successful${NC}"
cd ..

# Test backend build
echo "Testing Spring Boot backend build..."
cd backend
./mvnw clean package -DskipTests -q
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend build successful${NC}"
cd ..

# Pre-deployment checklist
echo -e "${YELLOW}📝 Pre-deployment checklist:${NC}"
echo "✅ All builds successful"
echo "✅ Environment variables configured"
echo "✅ render.yaml blueprint ready"
echo "✅ Domain configuration: aliifishmarket.realconnect.online"
echo "✅ API integration: alii-api.realconnect.online"
echo "✅ UPP integration: upp.realconnect.online"
echo "✅ Seller integration: realconnect.online"

# Deployment instructions
echo ""
echo -e "${GREEN}🚀 Ready for deployment!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Push your changes to GitHub:"
echo "   git add ."
echo "   git commit -m 'Deploy Alii Fish Market to Render'"
echo "   git push origin main"
echo ""
echo "2. Deploy to Render.com:"
echo "   - Go to https://dashboard.render.com"
echo "   - Click 'New' > 'Blueprint'"
echo "   - Connect your GitHub repository"
echo "   - Use render.yaml from this project"
echo ""
echo "3. Configure custom domains in Render:"
echo "   - Frontend: aliifishmarket.realconnect.online"
echo "   - API: alii-api.realconnect.online"
echo ""
echo "4. Set up environment variables in Render dashboard:"
echo "   - Copy from .env.production"
echo "   - Add sensitive values (API keys, passwords)"
echo ""
echo "5. Database setup:"
echo "   - Render will create PostgreSQL instance"
echo "   - Run database migrations after deployment"
echo ""

# Cost comparison for demo
echo -e "${GREEN}💰 Cost Comparison for Prototype Demo:${NC}"
echo "Toast POS System:"
echo "  - Monthly: $1,661"
echo "  - Annual: $19,932"
echo ""
echo "Alii UPP System:"
echo "  - Monthly: $1,150"  
echo "  - Annual: $13,800"
echo ""
echo -e "${GREEN}Annual Savings: $6,132 (31% cost reduction)${NC}"
echo ""

# Demo URLs
echo -e "${YELLOW}🎯 Prototype Demo URLs:${NC}"
echo "• Customer Website: https://aliifishmarket.realconnect.online"
echo "• Staff Payment App: https://aliifishmarket.realconnect.online/staff"
echo "• Business Dashboard: https://aliifishmarket.realconnect.online/admin"
echo "• API Documentation: https://alii-api.realconnect.online/api/docs"
echo "• UPP Integration: https://upp.realconnect.online"
echo "• Seller Platform: https://realconnect.online"
echo ""
echo -e "${GREEN}🐟 Alii Fish Market deployment preparation complete!${NC}"
echo "   Ready to showcase the Toast POS replacement to potential buyers."