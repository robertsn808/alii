package com.aliifishmarket.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for integrating with Universal Payment Protocol (UPP)
 * Handles payment processing, device registration, and webhook processing
 */
@Service
public class UppIntegrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(UppIntegrationService.class);
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    @Value("${app.upp.api-key}")
    private String uppApiKey;
    
    @Value("${app.upp.webhook-secret}")
    private String webhookSecret;
    
    public UppIntegrationService(@Value("${app.upp.api-url}") String uppApiUrl, ObjectMapper objectMapper) {
        this.webClient = WebClient.builder()
                .baseUrl(uppApiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.objectMapper = objectMapper;
    }
    
    /**
     * Process payment using UPP
     */
    public Mono<UppPaymentResponse> processPayment(UppPaymentRequest request) {
        logger.info("Processing UPP payment for amount: ${} via device: {}", 
                   request.getAmount(), request.getDeviceType());
        
        return webClient.post()
                .uri("/api/process-payment")
                .header("Authorization", "Bearer " + uppApiKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(UppPaymentResponse.class)
                .doOnSuccess(response -> {
                    if (response.isSuccess()) {
                        logger.info("UPP payment successful: {}", response.getPaymentId());
                    } else {
                        logger.error("UPP payment failed: {}", response.getError());
                    }
                })
                .doOnError(error -> {
                    logger.error("Error processing UPP payment: {}", error.getMessage(), error);
                });
    }
    
    /**
     * Register a device with UPP
     */
    public Mono<UppDeviceResponse> registerDevice(UppDeviceRequest request) {
        logger.info("Registering UPP device: {} with capabilities: {}", 
                   request.getDeviceType(), request.getCapabilities());
        
        return webClient.post()
                .uri("/api/register-device")
                .header("Authorization", "Bearer " + uppApiKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(UppDeviceResponse.class)
                .doOnSuccess(response -> {
                    if (response.isSuccess()) {
                        logger.info("UPP device registered successfully: {}", response.getDeviceId());
                    } else {
                        logger.error("UPP device registration failed: {}", response.getError());
                    }
                })
                .doOnError(error -> {
                    logger.error("Error registering UPP device: {}", error.getMessage(), error);
                });
    }
    
    /**
     * Get payment status from UPP
     */
    public Mono<UppPaymentStatus> getPaymentStatus(String paymentId) {
        logger.debug("Getting UPP payment status for: {}", paymentId);
        
        return webClient.get()
                .uri("/api/payment-status/{paymentId}", paymentId)
                .header("Authorization", "Bearer " + uppApiKey)
                .retrieve()
                .bodyToMono(UppPaymentStatus.class)
                .doOnError(error -> {
                    logger.error("Error getting UPP payment status: {}", error.getMessage(), error);
                });
    }
    
    /**
     * Create UPP payment request for fish market order
     */
    public UppPaymentRequest createPaymentRequest(String deviceType, String deviceId, 
                                                 BigDecimal amount, String orderNumber, 
                                                 String customerEmail, String customerName) {
        UppPaymentRequest request = new UppPaymentRequest();
        request.setAmount(amount);
        request.setDeviceType(deviceType);
        request.setDeviceId(deviceId);
        request.setDescription("Ali'i Fish Market Order #" + orderNumber);
        request.setCustomerEmail(customerEmail);
        
        // Add metadata for fish market specific information
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("orderNumber", orderNumber);
        metadata.put("customerName", customerName);
        metadata.put("merchant", "Ali'i Fish Market");
        metadata.put("location", "Honolulu, HI");
        request.setMetadata(metadata);
        
        return request;
    }
    
    /**
     * Create device registration request for staff devices
     */
    public UppDeviceRequest createDeviceRequest(String deviceType, String[] capabilities, 
                                               String fingerprint, String staffMemberId) {
        UppDeviceRequest request = new UppDeviceRequest();
        request.setDeviceType(deviceType);
        request.setCapabilities(capabilities);
        request.setFingerprint(fingerprint);
        
        Map<String, Object> securityContext = new HashMap<>();
        securityContext.put("merchant", "Ali'i Fish Market");
        securityContext.put("staffMemberId", staffMemberId);
        securityContext.put("location", "Honolulu, HI");
        request.setSecurityContext(securityContext);
        
        return request;
    }
    
    /**
     * Verify webhook signature for security
     */
    public boolean verifyWebhookSignature(String payload, String signature) {
        // Implement webhook signature verification
        // This should match the UPP webhook signature algorithm
        try {
            // Placeholder for actual signature verification
            return true;
        } catch (Exception e) {
            logger.error("Error verifying webhook signature: {}", e.getMessage(), e);
            return false;
        }
    }
    
    // DTOs for UPP integration
    
    public static class UppPaymentRequest {
        private BigDecimal amount;
        private String deviceType;
        private String deviceId;
        private String description;
        private String customerEmail;
        private Map<String, Object> metadata;
        
        // Getters and setters
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getDeviceType() { return deviceType; }
        public void setDeviceType(String deviceType) { this.deviceType = deviceType; }
        
        public String getDeviceId() { return deviceId; }
        public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }
    
    public static class UppPaymentResponse {
        private boolean success;
        private String paymentId;
        private String transactionId;
        private String error;
        private String paymentUrl;
        
        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getPaymentId() { return paymentId; }
        public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
        
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        
        public String getPaymentUrl() { return paymentUrl; }
        public void setPaymentUrl(String paymentUrl) { this.paymentUrl = paymentUrl; }
    }
    
    public static class UppDeviceRequest {
        private String deviceType;
        private String[] capabilities;
        private String fingerprint;
        private Map<String, Object> securityContext;
        
        // Getters and setters
        public String getDeviceType() { return deviceType; }
        public void setDeviceType(String deviceType) { this.deviceType = deviceType; }
        
        public String[] getCapabilities() { return capabilities; }
        public void setCapabilities(String[] capabilities) { this.capabilities = capabilities; }
        
        public String getFingerprint() { return fingerprint; }
        public void setFingerprint(String fingerprint) { this.fingerprint = fingerprint; }
        
        public Map<String, Object> getSecurityContext() { return securityContext; }
        public void setSecurityContext(Map<String, Object> securityContext) { 
            this.securityContext = securityContext; 
        }
    }
    
    public static class UppDeviceResponse {
        private boolean success;
        private String deviceId;
        private String error;
        
        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getDeviceId() { return deviceId; }
        public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public static class UppPaymentStatus {
        private String paymentId;
        private String status;
        private String transactionId;
        private BigDecimal amount;
        private String error;
        
        // Getters and setters
        public String getPaymentId() { return paymentId; }
        public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}