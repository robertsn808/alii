package com.aliifishmarket.repository;

import com.aliifishmarket.model.Transaction;
import com.aliifishmarket.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    Optional<Transaction> findByTransactionId(String transactionId);
    
    List<Transaction> findByTransactionDateOrderByCreatedAtDesc(LocalDate date);
    
    List<Transaction> findByStaffAndTransactionDateOrderByCreatedAtDesc(Staff staff, LocalDate date);
    
    List<Transaction> findByTransactionDateBetweenOrderByCreatedAtDesc(LocalDate startDate, LocalDate endDate);
    
    List<Transaction> findByStaffAndTransactionDateBetweenOrderByCreatedAtDesc(
        Staff staff, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT t FROM Transaction t WHERE t.transactionDate = :date AND t.status = 'COMPLETED' ORDER BY t.createdAt DESC")
    List<Transaction> findCompletedTransactionsByDate(@Param("date") LocalDate date);
    
    @Query("SELECT SUM(t.totalAmount) FROM Transaction t WHERE t.transactionDate = :date AND t.status = 'COMPLETED'")
    BigDecimal getTotalSalesByDate(@Param("date") LocalDate date);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.transactionDate = :date AND t.status = 'COMPLETED'")
    Long getTransactionCountByDate(@Param("date") LocalDate date);
    
    @Query("SELECT SUM(t.totalAmount) FROM Transaction t WHERE t.staff = :staff AND t.transactionDate = :date AND t.status = 'COMPLETED'")
    BigDecimal getTotalSalesByStaffAndDate(@Param("staff") Staff staff, @Param("date") LocalDate date);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.staff = :staff AND t.transactionDate = :date AND t.status = 'COMPLETED'")
    Long getTransactionCountByStaffAndDate(@Param("staff") Staff staff, @Param("date") LocalDate date);
    
    @Query("SELECT SUM(t.totalAmount) FROM Transaction t WHERE t.paymentMethod = :paymentMethod AND t.transactionDate = :date AND t.status = 'COMPLETED'")
    BigDecimal getTotalSalesByPaymentMethodAndDate(
        @Param("paymentMethod") Transaction.PaymentMethod paymentMethod, @Param("date") LocalDate date);
    
    @Query("SELECT t FROM Transaction t WHERE t.receiptNumber = :receiptNumber")
    Optional<Transaction> findByReceiptNumber(@Param("receiptNumber") String receiptNumber);
    
    @Query("SELECT t FROM Transaction t WHERE t.createdAt BETWEEN :startTime AND :endTime ORDER BY t.createdAt DESC")
    List<Transaction> findByCreatedAtBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    // Dashboard queries
    @Query("""
        SELECT new map(
            DATE(t.transactionDate) as date,
            COUNT(t) as transactionCount,
            SUM(t.totalAmount) as totalSales,
            SUM(CASE WHEN t.paymentMethod = 'CASH' THEN t.totalAmount ELSE 0 END) as cashSales,
            SUM(CASE WHEN t.paymentMethod = 'CARD' THEN t.totalAmount ELSE 0 END) as cardSales,
            SUM(CASE WHEN t.paymentMethod = 'NFC' THEN t.totalAmount ELSE 0 END) as nfcSales,
            SUM(CASE WHEN t.paymentMethod = 'QR' THEN t.totalAmount ELSE 0 END) as qrSales,
            SUM(t.taxAmount) as totalTax
        )
        FROM Transaction t 
        WHERE t.transactionDate BETWEEN :startDate AND :endDate 
        AND t.status = 'COMPLETED'
        GROUP BY DATE(t.transactionDate)
        ORDER BY DATE(t.transactionDate) DESC
        """)
    List<Object> getDailySalesSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("""
        SELECT new map(
            s.employeeId as employeeId,
            CONCAT(s.firstName, ' ', s.lastName) as staffName,
            COUNT(t) as transactionCount,
            SUM(t.totalAmount) as totalSales,
            AVG(t.totalAmount) as avgTransactionAmount,
            SUM(CASE WHEN t.paymentMethod = 'CASH' THEN t.totalAmount ELSE 0 END) as cashHandled
        )
        FROM Transaction t 
        JOIN t.staff s
        WHERE t.transactionDate BETWEEN :startDate AND :endDate 
        AND t.status = 'COMPLETED'
        GROUP BY s.id, s.employeeId, s.firstName, s.lastName
        ORDER BY SUM(t.totalAmount) DESC
        """)
    List<Object> getStaffPerformanceSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}