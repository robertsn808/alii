package com.aliifishmarket.repository;

import com.aliifishmarket.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    
    Optional<Staff> findByEmployeeId(String employeeId);
    
    Optional<Staff> findByEmail(String email);
    
    List<Staff> findByIsActiveTrue();
    
    List<Staff> findByRole(Staff.StaffRole role);
    
    @Query("SELECT s FROM Staff s WHERE s.isActive = true AND s.role IN (:roles)")
    List<Staff> findActiveStaffByRoles(@Param("roles") List<Staff.StaffRole> roles);
    
    @Query("SELECT s FROM Staff s WHERE s.isActive = true ORDER BY s.firstName, s.lastName")
    List<Staff> findAllActiveOrderByName();
    
    boolean existsByEmployeeId(String employeeId);
    
    boolean existsByEmail(String email);
}