package com.aliifishmarket.exception;

import com.aliifishmarket.service.ErrorMonitorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.dao.DataAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.validation.BindException;
import org.springframework.security.access.AccessDeniedException;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Autowired
    private ErrorMonitorService errorMonitorService;

    @ExceptionHandler(PaymentProcessingException.class)
    public ResponseEntity<Map<String, Object>> handlePaymentError(
            PaymentProcessingException ex, 
            HttpServletRequest request) {
        
        logger.error("Payment processing error: {}", ex.getMessage(), ex);
        
        // Report to AI monitoring system with high priority
        errorMonitorService.reportPaymentError(
            ex, 
            ex.getPaymentMethod(), 
            ex.getAmount(), 
            ex.getOrderId()
        );
        
        Map<String, Object> errorResponse = createErrorResponse(
            "PAYMENT_ERROR", 
            "Payment processing failed. Please try again or contact support.", 
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UppIntegrationException.class)
    public ResponseEntity<Map<String, Object>> handleUppError(
            UppIntegrationException ex, 
            HttpServletRequest request) {
        
        logger.error("UPP integration error: {}", ex.getMessage(), ex);
        
        // Report to AI monitoring system
        errorMonitorService.reportUppError(
            ex.getMessage(), 
            ex.getTransactionId(), 
            ex.getUppResponse()
        );
        
        Map<String, Object> errorResponse = createErrorResponse(
            "UPP_ERROR", 
            "Universal Payment Protocol error. Payment system temporarily unavailable.", 
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDatabaseError(
            DataAccessException ex, 
            HttpServletRequest request) {
        
        logger.error("Database error: {}", ex.getMessage(), ex);
        
        // Report to AI monitoring system
        errorMonitorService.reportDatabaseError(ex, "unknown", "database_operation");
        
        Map<String, Object> errorResponse = createErrorResponse(
            "DATABASE_ERROR", 
            "Database temporarily unavailable. Please try again later.", 
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Map<String, Object>> handleExternalServiceError(
            RestClientException ex, 
            HttpServletRequest request) {
        
        logger.error("External service error: {}", ex.getMessage(), ex);
        
        // Report to AI monitoring system
        errorMonitorService.reportError(ex, "external_service", null);
        
        Map<String, Object> errorResponse = createErrorResponse(
            "SERVICE_ERROR", 
            "External service temporarily unavailable.", 
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<Map<String, Object>> handleValidationError(
            BindException ex, 
            HttpServletRequest request) {
        
        logger.warn("Validation error: {}", ex.getMessage());
        
        // Report to AI monitoring system (low priority)
        errorMonitorService.reportError(ex, "validation", null);
        
        Map<String, Object> errorResponse = createErrorResponse(
            "VALIDATION_ERROR", 
            "Invalid input data provided.", 
            request.getRequestURI()
        );
        
        errorResponse.put("fieldErrors", ex.getBindingResult().getFieldErrors());
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex, 
            HttpServletRequest request) {
        
        logger.warn("Access denied: {}", ex.getMessage());
        
        // Report security issue to AI monitoring system
        errorMonitorService.reportError(ex, "security_access_denied", null);
        
        Map<String, Object> errorResponse = createErrorResponse(
            "ACCESS_DENIED", 
            "Access denied. Insufficient permissions.", 
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericError(
            Exception ex, 
            HttpServletRequest request) {
        
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        
        // Report to AI monitoring system
        errorMonitorService.reportError(ex, "unexpected_error", null);
        
        Map<String, Object> errorResponse = createErrorResponse(
            "INTERNAL_ERROR", 
            "An unexpected error occurred. Our team has been notified.", 
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private Map<String, Object> createErrorResponse(String errorCode, String message, String path) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("error", errorCode);
        errorResponse.put("message", message);
        errorResponse.put("path", path);
        
        // Add Alii Fish Market context
        errorResponse.put("system", "Alii Fish Market - Toast POS Replacement");
        errorResponse.put("support", "Contact support if this issue persists");
        
        return errorResponse;
    }
}

// Custom Exception Classes
class PaymentProcessingException extends RuntimeException {
    private String paymentMethod;
    private String amount;
    private String orderId;

    public PaymentProcessingException(String message, String paymentMethod, String amount, String orderId) {
        super(message);
        this.paymentMethod = paymentMethod;
        this.amount = amount;
        this.orderId = orderId;
    }

    public String getPaymentMethod() { return paymentMethod; }
    public String getAmount() { return amount; }
    public String getOrderId() { return orderId; }
}

class UppIntegrationException extends RuntimeException {
    private String transactionId;
    private String uppResponse;

    public UppIntegrationException(String message, String transactionId, String uppResponse) {
        super(message);
        this.transactionId = transactionId;
        this.uppResponse = uppResponse;
    }

    public String getTransactionId() { return transactionId; }
    public String getUppResponse() { return uppResponse; }
}