package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.UserRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRecordRepository extends JpaRepository<UserRecord, Long> {

    // used during signup to check duplicate email
    boolean existsByEmailIgnoreCase(String email);

    // used during login / forgot-password
    Optional<UserRecord> findByEmailIgnoreCase(String email);
}

