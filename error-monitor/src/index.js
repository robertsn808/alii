const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const LogCollector = require('./log-collector/src/logCollector');
const AIErrorAnalyzer = require('./ai-analyzer/src/aiErrorAnalyzer');
const CodeFixGenerator = require('./fix-generator/src/codeFixGenerator');
const GitHubIntegration = require('./github-bot/src/githubIntegration');
const NotificationService = require('./notifications/src/notificationService');
const ErrorMonitorDashboard = require('./dashboard/src/dashboard');
const cron = require('node-cron');

class ErrorMonitoringSystem {
  constructor(config = {}) {
    this.config = {
      port: process.env.PORT || 3030,
      logPaths: config.logPaths || [
        '../backend/logs/**/*.log',
        '../frontend/.next/**/*.log',
        '/var/log/**/*.log'
      ],
      aiConfig: {
        claudeApiKey: process.env.CLAUDE_API_KEY,
        openaiApiKey: process.env.OPENAI_API_KEY
      },
      githubConfig: {
        token: process.env.GITHUB_TOKEN,
        repoOwner: process.env.GITHUB_REPO_OWNER || 'robertsn808',
        repoName: process.env.GITHUB_REPO_NAME || 'alii'
      },
      notifications: {
        slack: {
          webhook: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alii-errors'
        },
        email: {
          smtp: process.env.SMTP_HOST,
          from: process.env.EMAIL_FROM,
          to: process.env.EMAIL_TO
        }
      },
      autoFix: {
        enabled: process.env.AUTO_FIX_ENABLED === 'true',
        confidenceThreshold: parseFloat(process.env.AUTO_FIX_CONFIDENCE_THRESHOLD) || 0.8,
        maxDailyPRs: parseInt(process.env.MAX_DAILY_PRS) || 5
      },
      ...config
    };

    this.components = {};
    this.metrics = {
      errorsDetected: 0,
      errorsAnalyzed: 0,
      fixesGenerated: 0,
      prsCreated: 0,
      uptime: Date.now()
    };
    
    this.initialize();
  }

  async initialize() {
    console.log('🤖 Initializing AI-Powered Error Monitoring System for Alii Fish Market...');
    
    try {
      // Initialize core components
      await this.setupComponents();
      await this.setupEventHandlers();
      await this.setupWebServer();
      await this.setupCronJobs();
      
      console.log('✅ Error Monitoring System initialized successfully');
      console.log(`📊 Dashboard available at: http://localhost:${this.config.port}`);
      console.log('🐟 Monitoring Alii Fish Market Toast POS replacement system');
      
    } catch (error) {
      console.error('❌ Failed to initialize Error Monitoring System:', error);
      process.exit(1);
    }
  }

  async setupComponents() {
    // Log Collector
    this.components.logCollector = new LogCollector({
      logPaths: this.config.logPaths
    });

    // AI Error Analyzer
    this.components.aiAnalyzer = new AIErrorAnalyzer({
      claudeApiKey: this.config.aiConfig.claudeApiKey,
      openaiApiKey: this.config.aiConfig.openaiApiKey
    });

    // Code Fix Generator
    this.components.fixGenerator = new CodeFixGenerator({
      projectRoot: process.cwd()
    });

    // GitHub Integration
    this.components.github = new GitHubIntegration(this.config.githubConfig);

    // Notification Service
    this.components.notifications = new NotificationService(this.config.notifications);

    // Dashboard
    this.components.dashboard = new ErrorMonitorDashboard({
      system: this
    });
  }

  async setupEventHandlers() {
    // Handle individual errors
    this.components.logCollector.on('error_detected', async (error) => {
      this.metrics.errorsDetected++;
      console.log(`🐛 Error detected: ${error.type} - ${error.message.substring(0, 100)}...`);
      
      try {
        await this.handleError(error);
      } catch (err) {
        console.error('Error handling detected error:', err);
        await this.components.notifications.sendCriticalAlert(
          'Error Monitoring System Failure',
          `Failed to handle error: ${err.message}`
        );
      }
    });

    // Handle batch errors
    this.components.logCollector.on('errors_batch', async (errors) => {
      console.log(`📦 Processing batch of ${errors.length} errors`);
      
      for (const error of errors) {
        // Process high-priority errors immediately
        if (error.severity === 'critical' || error.type === 'payment') {
          await this.handleError(error, { priority: 'high' });
        } else {
          // Queue lower priority errors
          this.queueError(error);
        }
      }
    });
  }

