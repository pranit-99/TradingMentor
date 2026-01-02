package com.tradingmentor.trading_mentor_backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tradingmentor.trading_mentor_backend.model.Transact;

@Repository
public interface TransactRepository extends JpaRepository<Transact, Long> {

    // Fetch latest transactions for a user (newest first)
    List<Transact> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);

    //  Ledger: date range filter
    List<Transact> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Integer userId,
            LocalDateTime from,
            LocalDateTime to
    );
}
