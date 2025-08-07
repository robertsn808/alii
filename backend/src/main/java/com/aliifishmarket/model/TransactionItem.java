package com.aliifishmarket.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_items")
public class TransactionItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    @NotNull
    private Transaction transaction;
    
    @Column(name = "item_name", nullable = false)
    @NotBlank
    @Size(max = 255)
    private String itemName;
    
    @Column(name = "item_price", nullable = false, precision = 8, scale = 2)
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal itemPrice;
    
    @Column(name = "quantity", nullable = false)
    @NotNull
    @Min(value = 1)
    private Integer quantity;
    
    @Column(name = "line_total", nullable = false, precision = 10, scale = 2)
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal lineTotal;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Constructors
    public TransactionItem() {
        this.createdAt = LocalDateTime.now();
    }
    
    public TransactionItem(Transaction transaction, String itemName, BigDecimal itemPrice, Integer quantity) {
        this();
        this.transaction = transaction;
        this.itemName = itemName;
        this.itemPrice = itemPrice;
        this.quantity = quantity;
        this.lineTotal = itemPrice.multiply(BigDecimal.valueOf(quantity));
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Transaction getTransaction() { return transaction; }
    public void setTransaction(Transaction transaction) { this.transaction = transaction; }
    
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    
    public BigDecimal getItemPrice() { return itemPrice; }
    public void setItemPrice(BigDecimal itemPrice) { 
        this.itemPrice = itemPrice;
        if (this.quantity != null) {
            calculateLineTotal();
        }
    }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { 
        this.quantity = quantity;
        if (this.itemPrice != null) {
            calculateLineTotal();
        }
    }
    
    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    // Helper methods
    private void calculateLineTotal() {
        if (itemPrice != null && quantity != null) {
            this.lineTotal = itemPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }
    
    @PrePersist
    @PreUpdate
    public void calculateTotalOnSave() {
        calculateLineTotal();
    }
}