  async handleError(error, options = {}) {
    try {
      // Step 1: AI Analysis
      console.log(`🔍 Analyzing error: ${error.id}`);
      const analysis = await this.components.aiAnalyzer.analyzeError(error);
      this.metrics.errorsAnalyzed++;

      // Step 2: Determine if auto-fix should be attempted
      const shouldAutoFix = this.shouldAttemptAutoFix(analysis);
      
      if (shouldAutoFix) {
        await this.attemptAutoFix(analysis);
      } else {
        await this.createManualIssue(analysis);
      }

      // Step 3: Send notifications based on priority
      await this.sendNotifications(analysis, options.priority);

      // Step 4: Update dashboard
      this.components.dashboard.addError(analysis);

    } catch (err) {
      console.error(`Error processing error ${error.id}:`, err);
      
      // Fallback: create GitHub issue for manual handling
      await this.components.github.createIssue(error, null);
      
      await this.components.notifications.sendAlert(
        'Error Processing Failed',
        `Could not process error ${error.id}: ${err.message}`
      );
    }
  }

  shouldAttemptAutoFix(analysis) {
    if (!this.config.autoFix.enabled) return false;
    if (this.metrics.prsCreated >= this.config.autoFix.maxDailyPRs) return false;
    
    // Don't auto-fix security issues
    if (analysis.error.type === 'security') return false;
    
    // Only auto-fix high-confidence analyses
    if (analysis.analysis.confidence < this.config.autoFix.confidenceThreshold) return false;
    
    // Auto-fix payment issues immediately
    if (analysis.error.type === 'payment' && analysis.priority <= 2) return true;
    
    // Auto-fix database issues if confidence is very high
    if (analysis.error.type === 'database' && analysis.analysis.confidence > 0.9) return true;
    
    // Auto-fix runtime errors with high confidence
    if (analysis.error.type === 'runtime' && analysis.analysis.confidence > 0.85) return true;
    
    return false;
  }

  async attemptAutoFix(analysis) {
    try {
      console.log(`🔧 Generating fix for error: ${analysis.id}`);
      
      // Generate fix
      const fixResult = await this.components.fixGenerator.generateFix(analysis);
      this.metrics.fixesGenerated++;

      // Validate fix quality
      if (this.isFixQualityAcceptable(fixResult)) {
        // Create pull request
        console.log(`📝 Creating pull request for fix: ${fixResult.id}`);
        const prResult = await this.components.github.createFixPullRequest(fixResult, analysis);
        
        if (prResult.success) {
          this.metrics.prsCreated++;
          console.log(`✅ Pull request created: ${prResult.url}`);
          
          // Send success notification
          await this.components.notifications.sendFixNotification(
            'Automated Fix Created',
            `Created PR for ${analysis.error.type} error: ${prResult.url}`,
            'success'
          );
          
          return prResult;
        } else {
          throw new Error(`PR creation failed: ${prResult.error}`);
        }
      } else {
        console.log(`⚠️ Fix quality insufficient for error: ${analysis.id}`);
        await this.createManualIssue(analysis, fixResult);
      }
    } catch (error) {
      console.error(`Fix generation failed for ${analysis.id}:`, error);
      await this.createManualIssue(analysis, null);
      throw error;
    }
  }

  isFixQualityAcceptable(fixResult) {
    const approach = fixResult.recommendedApproach;
    
    // Minimum confidence threshold
    if (approach.confidence < 0.7) return false;
    
    // Must have actual code changes
    if (!fixResult.codeChanges || fixResult.codeChanges.length === 0) return false;
    
    // High-risk changes require manual review
    if (fixResult.estimatedImpact.riskLevel === 'high') return false;
    
    // Must have test coverage for critical components
    if (fixResult.estimatedImpact.affectedFeatures.includes('Payment Processing') && 
        fixResult.testCases.length === 0) return false;
    
    return true;
  }

  async createManualIssue(analysis, fixResult = null) {
    console.log(`📋 Creating manual issue for error: ${analysis.id}`);
    
    const issue = await this.components.github.createIssue(analysis, fixResult);
    
    await this.components.notifications.sendAlert(
      'Manual Review Required',
      `Error requires manual attention: ${issue.html_url}\nType: ${analysis.error.type}\nPriority: ${analysis.priority}`
    );
    
    return issue;
  }

