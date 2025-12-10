package com.tradingmentor.trading_mentor_backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents the current holdings (position) of a user for a given stock symbol.
 * This maps directly to the "positions" table in MySQL.
 */
@Entity
@Table(name = "positions")
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "position_id")
    private Integer positionId;  // Internal ID for the position row

    @Column(name = "user_id", nullable = false)
    private Integer userId;      // Which user this position belongs to

    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;       // Stock symbol (e.g., "AAPL")

    @Column(name = "quantity", nullable = false)
    private Integer quantity;    // How many shares currently held

    @Column(name = "avg_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal avgPrice; // Average buy price for these shares

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt; // Last time this row was updated (by DB)

    // JPA requires a no-args constructor
    public Position() {
    }

    // Getters and setters

    public Integer getPositionId() {
        return positionId;
    }

    public void setPositionId(Integer positionId) {
        this.positionId = positionId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAvgPrice() {
        return avgPrice;
    }

    public void setAvgPrice(BigDecimal avgPrice) {
        this.avgPrice = avgPrice;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
