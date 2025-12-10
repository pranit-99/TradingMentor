package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.AccountTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountTransactionRepository extends JpaRepository<AccountTransaction, Long> {

    List<AccountTransaction> findByTradingAccountIdOrderByCreatedAtDesc(Long tradingAccountId);
}
