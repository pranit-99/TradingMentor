package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.TradingAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TradingAccountRepository extends JpaRepository<TradingAccount, Long> {

    Optional<TradingAccount> findByUserId(Integer userId);

    Optional<TradingAccount> findByAccountNumber(String accountNumber);
}
