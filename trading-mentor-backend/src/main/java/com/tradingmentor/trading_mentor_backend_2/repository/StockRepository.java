package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for accessing stock_master data.
 * Provides basic CRUD and some custom finder methods.
 */
@Repository
public interface StockRepository extends JpaRepository<Stock, Integer> {

    // Find a stock by its symbol, e.g. "AAPL"
    Optional<Stock> findBySymbol(String symbol);

    // Get all active stocks (is_active = true)
    List<Stock> findByIsActiveTrue();
}
