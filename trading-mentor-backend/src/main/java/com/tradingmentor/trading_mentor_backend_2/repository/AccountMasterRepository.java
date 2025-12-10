package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.AccountMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountMasterRepository extends JpaRepository<AccountMaster, Long> {

    Optional<AccountMaster> findByUserId(Long userId);

    Optional<AccountMaster> findByAccountNumber(String accountNumber);
}
