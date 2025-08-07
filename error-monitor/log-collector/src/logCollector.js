const winston = require('winston');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class LogCollector extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.watchers = new Map();
    this.errorPatterns = this.loadErrorPatterns();
    this.logger = this.setupLogger();
    this.errorBuffer = [];
    this.setupBufferFlush();
  }

  setupLogger() {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: path.join(__dirname, '../logs/error-monitor.log') 
        }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  loadErrorPatterns() {
    return {
      // Java/Spring Boot patterns
      java: [
        /Exception in thread ".*?" (.*?Exception.*?)$/,
        /\s+at\s+(.*?)\((.*?):(.*?)\)$/,
        /Caused by:\s+(.*?Exception.*?)$/,
        /org\.springframework\.(.*?Exception.*?)$/,
        /org\.hibernate\.(.*?Exception.*?)$/,
        /java\.sql\.(.*?Exception.*?)$/
      ],
      
      // JavaScript/Node.js patterns
      javascript: [
        /^(.*?Error.*?):\s+(.*)$/,
        /^\s+at\s+(.*?)\s+\((.*?):(.*?):(.*?)\)$/,
        /^\s+at\s+(.*?)\s+(.*?):(.*?):(.*?)$/,
        /UnhandledPromiseRejectionWarning:\s+(.*?)$/,
        /TypeError:\s+(.*?)$/,
        /ReferenceError:\s+(.*?)$/
      ],
      
      // HTTP/API errors
      http: [
        /HTTP\s+(\d+)\s+(.*)$/,
        /Request\s+failed\s+with\s+status\s+code\s+(\d+)$/,
        /Connection\s+refused\s+(.*)$/,
        /Timeout\s+of\s+(\d+)ms\s+exceeded$/
      ],
      
      // Database errors
      database: [
        /Connection\s+to\s+database\s+failed/,
        /Table\s+'(.*)'\s+doesn't\s+exist/,
        /Duplicate\s+entry\s+'(.*)'\s+for\s+key/,
        /Data\s+too\s+long\s+for\s+column/,
        /Foreign\s+key\s+constraint\s+fails/
      ],
      
      // Payment/UPP specific errors
      payment: [
        /Payment\s+processing\s+failed/,
        /UPP\s+API\s+error:\s+(.*?)$/,
        /Stripe\s+error:\s+(.*?)$/,
        /Invalid\s+payment\s+method/,
        /Transaction\s+declined/
      ]
    };
  }

  async startWatching() {
    const logPaths = this.config.logPaths || [
      '../backend/logs/**/*.log',
      '../frontend/.next/**/*.log',
      '/var/log/nginx/**/*.log',
      '../logs/**/*.log'
    ];

    for (const logPath of logPaths) {
      const watcher = chokidar.watch(logPath, {
        ignored: /node_modules/,
        persistent: true,
        ignoreInitial: false
      });

      watcher.on('change', (filePath) => {
        this.processLogFile(filePath);
      });

      watcher.on('add', (filePath) => {
        this.processLogFile(filePath);
      });

      this.watchers.set(logPath, watcher);
      this.logger.info(`Started watching: ${logPath}`);
    }
  }

  async processLogFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Process only new lines (implement tail-like functionality)
      const newLines = this.getNewLines(filePath, lines);
      
      for (const line of newLines) {
        const error = this.parseError(line, filePath);
        if (error) {
          this.errorBuffer.push({
            ...error,
            timestamp: new Date().toISOString(),
            filePath,
            id: this.generateErrorId()
          });
          
          this.emit('error_detected', error);
        }
      }
    } catch (err) {
      this.logger.error(`Error processing log file ${filePath}:`, err);
    }
  }

  parseError(logLine, filePath) {
    if (!logLine.trim()) return null;

    const fileType = this.detectFileType(filePath);
    const patterns = this.errorPatterns[fileType] || this.errorPatterns.javascript;
    
    for (const pattern of patterns) {
      const match = logLine.match(pattern);
      if (match) {
        return {
          type: this.categorizeError(logLine),
          severity: this.determineSeverity(logLine),
          message: match[1] || logLine,
          stackTrace: this.extractStackTrace(logLine),
          context: this.extractContext(logLine, filePath),
          rawLine: logLine,
          pattern: pattern.toString(),
          fileType
        };
      }
    }

    // Check for general error keywords
    const errorKeywords = ['error', 'exception', 'failed', 'timeout', 'refused', 'denied'];
    if (errorKeywords.some(keyword => logLine.toLowerCase().includes(keyword))) {
      return {
        type: 'general',
        severity: this.determineSeverity(logLine),
        message: logLine.trim(),
        stackTrace: null,
        context: this.extractContext(logLine, filePath),
        rawLine: logLine,
        pattern: 'keyword_match',
        fileType
      };
    }

    return null;
  }

  categorizeError(logLine) {
    const line = logLine.toLowerCase();
    
    if (line.includes('payment') || line.includes('upp') || line.includes('stripe')) {
      return 'payment';
    }
    if (line.includes('database') || line.includes('sql') || line.includes('connection')) {
      return 'database';
    }
    if (line.includes('http') || line.includes('api') || line.includes('request')) {
      return 'api';
    }
    if (line.includes('authentication') || line.includes('authorization') || line.includes('security')) {
      return 'security';
    }
    if (line.includes('performance') || line.includes('memory') || line.includes('timeout')) {
      return 'performance';
    }
    
    return 'runtime';
  }

  determineSeverity(logLine) {
    const line = logLine.toLowerCase();
    
    if (line.includes('critical') || line.includes('fatal')) return 'critical';
    if (line.includes('error') || line.includes('exception')) return 'high';
    if (line.includes('warning') || line.includes('warn')) return 'medium';
    if (line.includes('info') || line.includes('debug')) return 'low';
    
    return 'medium';
  }

  extractStackTrace(logLine) {
    // Implementation to extract stack trace from multi-line logs
    // This is a simplified version - you'd need more sophisticated logic
    if (logLine.includes('at ') || logLine.includes('Caused by:')) {
      return logLine.trim();
    }
    return null;
  }

  extractContext(logLine, filePath) {
    return {
      service: this.getServiceFromPath(filePath),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      userId: this.extractUserId(logLine),
      requestId: this.extractRequestId(logLine),
      timestamp: new Date().toISOString()
    };
  }

  getServiceFromPath(filePath) {
    if (filePath.includes('backend')) return 'backend';
    if (filePath.includes('frontend')) return 'frontend';
    if (filePath.includes('nginx')) return 'nginx';
    return 'unknown';
  }

  extractUserId(logLine) {
    const userIdMatch = logLine.match(/userId[:\s]+([a-zA-Z0-9-_]+)/i);
    return userIdMatch ? userIdMatch[1] : null;
  }

  extractRequestId(logLine) {
    const requestIdMatch = logLine.match(/requestId[:\s]+([a-zA-Z0-9-_]+)/i);
    return requestIdMatch ? requestIdMatch[1] : null;
  }

  detectFileType(filePath) {
    if (filePath.includes('.java') || filePath.includes('backend')) return 'java';
    if (filePath.includes('.js') || filePath.includes('.ts') || filePath.includes('frontend')) return 'javascript';
    if (filePath.includes('nginx') || filePath.includes('access.log')) return 'http';
    return 'general';
  }

  getNewLines(filePath, lines) {
    // Simple implementation - in production, you'd want to track file positions
    // For now, return all lines (could be optimized with file cursors)
    return lines.slice(-100); // Get last 100 lines
  }

  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setupBufferFlush() {
    setInterval(() => {
      if (this.errorBuffer.length > 0) {
        this.emit('errors_batch', [...this.errorBuffer]);
        this.errorBuffer = [];
      }
    }, 5000); // Flush every 5 seconds
  }

  async stop() {
    for (const [path, watcher] of this.watchers) {
      await watcher.close();
      this.logger.info(`Stopped watching: ${path}`);
    }
    this.watchers.clear();
  }

  // Health check endpoint
  getStatus() {
    return {
      status: 'running',
      watchedPaths: Array.from(this.watchers.keys()),
      errorBufferSize: this.errorBuffer.length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = LogCollector;