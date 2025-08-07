package com.aliifishmarket.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_number", unique = true, nullable = false)
    private String orderNumber;
    
    // Customer information
    @Column(name = "customer_name", nullable = false)
    @NotBlank(message = "Customer name is required")
    private String customerName;
    
    @Column(name = "customer_email")
    @Email(message = "Valid email is required")
    private String customerEmail;
    
    @Column(name = "customer_phone", nullable = false)
    @NotBlank(message = "Customer phone is required")
    private String customerPhone;
    
    // Order items
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;
    
    // Order details
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType orderType;
    
    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;
    
    @Column(name = "estimated_ready_time")
    private LocalDateTime estimatedReadyTime;
    
    // Pricing
    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    @NotNull
    @DecimalMin(value = "0.01", message = "Subtotal must be greater than 0")
    private BigDecimal subtotal;
    
    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    @NotNull
    @DecimalMin(value = "0.00", message = "Tax amount cannot be negative")
    private BigDecimal taxAmount;
    
    @Column(name = "service_fee", nullable = false, precision = 10, scale = 2)
    @NotNull
    @DecimalMin(value = "0.00", message = "Service fee cannot be negative")
    private BigDecimal serviceFee;
    
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    @NotNull
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    private BigDecimal totalAmount;
    
    // Payment information
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    
    @Column(name = "payment_transaction_id")
    private String paymentTransactionId;
    
    @Column(name = "upp_payment_id")
    private String uppPaymentId;
    
    // Special instructions and notes
    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;
    
    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;
    
    // Timestamps
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    // Staff assignment
    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        
        // Generate unique order number
        if (orderNumber == null) {
            orderNumber = "ALI" + System.currentTimeMillis() + "-" + 
                         UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }
        
        // Set estimated ready time if not set
        if (estimatedReadyTime == null && scheduledTime != null) {
            estimatedReadyTime = scheduledTime;
        } else if (estimatedReadyTime == null) {
            estimatedReadyTime = createdAt.plusMinutes(15); // Default 15 minutes
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        
        if (status == OrderStatus.COMPLETED && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
    
    // Constructors
    public Order() {}
    
    public Order(String customerName, String customerPhone, OrderType orderType) {
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.orderType = orderType;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    
    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }
    
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    
    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }
    
    public LocalDateTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }
    
    public LocalDateTime getEstimatedReadyTime() { return estimatedReadyTime; }
    public void setEstimatedReadyTime(LocalDateTime estimatedReadyTime) { 
        this.estimatedReadyTime = estimatedReadyTime; 
    }
    
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    
    public BigDecimal getServiceFee() { return serviceFee; }
    public void setServiceFee(BigDecimal serviceFee) { this.serviceFee = serviceFee; }
    
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    
    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { 
        this.paymentTransactionId = paymentTransactionId; 
    }
    
    public String getUppPaymentId() { return uppPaymentId; }
    public void setUppPaymentId(String uppPaymentId) { this.uppPaymentId = uppPaymentId; }
    
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { 
        this.specialInstructions = specialInstructions; 
    }
    
    public String getStaffNotes() { return staffNotes; }
    public void setStaffNotes(String staffNotes) { this.staffNotes = staffNotes; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public Long getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }
    
    // Business logic methods
    public boolean canBeCancelled() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }
    
    public boolean isReadyForPickup() {
        return status == OrderStatus.READY;
    }
    
    public int getEstimatedWaitTimeMinutes() {
        if (estimatedReadyTime == null) return 0;
        LocalDateTime now = LocalDateTime.now();
        if (estimatedReadyTime.isBefore(now)) return 0;
        return (int) java.time.Duration.between(now, estimatedReadyTime).toMinutes();
    }
    
    // Enums
    public enum OrderStatus {
        PENDING("Order Received"),
        CONFIRMED("Order Confirmed"), 
        PREPARING("Being Prepared"),
        READY("Ready for Pickup"),
        COMPLETED("Completed"),
        CANCELLED("Cancelled");
        
        private final String displayName;
        
        OrderStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum OrderType {
        PICKUP("Pickup"),
        DELIVERY("Delivery");
        
        private final String displayName;
        
        OrderType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum PaymentMethod {
        NFC("NFC Tap Payment"),
        QR_CODE("QR Code"),
        VOICE("Voice Payment"),
        CARD("Credit/Debit Card"),
        CASH("Cash");
        
        private final String displayName;
        
        PaymentMethod(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum PaymentStatus {
        PENDING("Payment Pending"),
        COMPLETED("Payment Completed"),
        FAILED("Payment Failed"),
        REFUNDED("Payment Refunded");
        
        private final String displayName;
        
        PaymentStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}