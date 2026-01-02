package com.tradingmentor.trading_mentor_backend.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a tradable stock/instrument in the system.
 * This maps to the "stock_master" table in MySQL.
 */
@Entity
@Table(name = "stock_master")
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stock_id")
    private Integer stockId;          // Internal ID (primary key)

    @Column(name = "symbol", nullable = false, unique = true, length = 20)
    private String symbol;           // Ticker, e.g. "AAPL"

    @Column(name = "name", nullable = false, length = 100)
    private String name;             // Full company name

    @Column(name = "exchange", nullable = false, length = 20)
    private String exchange;         // e.g. "NASDAQ", "NYSE"

    @Column(name = "sector", length = 50)
    private String sector;           // e.g. "Technology", "Financials"

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;         // e.g. "USD"

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;        // true = can trade, false = disabled

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt; // Set by DB when row is created

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt; // Set by DB when row is updated

    // Latest market price from Alpha Vantage
    @Column(name = "last_price")
    private BigDecimal lastPrice;

    // Currency of the price (e.g., USD)
    @Column(name = "last_price_currency")
    private String lastPriceCurrency;

    // When we last updated the price
    @Column(name = "last_price_updated_at")
    private LocalDateTime lastPriceUpdatedAt;

    // JPA requires a no-argument constructor
    public Stock() {
    }

    // Getters and setters

    public Integer getStockId() {
        return stockId;
    }

    public void setStockId(Integer stockId) {
        this.stockId = stockId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public BigDecimal getLastPrice() {
        return lastPrice;
    }

    public void setLastPrice(BigDecimal lastPrice) {
        this.lastPrice = lastPrice;
    }

    public String getLastPriceCurrency() {
        return lastPriceCurrency;
    }

    public void setLastPriceCurrency(String lastPriceCurrency) {
        this.lastPriceCurrency = lastPriceCurrency;
    }

    public LocalDateTime getLastPriceUpdatedAt() {
        return lastPriceUpdatedAt;
    }

    public void setLastPriceUpdatedAt(LocalDateTime lastPriceUpdatedAt) {
        this.lastPriceUpdatedAt = lastPriceUpdatedAt;
    }

}
