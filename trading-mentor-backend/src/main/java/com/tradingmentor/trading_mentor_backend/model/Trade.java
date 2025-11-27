package com.tradingmentor.trading_mentor_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "trades")
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int tradeId;

    @Column(name = "buy_order_id")
    private int buyOrderId;

    @Column(name = "sell_order_id")
    private int sellOrderId;

    @Column(name = "buyer_id")
    private Integer buyerId;      // was Long

    @Column(name = "seller_id")
    private Integer sellerId;     // was Long

    private String symbol;

    private BigDecimal price;     // ✅ match Order.price (BigDecimal)

    private Integer quantity;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ---- getters ----
    public int getTradeId() { return tradeId; }
    public int getBuyOrderId() { return buyOrderId; }
    public int getSellOrderId() { return sellOrderId; }
    public Integer getBuyerId() { return buyerId; }
    public Integer getSellerId() { return sellerId; }
    public String getSymbol() { return symbol; }
    public BigDecimal getPrice() { return price; }
    public Integer getQuantity() { return quantity; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // ---- setters ----
    public void setBuyOrderId(int buyOrderId) { this.buyOrderId = buyOrderId; }
    public void setSellOrderId(int sellOrderId) { this.sellOrderId = sellOrderId; }
    public void setBuyerId(Integer buyerId) { this.buyerId = buyerId; }
    public void setSellerId(Integer sellerId) { this.sellerId = sellerId; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
