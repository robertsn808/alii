# AI Error Monitoring System Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    python3 \
    py3-pip \
    make \
    g++

# Copy package files
COPY log-collector/package*.json ./log-collector/
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && \
    cd log-collector && npm ci --only=production && \
    cd .. && npm cache clean --force

# Install Python dependencies for AI analysis
RUN pip3 install --no-cache-dir \
    anthropic \
    openai \
    requests \
    pyyaml \
    python-dotenv

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p logs data temp && \
    chmod +x scripts/*.sh

# Add health check script
COPY scripts/healthcheck.sh /usr/local/bin/healthcheck
RUN chmod +x /usr/local/bin/healthcheck

# Create non-root user
RUN addgroup -g 1001 -S errormonitor && \
    adduser -S errormonitor -u 1001 -G errormonitor && \
    chown -R errormonitor:errormonitor /app

USER errormonitor

# Environment variables
ENV NODE_ENV=production
ENV PORT=3030

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD healthcheck

# Expose port
EXPOSE 3030

# Start command
CMD ["npm", "start"]