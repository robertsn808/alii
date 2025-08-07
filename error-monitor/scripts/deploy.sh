#!/bin/bash

# AI Error Monitoring System Deployment Script
# Deploys the error monitoring system alongside Alii Fish Market

set -e

echo "🤖 Deploying AI Error Monitoring System for Alii Fish Market..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found. Copy .env.example and configure it."
        exit 1
    fi
    
    # Validate required environment variables
    source "$ENV_FILE"
    
    required_vars=(
        "CLAUDE_API_KEY"
        "OPENAI_API_KEY"
        "GITHUB_TOKEN"
        "GITHUB_REPO_OWNER"
        "GITHUB_REPO_NAME"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    if [ -f "$COMPOSE_FILE" ] && docker-compose ps &> /dev/null; then
        log_info "Creating backup of current deployment..."
        
        mkdir -p "$BACKUP_DIR"
        
        # Backup configuration
        cp "$ENV_FILE" "$BACKUP_DIR/"
        cp "$COMPOSE_FILE" "$BACKUP_DIR/"
        
        # Backup data volumes
        docker-compose exec -T mongodb mongodump --out /tmp/backup
        docker cp $(docker-compose ps -q mongodb):/tmp/backup "$BACKUP_DIR/mongodb"
        
        docker-compose exec -T redis redis-cli BGSAVE
        docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_DIR/"
        
        log_success "Backup created at $BACKUP_DIR"
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying error monitoring system..."
    
    # Pull latest images
    docker-compose pull
    
    # Build custom images
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    log_success "Deployment started"
}

# Wait for services
wait_for_services() {
    log_info "Waiting for services to become healthy..."
    
    local max_attempts=60
    local attempt=0
    
    services=("error-monitor" "redis" "mongodb" "elasticsearch")
    
    for service in "${services[@]}"; do
        log_info "Checking $service..."
        
        while [ $attempt -lt $max_attempts ]; do
            if docker-compose ps "$service" | grep -q "Up"; then
                log_success "$service is running"
                break
            fi
            
            attempt=$((attempt + 1))
            sleep 5
            
            if [ $attempt -eq $max_attempts ]; then
                log_error "$service failed to start within expected time"
                docker-compose logs "$service"
                exit 1
            fi
        done
        
        attempt=0
    done
}

# Run health checks
health_check() {
    log_info "Running health checks..."
    
    # Check main application
    if curl -f http://localhost:3030/health &> /dev/null; then
        log_success "Error monitoring system is healthy"
    else
        log_error "Error monitoring system health check failed"
        return 1
    fi
    
    # Check Grafana
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "Grafana dashboard is accessible"
    else
        log_warning "Grafana dashboard may not be ready yet"
    fi
    
    # Check Kibana
    if curl -f http://localhost:5601 &> /dev/null; then
        log_success "Kibana is accessible"
    else
        log_warning "Kibana may not be ready yet"
    fi
}

# Configure monitoring
setup_monitoring() {
    log_info "Setting up monitoring configuration..."
    
    # Wait for Elasticsearch to be ready
    while ! curl -f http://localhost:9200/_cluster/health &> /dev/null; do
        log_info "Waiting for Elasticsearch..."
        sleep 10
    done
    
    # Create index templates
    curl -X PUT "localhost:9200/_index_template/alii-errors" \
        -H 'Content-Type: application/json' \
        -d @monitoring/elasticsearch/error-template.json
    
    # Import Grafana dashboards
    log_info "Configuring Grafana dashboards..."
    
    # Wait for Grafana
    while ! curl -f http://admin:alii_monitor_2024@localhost:3000/api/health &> /dev/null; do
        log_info "Waiting for Grafana..."
        sleep 10
    done
    
    # Import dashboards via API
    for dashboard in monitoring/grafana/dashboards/*.json; do
        if [ -f "$dashboard" ]; then
            curl -X POST \
                -H "Content-Type: application/json" \
                -u admin:alii_monitor_2024 \
                http://localhost:3000/api/dashboards/db \
                -d @"$dashboard"
        fi
    done
    
    log_success "Monitoring setup completed"
}

# Test the system
test_system() {
    log_info "Running system tests..."
    
    # Test error detection
    docker-compose exec error-monitor npm run test:integration
    
    # Test notifications
    curl -X POST http://localhost:3030/api/test/notifications
    
    # Test AI analysis
    curl -X POST http://localhost:3030/api/test/ai-analysis
    
    log_success "System tests completed"
}

# Display deployment summary
show_summary() {
    log_info "Deployment Summary:"
    echo ""
    echo "🎯 Services Deployed:"
    echo "  • AI Error Monitor:    http://localhost:3030"
    echo "  • Grafana Dashboard:   http://localhost:3000 (admin/alii_monitor_2024)"
    echo "  • Kibana Logs:         http://localhost:5601"
    echo "  • Prometheus Metrics:  http://localhost:9090"
    echo ""
    echo "🔧 Configuration:"
    echo "  • Auto-fix enabled: ${AUTO_FIX_ENABLED:-false}"
    echo "  • Max daily PRs: ${MAX_DAILY_PRS:-5}"
    echo "  • Confidence threshold: ${AUTO_FIX_CONFIDENCE_THRESHOLD:-0.8}"
    echo ""
    echo "📊 Alii Fish Market Integration:"
    echo "  • Monitoring: aliifishmarket.realconnect.online"
    echo "  • API monitoring: alii-api.realconnect.online"
    echo "  • UPP integration: upp.realconnect.online"
    echo "  • Annual savings tracking: \$6,132 vs Toast POS"
    echo ""
    echo "💡 Next Steps:"
    echo "  1. Configure notification channels (Slack, Email)"
    echo "  2. Set up log shipping from production servers"
    echo "  3. Test error detection with sample errors"
    echo "  4. Review and approve auto-generated pull requests"
    echo ""
    log_success "AI Error Monitoring System is now active!"
    echo "🐟 Protecting Alii Fish Market Toast POS replacement system"
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed. Cleaning up..."
        docker-compose down
        
        if [ -d "$BACKUP_DIR" ]; then
            log_info "Backup available at: $BACKUP_DIR"
        fi
    fi
}

# Main deployment flow
main() {
    # Set trap for cleanup
    trap cleanup EXIT
    
    echo "🤖 AI Error Monitoring System Deployment"
    echo "=========================================="
    
    check_prerequisites
    create_backup
    deploy
    wait_for_services
    health_check
    setup_monitoring
    test_system
    show_summary
    
    log_success "Deployment completed successfully!"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        create_backup
        ;;
    "test")
        test_system
        ;;
    "health")
        health_check
        ;;
    "logs")
        docker-compose logs -f --tail=100
        ;;
    "stop")
        log_info "Stopping error monitoring system..."
        docker-compose down
        log_success "System stopped"
        ;;
    "restart")
        log_info "Restarting error monitoring system..."
        docker-compose restart
        log_success "System restarted"
        ;;
    "update")
        log_info "Updating error monitoring system..."
        docker-compose pull
        docker-compose up -d
        log_success "System updated"
        ;;
    *)
        echo "Usage: $0 {deploy|backup|test|health|logs|stop|restart|update}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  backup   - Create backup of current state"
        echo "  test     - Run system tests"
        echo "  health   - Check system health"
        echo "  logs     - View system logs"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  update   - Update and restart services"
        exit 1
        ;;
esac