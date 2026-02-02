package com.tradingmentor.trading_mentor_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tradingmentor.trading_mentor_backend.model.AccountMaster;

public interface AccountMasterRepository extends JpaRepository<AccountMaster, Long> {

    Optional<AccountMaster> findByUserId(Long userId);

    Optional<AccountMaster> findByAccountNumber(String accountNumber);
}
