#!/bin/bash

# Start Alii Fish Market Backend with New Relic Java Agent
# 
# Usage:
# 1. Download New Relic agent: wget -O newrelic.jar https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar
# 2. Set your New Relic license key: export NEW_RELIC_LICENSE_KEY=your_license_key_here
# 3. Run this script: ./start-with-newrelic.sh

echo "🐟 Starting Alii Fish Market Backend with New Relic monitoring..."

# Check if New Relic agent exists
if [ ! -f "newrelic.jar" ]; then
    echo "📥 Downloading New Relic Java agent..."
    wget -O newrelic.jar https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar
    echo "✅ New Relic agent downloaded"
fi

# Check if license key is set
if [ -z "$NEW_RELIC_LICENSE_KEY" ]; then
    echo "⚠️  WARNING: NEW_RELIC_LICENSE_KEY environment variable not set"
    echo "   Set it with: export NEW_RELIC_LICENSE_KEY=your_license_key_here"
    echo "   Or add it to your .env file"
    echo ""
    echo "🔄 Starting without New Relic monitoring..."
    mvn spring-boot:run
else
    echo "📊 New Relic License Key: ${NEW_RELIC_LICENSE_KEY:0:8}..."
    echo "🚀 Starting with New Relic Java agent..."
    
    # Set default New Relic environment variables if not already set
    export NEW_RELIC_APP_NAME=${NEW_RELIC_APP_NAME:-"Alii Fish Market Backend (Development)"}
    export NEW_RELIC_LOG_LEVEL=${NEW_RELIC_LOG_LEVEL:-"info"}
    export NEW_RELIC_ENABLED=${NEW_RELIC_ENABLED:-"true"}
    
    # Start Spring Boot with New Relic agent
    mvn spring-boot:run -Dspring-boot.run.jvmArguments="-javaagent:newrelic.jar"
fi