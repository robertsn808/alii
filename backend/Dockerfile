# Multi-stage build for Spring Boot
FROM openjdk:17-jdk-alpine AS builder

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM openjdk:17-jdk-alpine AS runtime

# Install curl for health checks and wget for New Relic agent
RUN apk update && apk add --no-cache curl wget

# Add user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Download New Relic Java agent
RUN wget -O newrelic.jar https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar

# Copy jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create logs directory
RUN mkdir -p logs && chown -R spring:spring . logs

# Switch to spring user
USER spring:spring

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run the application with New Relic agent (if NEW_RELIC_LICENSE_KEY is set)
ENTRYPOINT ["sh", "-c", "if [ -n \"$NEW_RELIC_LICENSE_KEY\" ]; then exec java -javaagent:newrelic.jar -jar app.jar; else exec java -jar app.jar; fi"]