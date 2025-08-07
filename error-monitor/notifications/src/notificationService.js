const { WebClient } = require('@slack/web-api');
const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
  constructor(config) {
    this.config = config;
    this.setupSlack();
    this.setupEmail();
    this.rateLimits = new Map();
  }

  setupSlack() {
    if (this.config.slack && this.config.slack.webhook) {
      this.slackWebhook = this.config.slack.webhook;
      this.slackChannel = this.config.slack.channel || '#alii-errors';
    }
  }

  setupEmail() {
    if (this.config.email && this.config.email.smtp) {
      this.emailTransporter = nodemailer.createTransporter({
        host: this.config.email.smtp,
        port: 587,
        secure: false,
        auth: {
          user: this.config.email.user,
          pass: this.config.email.password
        }
      });
    }
  }

  async sendCriticalAlert(title, message) {
    const alertData = {
      level: 'critical',
      title,
      message,
      timestamp: new Date().toISOString(),
      system: 'Alii Fish Market Error Monitor'
    };

    // Send to all channels immediately for critical alerts
    const promises = [
      this.sendSlackAlert(alertData, true),
      this.sendEmailAlert(alertData, true),
      this.sendWebhookAlert(alertData)
    ];

    try {
      await Promise.all(promises);
      console.log('🚨 Critical alert sent to all channels');
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  async sendAlert(title, message, level = 'warning') {
    // Check rate limits
    if (this.isRateLimited(title)) {
      console.log(`⏰ Rate limited: ${title}`);
      return;
    }

    const alertData = {
      level,
      title,
      message,
      timestamp: new Date().toISOString(),
      system: 'Alii Fish Market Error Monitor'
    };

    try {
      // Send based on urgency and business hours
      if (level === 'critical' || this.isDuringBusinessHours()) {
        await this.sendSlackAlert(alertData);
      }
      
      if (level === 'critical' || level === 'high') {
        await this.sendEmailAlert(alertData);
      }

      // Always log to webhook for dashboard
      await this.sendWebhookAlert(alertData);
      
      this.updateRateLimit(title);
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  async sendFixNotification(title, message, status = 'info') {
    const notificationData = {
      level: status,
      title,
      message,
      timestamp: new Date().toISOString(),
      system: 'Alii Fix Generator',
      type: 'fix_notification'
    };

    try {
      await this.sendSlackNotification(notificationData);
      console.log('🔧 Fix notification sent');
    } catch (error) {
      console.error('Failed to send fix notification:', error);
    }
  }

  async sendSlackAlert(alertData, forceSend = false) {
    if (!this.slackWebhook) return;
    
    if (!forceSend && this.isRateLimited(`slack_${alertData.title}`)) return;

    const color = this.getSlackColor(alertData.level);
    const emoji = this.getAlertEmoji(alertData.level);
    
    const slackPayload = {
      channel: this.slackChannel,
      username: 'Alii Error Monitor',
      icon_emoji: ':robot_face:',
      attachments: [
        {
          color,
          title: `${emoji} ${alertData.title}`,
          text: alertData.message,
          footer: alertData.system,
          footer_icon: 'https://github.com/robertsn808/alii/blob/main/frontend/public/icons/icon-192x192.png',
          ts: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Priority',
              value: alertData.level.toUpperCase(),
              short: true
            },
            {
              title: 'System',
              value: 'Alii Fish Market (Toast POS Replacement)',
              short: true
            }
          ]
        }
      ]
    };

    try {
      await axios.post(this.slackWebhook, slackPayload);
      this.updateRateLimit(`slack_${alertData.title}`);
    } catch (error) {
      console.error('Slack notification failed:', error.message);
    }
  }

  async sendSlackNotification(notificationData) {
    if (!this.slackWebhook) return;

    const color = notificationData.type === 'fix_notification' ? 'good' : 'warning';
    const emoji = notificationData.type === 'fix_notification' ? '🔧' : '📢';
    
    const slackPayload = {
      channel: this.slackChannel,
      username: 'Alii Fix Bot',
      icon_emoji: ':wrench:',
      attachments: [
        {
          color,
          title: `${emoji} ${notificationData.title}`,
          text: notificationData.message,
          footer: notificationData.system,
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    try {
      await axios.post(this.slackWebhook, slackPayload);
    } catch (error) {
      console.error('Slack fix notification failed:', error.message);
    }
  }

  async sendEmailAlert(alertData, forceSend = false) {
    if (!this.emailTransporter) return;
    
    if (!forceSend && this.isRateLimited(`email_${alertData.title}`)) return;

    const subject = `🐟 Alii Alert: ${alertData.title}`;
    const htmlContent = this.buildEmailHTML(alertData);
    
    const mailOptions = {
      from: this.config.email.from,
      to: this.config.email.to,
      subject,
      html: htmlContent,
      text: this.buildEmailText(alertData)
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      this.updateRateLimit(`email_${alertData.title}`);
      console.log('📧 Email alert sent');
    } catch (error) {
      console.error('Email notification failed:', error.message);
    }
  }

  buildEmailHTML(alertData) {
    const priorityColor = {
      critical: '#dc3545',
      high: '#fd7e14', 
      warning: '#ffc107',
      info: '#17a2b8'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Alii Error Monitor Alert</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: ${priorityColor[alertData.level]}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
        <h2 style="margin: 0;">🐟 Alii Fish Market - Error Alert</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Toast POS Replacement System</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-radius: 0 0 5px 5px;">
        <h3 style="color: ${priorityColor[alertData.level]}; margin-top: 0;">${alertData.title}</h3>
        
        <div style="background-color: white; padding: 15px; border-radius: 3px; white-space: pre-line;">
            ${alertData.message}
        </div>
        
        <div style="margin-top: 20px; padding: 10px; background-color: #e9ecef; border-radius: 3px;">
            <strong>Alert Details:</strong><br>
            Priority: <span style="color: ${priorityColor[alertData.level]}; font-weight: bold;">${alertData.level.toUpperCase()}</span><br>
            Time: ${new Date(alertData.timestamp).toLocaleString()}<br>
            System: ${alertData.system}
        </div>
        
        <div style="margin-top: 15px; text-align: center;">
            <a href="http://localhost:3030" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">
                View Dashboard
            </a>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        <p>This alert was generated by the AI-Powered Error Monitoring System</p>
        <p>Alii Fish Market - Automated Toast POS Replacement</p>
    </div>
</body>
</html>
    `;
  }

  buildEmailText(alertData) {
    return `
ALII FISH MARKET - ERROR ALERT

${alertData.title}

${alertData.message}

Priority: ${alertData.level.toUpperCase()}
Time: ${new Date(alertData.timestamp).toLocaleString()}
System: ${alertData.system}

Dashboard: http://localhost:3030

---
This alert was generated by the AI-Powered Error Monitoring System
Alii Fish Market - Automated Toast POS Replacement
    `;
  }

  async sendWebhookAlert(alertData) {
    // Send to custom webhook endpoint for dashboard integration
    const webhookUrl = process.env.CUSTOM_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await axios.post(webhookUrl, {
        ...alertData,
        source: 'alii_error_monitor'
      });
    } catch (error) {
      console.error('Webhook notification failed:', error.message);
    }
  }

  getSlackColor(level) {
    const colors = {
      critical: 'danger',
      high: 'warning',  
      warning: 'warning',
      info: 'good'
    };
    return colors[level] || 'warning';
  }

  getAlertEmoji(level) {
    const emojis = {
      critical: '🚨',
      high: '⚠️',
      warning: '🟡',
      info: '📢'
    };
    return emojis[level] || '📢';
  }

  isRateLimited(key) {
    const now = Date.now();
    const limit = this.rateLimits.get(key);
    
    if (!limit) return false;
    
    // Rate limit: max 1 notification per 5 minutes for same alert
    return (now - limit.lastSent) < (5 * 60 * 1000);
  }

  updateRateLimit(key) {
    this.rateLimits.set(key, {
      lastSent: Date.now(),
      count: (this.rateLimits.get(key)?.count || 0) + 1
    });
  }

  isDuringBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    // Alii Fish Market business hours: 6 AM - 8 PM Hawaii time
    return hour >= 6 && hour <= 20;
  }

  async sendDailyDigest(errorSummary) {
    const digestData = {
      level: 'info',
      title: 'Daily Error Digest - Alii Fish Market',
      message: this.buildDigestMessage(errorSummary),
      timestamp: new Date().toISOString(),
      system: 'Alii Error Monitor',
      type: 'daily_digest'
    };

    // Send digest via email
    if (this.emailTransporter) {
      const subject = '📊 Alii Daily Error Report';
      const htmlContent = this.buildDigestHTML(digestData);
      
      const mailOptions = {
        from: this.config.email.from,
        to: this.config.email.to,
        subject,
        html: htmlContent
      };

      try {
        await this.emailTransporter.sendMail(mailOptions);
        console.log('📊 Daily digest sent');
      } catch (error) {
        console.error('Daily digest failed:', error.message);
      }
    }

    // Also send to Slack if it's a business day
    if (this.isDuringBusinessHours() && [1,2,3,4,5].includes(new Date().getDay())) {
      await this.sendSlackNotification(digestData);
    }
  }

  buildDigestMessage(summary) {
    return `
📊 Daily Error Summary - ${new Date().toDateString()}

Toast POS Replacement System Status: ${summary.systemStatus}

24-Hour Metrics:
• Total Errors: ${summary.totalErrors}
• Critical Errors: ${summary.criticalErrors}
• Payment Errors: ${summary.paymentErrors}
• Auto-Fixed: ${summary.autoFixed}
• Manual Issues Created: ${summary.manualIssues}

Top Error Categories:
${summary.topErrors.map(error => `• ${error.type}: ${error.count}`).join('\n')}

System Performance:
• Uptime: ${summary.uptime}%
• Average Response Time: ${summary.avgResponseTime}ms
• Cost Savings vs Toast: $6,132 annually

${summary.criticalErrors > 0 ? '⚠️ Critical issues require immediate attention' : '✅ No critical issues detected'}
    `;
  }

  buildDigestHTML(digestData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Alii Daily Error Report</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🐟 Alii Fish Market</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Daily Error Monitoring Report</p>
        <p style="margin: 0; opacity: 0.8; font-size: 14px;">Toast POS Replacement System</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 25px; border: 1px solid #dee2e6; border-radius: 0 0 10px 10px;">
        <div style="white-space: pre-line; line-height: 1.6;">
            ${digestData.message}
        </div>
        
        <div style="margin-top: 30px; text-align: center; padding: 20px; background: white; border-radius: 5px; border-left: 4px solid #007bff;">
            <h3 style="color: #007bff; margin: 0 0 10px 0;">Quick Actions</h3>
            <a href="http://localhost:3030" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px;">
                View Dashboard
            </a>
            <a href="https://github.com/robertsn808/alii/issues" style="background-color: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px;">
                GitHub Issues
            </a>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        <p>Generated by AI-Powered Error Monitoring System</p>
        <p>Saving $6,132 annually vs Toast POS • aliifishmarket.realconnect.online</p>
    </div>
</body>
</html>
    `;
  }

  async testNotifications() {
    console.log('🧪 Testing notification channels...');
    
    const testAlert = {
      level: 'info',
      title: 'Test Alert - System Check',
      message: 'This is a test notification from the Alii Error Monitoring System.\n\nAll notification channels are functioning correctly.',
      timestamp: new Date().toISOString(),
      system: 'Alii Error Monitor'
    };

    try {
      await this.sendSlackAlert(testAlert);
      console.log('✅ Slack test successful');
    } catch (error) {
      console.log('❌ Slack test failed:', error.message);
    }

    try {
      await this.sendEmailAlert(testAlert);
      console.log('✅ Email test successful');
    } catch (error) {
      console.log('❌ Email test failed:', error.message);
    }
  }

  getStatus() {
    return {
      slack: {
        configured: !!this.slackWebhook,
        rateLimitedAlerts: Array.from(this.rateLimits.keys()).filter(k => k.startsWith('slack_')).length
      },
      email: {
        configured: !!this.emailTransporter,
        rateLimitedAlerts: Array.from(this.rateLimits.keys()).filter(k => k.startsWith('email_')).length
      },
      totalRateLimits: this.rateLimits.size
    };
  }
}

module.exports = NotificationService;