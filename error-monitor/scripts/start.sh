#!/bin/bash
echo "🤖 Starting AI Error Monitoring System..."
echo "🐟 Alii Fish Market - Toast POS Replacement Monitor"

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start the health check server first
node src/health-check.js &

echo "✅ Basic system started on port ${PORT:-3030}"
echo "🔍 Health check: http://localhost:${PORT:-3030}/health"
echo "📊 System info: http://localhost:${PORT:-3030}/"
echo ""
echo "Next steps:"
echo "1. Configure notifications (Slack/Email) in .env"
echo "2. Run full deployment: ./scripts/deploy.sh"
echo "3. Monitor logs for first error detection"
