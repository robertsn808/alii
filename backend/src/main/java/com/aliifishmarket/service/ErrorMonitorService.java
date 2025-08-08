package com.aliifishmarket.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.Async;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class ErrorMonitorService {

    private static final Logger logger = LoggerFactory.getLogger(ErrorMonitorService.class);

    @Autowired
    private RestTemplate errorMonitorRestTemplate;

    @Autowired
    private ErrorMonitorConfig errorMonitorConfig;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Report error to AI monitoring system
     */
    @Async
    public void reportError(Exception error, String context, String userId) {
        if (!errorMonitorConfig.isErrorMonitorEnabled()) {
            return;
        }

        try {
            Map<String, Object> errorReport = createErrorReport(error, context, userId);
            
            // Send to AI error monitoring system
            errorMonitorRestTemplate.postForObject("/api/errors/report", errorReport, String.class);
            
            logger.info("Error reported to AI monitoring system: {}", error.getMessage());
        } catch (Exception e) {
            logger.warn("Failed to report error to monitoring system: {}", e.getMessage());
        }
    }

    /**
     * Report payment error (high priority)
     */
    @Async
    public void reportPaymentError(Exception error, String paymentMethod, String amount, String orderId) {
        if (!errorMonitorConfig.isErrorMonitorEnabled()) {
            return;
        }

        try {
            Map<String, Object> errorReport = createPaymentErrorReport(error, paymentMethod, amount, orderId);
            
            // Send to AI error monitoring system with high priority
            errorMonitorRestTemplate.postForObject("/api/errors/report/payment", errorReport, String.class);
            
            logger.error("Payment error reported to AI monitoring system: {}", error.getMessage());
        } catch (Exception e) {
            logger.error("Failed to report payment error to monitoring system: {}", e.getMessage());
        }
    }

    /**
     * Report UPP integration error
     */
    @Async
    public void reportUppError(String errorMessage, String transactionId, String response) {
        if (!errorMonitorConfig.isErrorMonitorEnabled()) {
            return;
        }

        try {
            Map<String, Object> errorReport = createUppErrorReport(errorMessage, transactionId, response);
            
            // Send to AI error monitoring system
            errorMonitorRestTemplate.postForObject("/api/errors/report/upp", errorReport, String.class);
            
            logger.error("UPP error reported to AI monitoring system: {}", errorMessage);
        } catch (Exception e) {
            logger.error("Failed to report UPP error to monitoring system: {}", e.getMessage());
        }
    }

    /**
     * Report database error
     */
    @Async
    public void reportDatabaseError(Exception error, String query, String operation) {
        if (!errorMonitorConfig.isErrorMonitorEnabled()) {
            return;
        }

        try {
            Map<String, Object> errorReport = createDatabaseErrorReport(error, query, operation);
            
            errorMonitorRestTemplate.postForObject("/api/errors/report/database", errorReport, String.class);
            
            logger.error("Database error reported to AI monitoring system: {}", error.getMessage());
        } catch (Exception e) {
            logger.warn("Failed to report database error to monitoring system: {}", e.getMessage());
        }
    }

    private Map<String, Object> createErrorReport(Exception error, String context, String userId) {
        Map<String, Object> report = new HashMap<>();
        report.put("timestamp", LocalDateTime.now().toString());
        report.put("type", "runtime");
        report.put("severity", determineSeverity(error));
        report.put("message", error.getMessage());
        report.put("stackTrace", getStackTrace(error));
        report.put("context", context);
        report.put("userId", userId);
        report.put("service", "alii-backend");
        report.put("environment", System.getProperty("spring.profiles.active", "development"));
        
        // Business context
        report.put("businessImpact", assessBusinessImpact(error));
        return report;
    }

    private Map<String, Object> createPaymentErrorReport(Exception error, String paymentMethod, String amount, String orderId) {
        Map<String, Object> report = createErrorReport(error, "payment_processing", null);
        report.put("type", "payment");
        report.put("severity", "critical");
        report.put("paymentMethod", paymentMethod);
        report.put("amount", amount);
        report.put("orderId", orderId);
        
        // Toast POS comparison context
        Map<String, Object> toastComparison = new HashMap<>();
        toastComparison.put("toast_annual_cost", 19932);
        toastComparison.put("upp_annual_cost", 13800);
        toastComparison.put("annual_savings", 6132);
        report.put("toastComparison", toastComparison);
        
        return report;
    }

    private Map<String, Object> createUppErrorReport(String errorMessage, String transactionId, String response) {
        Map<String, Object> report = new HashMap<>();
        report.put("timestamp", LocalDateTime.now().toString());
        report.put("type", "payment");
        report.put("severity", "high");
        report.put("message", errorMessage);
        report.put("transactionId", transactionId);
        report.put("uppResponse", response);
        report.put("service", "alii-backend");
        report.put("context", "upp_integration");
        return report;
    }

    private Map<String, Object> createDatabaseErrorReport(Exception error, String query, String operation) {
        Map<String, Object> report = createErrorReport(error, "database_operation", null);
        report.put("type", "database");
        report.put("query", query);
        report.put("operation", operation);
        return report;
    }

    private String determineSeverity(Exception error) {
        if (error.getMessage().contains("payment") || error.getMessage().contains("transaction")) {
            return "critical";
        } else if (error.getMessage().contains("database") || error.getMessage().contains("connection")) {
            return "high";
        } else if (error.getMessage().contains("validation") || error.getMessage().contains("input")) {
            return "medium";
        }
        return "low";
    }

    private String getStackTrace(Exception error) {
        if (error.getStackTrace().length > 0) {
            return error.getStackTrace()[0].toString();
        }
        return "";
    }

    private Map<String, String> assessBusinessImpact(Exception error) {
        Map<String, String> impact = new HashMap<>();
        
        String message = error.getMessage().toLowerCase();
        
        if (message.contains("payment") || message.contains("transaction")) {
            impact.put("revenue", "high");
            impact.put("operations", "high");
            impact.put("reputation", "medium");
        } else if (message.contains("order") || message.contains("customer")) {
            impact.put("revenue", "medium");
            impact.put("operations", "high");
            impact.put("reputation", "medium");
        } else {
            impact.put("revenue", "low");
            impact.put("operations", "low");
            impact.put("reputation", "low");
        }
        
        return impact;
    }
}