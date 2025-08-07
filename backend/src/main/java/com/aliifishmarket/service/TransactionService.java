package com.aliifishmarket.service;

import com.aliifishmarket.model.Transaction;
import com.aliifishmarket.model.TransactionItem;
import com.aliifishmarket.model.Staff;
import com.aliifishmarket.repository.TransactionRepository;
import com.aliifishmarket.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TransactionService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private StaffRepository staffRepository;
    
    public Transaction createTransaction(TransactionCreateRequest request) {
        // Validate staff exists
        Staff staff = staffRepository.findByEmployeeId(request.getStaffEmployeeId())
            .orElseThrow(() -> new RuntimeException("Staff not found: " + request.getStaffEmployeeId()));
        
        // Create transaction
        Transaction transaction = new Transaction();
        transaction.setTransactionId(request.getTransactionId());
        transaction.setReceiptNumber(request.getReceiptNumber());
        transaction.setStaff(staff);
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setSubtotal(request.getSubtotal());
        transaction.setTaxAmount(request.getTaxAmount());
        transaction.setTotalAmount(request.getTotalAmount());
        
        if (request.getPaymentMethod() == Transaction.PaymentMethod.CASH) {
            transaction.setCashReceived(request.getCashReceived());
            transaction.calculateChange();
        }
        
        // Create transaction items
        if (request.getItems() != null) {
            for (TransactionItemRequest itemRequest : request.getItems()) {
                TransactionItem item = new TransactionItem(
                    transaction,
                    itemRequest.getItemName(),
                    itemRequest.getItemPrice(),
                    itemRequest.getQuantity()
                );
                transaction.getItems().add(item);
            }
        }
        
        return transactionRepository.save(transaction);
    }
    
    public Optional<Transaction> findByTransactionId(String transactionId) {
        return transactionRepository.findByTransactionId(transactionId);
    }
    
    public List<Transaction> getTodaysTransactions() {
        return transactionRepository.findByTransactionDateOrderByCreatedAtDesc(LocalDate.now());
    }
    
    public List<Transaction> getTransactionsByDateRange(LocalDate startDate, LocalDate endDate) {
        return transactionRepository.findByTransactionDateBetweenOrderByCreatedAtDesc(startDate, endDate);
    }
    
    public List<Transaction> getStaffTransactionsForDate(String employeeId, LocalDate date) {
        Staff staff = staffRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new RuntimeException("Staff not found: " + employeeId));
        return transactionRepository.findByStaffAndTransactionDateOrderByCreatedAtDesc(staff, date);
    }
    
    public DailySummary getDailySummary(LocalDate date) {
        BigDecimal totalSales = transactionRepository.getTotalSalesByDate(date);
        Long transactionCount = transactionRepository.getTransactionCountByDate(date);
        
        BigDecimal cashSales = transactionRepository.getTotalSalesByPaymentMethodAndDate(
            Transaction.PaymentMethod.CASH, date);
        BigDecimal cardSales = transactionRepository.getTotalSalesByPaymentMethodAndDate(
            Transaction.PaymentMethod.CARD, date);
        BigDecimal nfcSales = transactionRepository.getTotalSalesByPaymentMethodAndDate(
            Transaction.PaymentMethod.NFC, date);
        BigDecimal qrSales = transactionRepository.getTotalSalesByPaymentMethodAndDate(
            Transaction.PaymentMethod.QR, date);
        
        return new DailySummary(
            date,
            transactionCount != null ? transactionCount : 0,
            totalSales != null ? totalSales : BigDecimal.ZERO,
            cashSales != null ? cashSales : BigDecimal.ZERO,
            cardSales != null ? cardSales : BigDecimal.ZERO,
            nfcSales != null ? nfcSales : BigDecimal.ZERO,
            qrSales != null ? qrSales : BigDecimal.ZERO
        );
    }
    
    public StaffPerformance getStaffPerformance(String employeeId, LocalDate date) {
        Staff staff = staffRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new RuntimeException("Staff not found: " + employeeId));
        
        BigDecimal totalSales = transactionRepository.getTotalSalesByStaffAndDate(staff, date);
        Long transactionCount = transactionRepository.getTransactionCountByStaffAndDate(staff, date);
        
        return new StaffPerformance(
            staff.getEmployeeId(),
            staff.getFullName(),
            date,
            transactionCount != null ? transactionCount : 0,
            totalSales != null ? totalSales : BigDecimal.ZERO
        );
    }
    
    public List<Object> getDailySalesSummary(LocalDate startDate, LocalDate endDate) {
        return transactionRepository.getDailySalesSummary(startDate, endDate);
    }
    
    public List<Object> getStaffPerformanceSummary(LocalDate startDate, LocalDate endDate) {
        return transactionRepository.getStaffPerformanceSummary(startDate, endDate);
    }
    
    // DTO Classes
    public static class TransactionCreateRequest {
        private String transactionId;
        private String receiptNumber;
        private String staffEmployeeId;
        private Transaction.PaymentMethod paymentMethod;
        private BigDecimal subtotal;
        private BigDecimal taxAmount;
        private BigDecimal totalAmount;
        private BigDecimal cashReceived;
        private List<TransactionItemRequest> items;
        
        // Getters and setters
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        
        public String getReceiptNumber() { return receiptNumber; }
        public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }
        
        public String getStaffEmployeeId() { return staffEmployeeId; }
        public void setStaffEmployeeId(String staffEmployeeId) { this.staffEmployeeId = staffEmployeeId; }
        
        public Transaction.PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(Transaction.PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        
        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
        
        public BigDecimal getTaxAmount() { return taxAmount; }
        public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
        
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        
        public BigDecimal getCashReceived() { return cashReceived; }
        public void setCashReceived(BigDecimal cashReceived) { this.cashReceived = cashReceived; }
        
        public List<TransactionItemRequest> getItems() { return items; }
        public void setItems(List<TransactionItemRequest> items) { this.items = items; }
    }
    
    public static class TransactionItemRequest {
        private String itemName;
        private BigDecimal itemPrice;
        private Integer quantity;
        
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        
        public BigDecimal getItemPrice() { return itemPrice; }
        public void setItemPrice(BigDecimal itemPrice) { this.itemPrice = itemPrice; }
        
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
    
    public static class DailySummary {
        private LocalDate date;
        private Long transactionCount;
        private BigDecimal totalSales;
        private BigDecimal cashSales;
        private BigDecimal cardSales;
        private BigDecimal nfcSales;
        private BigDecimal qrSales;
        
        public DailySummary(LocalDate date, Long transactionCount, BigDecimal totalSales, 
                           BigDecimal cashSales, BigDecimal cardSales, BigDecimal nfcSales, BigDecimal qrSales) {
            this.date = date;
            this.transactionCount = transactionCount;
            this.totalSales = totalSales;
            this.cashSales = cashSales;
            this.cardSales = cardSales;
            this.nfcSales = nfcSales;
            this.qrSales = qrSales;
        }
        
        // Getters
        public LocalDate getDate() { return date; }
        public Long getTransactionCount() { return transactionCount; }
        public BigDecimal getTotalSales() { return totalSales; }
        public BigDecimal getCashSales() { return cashSales; }
        public BigDecimal getCardSales() { return cardSales; }
        public BigDecimal getNfcSales() { return nfcSales; }
        public BigDecimal getQrSales() { return qrSales; }
    }
    
    public static class StaffPerformance {
        private String employeeId;
        private String staffName;
        private LocalDate date;
        private Long transactionCount;
        private BigDecimal totalSales;
        
        public StaffPerformance(String employeeId, String staffName, LocalDate date, 
                              Long transactionCount, BigDecimal totalSales) {
            this.employeeId = employeeId;
            this.staffName = staffName;
            this.date = date;
            this.transactionCount = transactionCount;
            this.totalSales = totalSales;
        }
        
        // Getters
        public String getEmployeeId() { return employeeId; }
        public String getStaffName() { return staffName; }
        public LocalDate getDate() { return date; }
        public Long getTransactionCount() { return transactionCount; }
        public BigDecimal getTotalSales() { return totalSales; }
    }
}