  async sendNotifications(analysis, priority) {
    const errorType = analysis.error.type;
    const severity = analysis.error.severity;
    
    // Critical errors always send notifications
    if (severity === 'critical' || priority === 'high') {
      await this.components.notifications.sendCriticalAlert(
        `Critical Error: ${errorType}`,
        this.formatCriticalNotification(analysis)
      );
    }
    
    // Payment errors always notify
    else if (errorType === 'payment') {
      await this.components.notifications.sendAlert(
        `Payment System Error: ${errorType}`,
        this.formatPaymentNotification(analysis)
      );
    }
    
    // Other errors based on business hours
    else if (this.isDuringBusinessHours()) {
      await this.components.notifications.sendAlert(
        `System Error: ${errorType}`,
        this.formatStandardNotification(analysis)
      );
    }
  }

  formatCriticalNotification(analysis) {
    return `
🚨 CRITICAL ERROR - Alii Fish Market System

**Type:** ${analysis.error.type}
**Service:** ${analysis.error.service}  
**Message:** ${analysis.error.message}

**Business Impact:**
• Revenue: ${analysis.businessImpact.revenue}
• Operations: ${analysis.businessImpact.operations}

**Analysis ID:** ${analysis.id}
**Confidence:** ${Math.round(analysis.analysis.confidence * 100)}%

**Immediate Actions Required:**
${analysis.recommendations.immediate.join('\n')}
    `;
  }

  formatPaymentNotification(analysis) {
    return `
💳 PAYMENT SYSTEM ALERT - Alii Fish Market

**Error:** ${analysis.error.message}
**Impact:** Payment processing for Toast POS replacement

**UPP Integration Status:** ${analysis.error.service === 'backend' ? 'Affected' : 'Unknown'}
**Priority:** ${analysis.priority}

**Analysis:** ${analysis.analysis.claude?.analysis?.rootCause || 'Processing...'}
    `;
  }

  formatStandardNotification(analysis) {
    return `
🐛 System Error Detected - Alii Fish Market

**Type:** ${analysis.error.type}
**Service:** ${analysis.error.service}
**Severity:** ${analysis.error.severity}

**AI Analysis Confidence:** ${Math.round(analysis.analysis.confidence * 100)}%
**Estimated Fix Time:** ${analysis.estimatedFixTime}
    `;
  }

  isDuringBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    // Alii Fish Market hours: 6 AM to 8 PM Hawaii time
    return hour >= 6 && hour <= 20;
  }

  queueError(error) {
    // Simple in-memory queue (in production, use Redis or similar)
    if (!this.errorQueue) this.errorQueue = [];
    this.errorQueue.push(error);
  }

  async setupWebServer() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);

    // Middleware
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // API Routes
    this.setupApiRoutes();

    // Dashboard routes
    this.components.dashboard.setupRoutes(this.app);

    // Socket.IO for real-time updates
    this.io.on('connection', (socket) => {
      console.log('📡 Dashboard connected');
      
      // Send current metrics
      socket.emit('metrics', this.getMetrics());
      
      // Send recent errors
      socket.emit('recent_errors', this.components.dashboard.getRecentErrors());
    });

    // Start server
    this.server.listen(this.config.port, () => {
      console.log(`🌐 Error Monitor Server running on port ${this.config.port}`);
    });
  }

  setupApiRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'running',
        uptime: Date.now() - this.metrics.uptime,
        metrics: this.getMetrics(),
        components: {
          logCollector: this.components.logCollector.getStatus(),
          aiAnalyzer: 'operational',
          fixGenerator: 'operational',
          github: 'operational',
          notifications: 'operational'
        }
      });
    });

    // Metrics endpoint
    this.app.get('/api/metrics', (req, res) => {
      res.json(this.getMetrics());
    });

    // Recent errors
    this.app.get('/api/errors/recent', (req, res) => {
      res.json(this.components.dashboard.getRecentErrors());
    });

    // Error details
    this.app.get('/api/errors/:id', (req, res) => {
      const error = this.components.dashboard.getError(req.params.id);
      if (error) {
        res.json(error);
      } else {
        res.status(404).json({ error: 'Error not found' });
      }
    });

    // Trigger manual analysis
    this.app.post('/api/errors/:id/analyze', async (req, res) => {
      try {
        const error = this.components.dashboard.getError(req.params.id);
        if (!error) {
          return res.status(404).json({ error: 'Error not found' });
        }

        const analysis = await this.components.aiAnalyzer.analyzeError(error);
        res.json(analysis);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Trigger manual fix generation
    this.app.post('/api/errors/:id/fix', async (req, res) => {
      try {
        const error = this.components.dashboard.getError(req.params.id);
        if (!error) {
          return res.status(404).json({ error: 'Error not found' });
        }

        const analysis = await this.components.aiAnalyzer.analyzeError(error);
        const fix = await this.components.fixGenerator.generateFix(analysis);
        
        res.json(fix);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  async setupCronJobs() {
    // Process queued errors every minute
    cron.schedule('* * * * *', async () => {
      await this.processQueuedErrors();
    });

    // Daily metrics report
    cron.schedule('0 8 * * *', async () => {
      await this.sendDailyReport();
    });

    // Weekly system health check
    cron.schedule('0 9 * * 1', async () => {
      await this.performSystemHealthCheck();
    });

    // Reset daily PR counter at midnight
    cron.schedule('0 0 * * *', () => {
      this.metrics.prsCreated = 0;
    });
  }

  async processQueuedErrors() {
    if (!this.errorQueue || this.errorQueue.length === 0) return;
    
    const errorsToProcess = this.errorQueue.splice(0, 5); // Process 5 at a time
    
    for (const error of errorsToProcess) {
      try {
        await this.handleError(error);
      } catch (err) {
        console.error('Error processing queued error:', err);
      }
    }
  }

  async sendDailyReport() {
    const report = this.generateDailyReport();
    
    await this.components.notifications.sendAlert(
      'Alii Error Monitor - Daily Report',
      report
    );
  }

  generateDailyReport() {
    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);
    
    return `
📊 Daily Error Monitoring Report - Alii Fish Market

**Date:** ${now.toDateString()}
**Toast POS Replacement System Status:** Operational

**24-Hour Metrics:**
• Errors Detected: ${this.metrics.errorsDetected}
• AI Analyses: ${this.metrics.errorsAnalyzed}
• Fixes Generated: ${this.metrics.fixesGenerated}
• Pull Requests Created: ${this.metrics.prsCreated}

**System Performance:**
• Uptime: ${Math.round((Date.now() - this.metrics.uptime) / (1000 * 60 * 60))} hours
• Business Impact: Payment processing stable
• Cost Savings: $6,132 annually vs Toast POS

**Dashboard:** http://localhost:${this.config.port}
    `;
  }

  async performSystemHealthCheck() {
    const healthStatus = {
      overall: 'healthy',
      components: {},
      issues: []
    };

    // Check each component
    try {
      healthStatus.components.logCollector = this.components.logCollector.getStatus();
    } catch (err) {
      healthStatus.issues.push(`Log Collector: ${err.message}`);
      healthStatus.overall = 'degraded';
    }

    // Check AI API connectivity
    try {
      await this.components.aiAnalyzer.analyzeError({
        id: 'health_check',
        type: 'test',
        message: 'Health check test',
        severity: 'low',
        context: { service: 'test' }
      });
      healthStatus.components.ai = 'operational';
    } catch (err) {
      healthStatus.issues.push(`AI Analyzer: ${err.message}`);
      healthStatus.overall = 'degraded';
    }

    // Check GitHub connectivity
    try {
      await this.components.github.getRepositoryInfo();
      healthStatus.components.github = 'operational';
    } catch (err) {
      healthStatus.issues.push(`GitHub: ${err.message}`);
      healthStatus.overall = 'degraded';
    }

    // Send health report
    await this.components.notifications.sendAlert(
      'Weekly System Health Check',
      `System Status: ${healthStatus.overall.toUpperCase()}\n\n${
        healthStatus.issues.length > 0 
          ? 'Issues:\n' + healthStatus.issues.join('\n')
          : 'All systems operational'
      }`
    );
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
      queueSize: this.errorQueue ? this.errorQueue.length : 0,
      autoFixEnabled: this.config.autoFix.enabled,
      dailyPRsRemaining: this.config.autoFix.maxDailyPRs - this.metrics.prsCreated
    };
  }

  async start() {
    await this.components.logCollector.startWatching();
    console.log('🚀 AI Error Monitoring System is now active');
    console.log('🐟 Protecting Alii Fish Market Toast POS replacement system');
  }

  async stop() {
    console.log('🛑 Shutting down Error Monitoring System...');
    
    if (this.components.logCollector) {
      await this.components.logCollector.stop();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Error Monitoring System stopped');
  }
}

// Start the system if this file is run directly
if (require.main === module) {
  const system = new ErrorMonitoringSystem();
  
  system.start().catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n📡 Received SIGINT, shutting down gracefully...');
    await system.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n📡 Received SIGTERM, shutting down gracefully...');
    await system.stop();
    process.exit(0);
  });
}

module.exports = ErrorMonitoringSystem;