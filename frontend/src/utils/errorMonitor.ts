// AI Error Monitoring Integration for Alii Fish Market Frontend

interface ErrorReport {
  timestamp: string;
  type: string;
  severity: string;
  message: string;
  stackTrace?: string;
  context: string;
  userId?: string;
  service: string;
  environment: string;
  url: string;
  userAgent: string;
}

interface PaymentErrorReport extends ErrorReport {
  paymentMethod: string;
  amount?: string;
  orderId?: string;
  uppResponse?: string;
}

class ErrorMonitorService {
  private endpoint: string;
  private enabled: boolean;
  private apiKey: string;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_ERROR_MONITOR_ENDPOINT || 'https://alii-error-monitor.onrender.com';
    this.enabled = process.env.NEXT_PUBLIC_ERROR_MONITOR_ENABLED === 'true';
    this.apiKey = process.env.NEXT_PUBLIC_ERROR_MONITOR_API_KEY || '';
  }

  /**
   * Report JavaScript error to AI monitoring system
   */
  async reportError(
    error: Error, 
    context: string, 
    userId?: string, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    if (!this.enabled) return;

    try {
      const errorReport: ErrorReport = {
        timestamp: new Date().toISOString(),
        type: 'javascript',
        severity,
        message: error.message,
        stackTrace: error.stack,
        context,
        userId,
        service: 'alii-frontend',
        environment: process.env.NODE_ENV || 'development',
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      await this.sendReport('/api/errors/report', errorReport);
      console.info('Error reported to AI monitoring system');
    } catch (e) {
      console.warn('Failed to report error to monitoring system:', e);
    }
  }

  /**
   * Report payment error (high priority)
   */
  async reportPaymentError(
    error: Error,
    paymentMethod: string,
    amount?: string,
    orderId?: string,
    uppResponse?: string
  ) {
    if (!this.enabled) return;

    try {
      const errorReport: PaymentErrorReport = {
        timestamp: new Date().toISOString(),
        type: 'payment',
        severity: 'critical',
        message: error.message,
        stackTrace: error.stack,
        context: 'payment_processing',
        service: 'alii-frontend',
        environment: process.env.NODE_ENV || 'development',
        url: window.location.href,
        userAgent: navigator.userAgent,
        paymentMethod,
        amount,
        orderId,
        uppResponse
      };

      await this.sendReport('/api/errors/report/payment', errorReport);
      console.error('Payment error reported to AI monitoring system');
    } catch (e) {
      console.error('Failed to report payment error to monitoring system:', e);
    }
  }

  /**
   * Report API error
   */
  async reportApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    responseData?: any
  ) {
    if (!this.enabled) return;

    try {
      const errorReport: ErrorReport & { 
        endpoint: string; 
        method: string; 
        statusCode?: number; 
        responseData?: any 
      } = {
        timestamp: new Date().toISOString(),
        type: 'api',
        severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
        message: error.message,
        stackTrace: error.stack,
        context: `api_call_${endpoint}`,
        service: 'alii-frontend',
        environment: process.env.NODE_ENV || 'development',
        url: window.location.href,
        userAgent: navigator.userAgent,
        endpoint,
        method,
        statusCode,
        responseData
      };

      await this.sendReport('/api/errors/report/api', errorReport);
    } catch (e) {
      console.warn('Failed to report API error to monitoring system:', e);
    }
  }

  /**
   * Report UPP integration error
   */
  async reportUppError(
    errorMessage: string,
    transactionId?: string,
    uppResponse?: any
  ) {
    if (!this.enabled) return;

    try {
      const errorReport = {
        timestamp: new Date().toISOString(),
        type: 'payment',
        severity: 'high',
        message: errorMessage,
        context: 'upp_integration',
        service: 'alii-frontend',
        environment: process.env.NODE_ENV || 'development',
        url: window.location.href,
        transactionId,
        uppResponse
      };

      await this.sendReport('/api/errors/report/upp', errorReport);
    } catch (e) {
      console.error('Failed to report UPP error to monitoring system:', e);
    }
  }

  /**
   * Report performance issue
   */
  async reportPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context: string
  ) {
    if (!this.enabled) return;

    try {
      const errorReport = {
        timestamp: new Date().toISOString(),
        type: 'performance',
        severity: value > threshold * 2 ? 'high' : 'medium',
        message: `Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`,
        context,
        service: 'alii-frontend',
        environment: process.env.NODE_ENV || 'development',
        url: window.location.href,
        metric,
        value,
        threshold
      };

      await this.sendReport('/api/errors/report/performance', errorReport);
    } catch (e) {
      console.warn('Failed to report performance issue to monitoring system:', e);
    }
  }

  private async sendReport(endpoint: string, report: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.endpoint}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(report)
    });

    if (!response.ok) {
      throw new Error(`Failed to send error report: ${response.status}`);
    }
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandling() {
    if (!this.enabled) return;

    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(
        new Error(event.message),
        'unhandled_javascript_error',
        undefined,
        'high'
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        new Error(event.reason),
        'unhandled_promise_rejection',
        undefined,
        'high'
      );
    });

    // Handle React errors (if using error boundary)
    console.info('Global error monitoring initialized for Alii Fish Market');
  }

  /**
   * Monitor page load performance
   */
  monitorPagePerformance() {
    if (!this.enabled) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          
          // Report if page load takes more than 3 seconds
          if (loadTime > 3000) {
            this.reportPerformanceIssue(
              'page_load_time',
              loadTime,
              3000,
              'page_load_performance'
            );
          }
        }
      }, 1000);
    });
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      endpoint: this.endpoint,
      hasApiKey: !!this.apiKey
    };
  }
}

// Export singleton instance
export const errorMonitor = new ErrorMonitorService();

// Helper hook for React components
export const useErrorMonitoring = () => {
  const reportError = (error: Error, context: string, severity?: 'low' | 'medium' | 'high' | 'critical') => {
    errorMonitor.reportError(error, context, undefined, severity);
  };

  const reportPaymentError = (
    error: Error,
    paymentMethod: string,
    amount?: string,
    orderId?: string
  ) => {
    errorMonitor.reportPaymentError(error, paymentMethod, amount, orderId);
  };

  const reportApiError = (
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number
  ) => {
    errorMonitor.reportApiError(error, endpoint, method, statusCode);
  };

  return {
    reportError,
    reportPaymentError,
    reportApiError,
    status: errorMonitor.getStatus()
  };
};

// Toast POS replacement context
export const ALII_CONTEXT = {
  system: 'Alii Fish Market - Toast POS Replacement',
  annualSavings: 6132,
  toastAnnualCost: 19932,
  uppAnnualCost: 13800,
  businessHours: {
    start: '06:00',
    end: '20:00',
    timezone: 'Pacific/Honolulu'
  }
};