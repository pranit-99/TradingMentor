package com.tradingmentor.trading_mentor_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tradingmentor.trading_mentor_backend.model.AccountTransaction;

public interface AccountTransactionRepository extends JpaRepository<AccountTransaction, Long> {

   // List<AccountTransaction> findByTradingAccountIdOrderByCreatedAtDesc(Long tradingAccountId);
   List<AccountTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

}
