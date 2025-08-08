'use client';

import { useEffect } from 'react';
import { errorMonitor } from '../utils/errorMonitor';

export function ErrorMonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize global error monitoring
    errorMonitor.setupGlobalErrorHandling();
    errorMonitor.monitorPagePerformance();
    
    console.info('🤖 AI Error Monitoring initialized for Alii Fish Market');
    console.info('💰 Annual savings: $6,132 vs Toast POS');
    console.info('📊 Monitoring status:', errorMonitor.getStatus());
    
    // Monitor React hydration errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      
      // Check for React hydration errors
      if (errorMessage.includes('Hydration') || errorMessage.includes('hydration')) {
        errorMonitor.reportError(
          new Error(errorMessage),
          'react_hydration_error',
          undefined,
          'medium'
        );
      }
      
      // Check for payment-related errors
      if (errorMessage.includes('payment') || errorMessage.includes('stripe') || errorMessage.includes('upp')) {
        errorMonitor.reportError(
          new Error(errorMessage),
          'payment_console_error',
          undefined,
          'high'
        );
      }
      
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
}