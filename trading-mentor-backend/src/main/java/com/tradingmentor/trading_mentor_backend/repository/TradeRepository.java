package com.tradingmentor.trading_mentor_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tradingmentor.trading_mentor_backend.model.Trade;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {
}

