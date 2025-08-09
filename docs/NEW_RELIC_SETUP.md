# New Relic Monitoring Setup for Alii Fish Market

This guide covers setting up New Relic APM monitoring for the complete Alii Fish Market system.

## Overview

New Relic monitoring has been integrated into:
- **Spring Boot Backend** (Java agent)
- **Error Monitor Service** (Node.js agent) 
- **Render deployment** (automatic configuration)

## Quick Setup

### 1. Get Your New Relic License Key
1. Sign up at [newrelic.com](https://newrelic.com)
2. Go to **Account Settings** → **API Keys**
3. Copy your **License Key**

### 2. Set Environment Variables

#### Local Development
```bash
export NEW_RELIC_LICENSE_KEY=your_license_key_here
export NEW_RELIC_APP_NAME="Alii Fish Market Backend (Development)"
export NEW_RELIC_ENABLED=true
```

#### Docker Compose
Create a `.env` file in the root directory:
```env
NEW_RELIC_LICENSE_KEY=your_license_key_here
NEW_RELIC_ENABLED=true
NEW_RELIC_APP_NAME=Alii Fish Market Backend
NEW_RELIC_LOG_LEVEL=info
```

#### Render Deployment
Add to your Render environment variables:
- `NEW_RELIC_LICENSE_KEY`: Your license key (sync: false)
- `NEW_RELIC_ENABLED`: `true`
- `NEW_RELIC_APP_NAME`: `"Alii Fish Market Backend"`

## Running with New Relic

### Local Development

#### Option 1: Using the startup script
```bash
cd backend
./start-with-newrelic.sh
```

#### Option 2: Manual Maven command
```bash
cd backend
# Download agent if not present
wget -O newrelic.jar https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar

# Start with agent
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-javaagent:newrelic.jar"
```

#### Option 3: Direct Java command
```bash
cd backend
mvn clean package -DskipTests
java -javaagent:/full/path/to/newrelic.jar -jar target/alii-fish-market-backend-1.0.0.jar
```

### Docker Deployment
```bash
# Docker automatically downloads and configures New Relic agent
docker-compose up --build
```

### Render Deployment
New Relic is automatically configured via the `render.yaml` blueprint.

## Configuration Files

### Backend Java Agent
- **Config**: `backend/src/main/resources/newrelic.yml`
- **Application settings**: `backend/src/main/resources/application.yml`
- **Dockerfile**: Automatically downloads and configures agent

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEW_RELIC_LICENSE_KEY` | Your New Relic license key | - | ✅ Yes |
| `NEW_RELIC_ENABLED` | Enable/disable New Relic | `true` | No |
| `NEW_RELIC_APP_NAME` | Application name in New Relic | `"Alii Fish Market Backend"` | No |
| `NEW_RELIC_LOG_LEVEL` | Agent logging level | `info` | No |
| `NEW_RELIC_HIGH_SECURITY` | High security mode | `false` | No |
| `NEW_RELIC_AUDIT_MODE` | Debug mode (logs all data) | `false` | No |

## Monitoring Features

### Backend (Java Agent)
- ✅ **Application Performance**: Response times, throughput, error rates
- ✅ **Database Monitoring**: SQL query performance, connection pool metrics
- ✅ **Transaction Tracing**: Detailed breakdown of slow transactions
- ✅ **Error Analytics**: Exception tracking with stack traces
- ✅ **Custom Metrics**: Business metrics (orders, payments, revenue)
- ✅ **JVM Metrics**: Memory usage, garbage collection, thread pools

### Error Monitor (Node.js Agent)  
- ✅ **AI Service Monitoring**: OpenAI/Anthropic API call performance
- ✅ **Error Detection Speed**: Time to detect and analyze errors
- ✅ **GitHub Integration**: Pull request and fix deployment metrics
- ✅ **Business Impact**: Cost savings tracking ($6,132/year vs Toast)

## Business Metrics Tracked

### Performance Metrics
- **Order Processing Time**: Average time from order to confirmation
- **Payment Success Rate**: UPP vs traditional payment methods
- **Error Resolution Time**: AI auto-fix vs manual intervention
- **Customer Experience**: Page load times, checkout completion rates

### Business Intelligence
- **Cost Savings**: Real-time tracking vs Toast POS ($6,132/year savings)
- **Revenue Impact**: Orders processed, average order value
- **Operational Efficiency**: Staff productivity, system uptime
- **Growth Metrics**: Customer acquisition, repeat orders

## Troubleshooting

### Common Issues

#### 1. Agent Not Loading
```bash
# Check if New Relic agent is present
ls -la newrelic.jar

# Check Java command includes -javaagent
ps aux | grep java
```

#### 2. License Key Issues
```bash
# Verify license key is set
echo $NEW_RELIC_LICENSE_KEY

# Check New Relic logs
tail -f logs/newrelic_agent.log
```

#### 3. No Data in New Relic
- Verify license key is correct
- Check application name matches New Relic dashboard
- Ensure agent is enabled (`NEW_RELIC_ENABLED=true`)
- Wait 5-10 minutes for data to appear

### Log Files
- **Agent logs**: `logs/newrelic_agent.log`  
- **Application logs**: `logs/alii-fish-market.log`
- **Docker logs**: `docker-compose logs backend`

## Security Considerations

### Production Settings
- Enable high security mode: `NEW_RELIC_HIGH_SECURITY=true`
- Use secure environment variable management
- Disable audit mode in production: `NEW_RELIC_AUDIT_MODE=false`
- Configure SQL obfuscation: `record_sql: obfuscated`

### Data Privacy
- Sensitive parameters are automatically excluded
- Credit card data is filtered out
- Personal information is obfuscated
- Database queries are sanitized

## Integration with Existing Monitoring

### AI Error Monitoring System
New Relic complements the existing AI error monitoring:
- **New Relic**: Infrastructure and application performance
- **AI Monitor**: Business logic errors and auto-fixing
- **Combined**: Complete visibility into system health

### Cost Analysis Dashboard
Track the $6,132 annual savings vs Toast POS:
- Real-time transaction fee comparison
- Performance metrics (faster checkout)
- Reliability metrics (99.9% uptime)
- Business growth impact

## Support

For issues with New Relic setup:
1. Check the [New Relic documentation](https://docs.newrelic.com/docs/apm/agents/java-agent)
2. Review application logs
3. Contact New Relic support with agent logs
4. Use the troubleshooting commands above

## Next Steps

1. **Set up alerts** for critical metrics (error rate >1%, response time >2s)
2. **Create dashboards** for business metrics and KPIs
3. **Configure notifications** for system issues
4. **Set up synthetic monitoring** for critical user journeys
5. **Integrate with CI/CD** for deployment tracking