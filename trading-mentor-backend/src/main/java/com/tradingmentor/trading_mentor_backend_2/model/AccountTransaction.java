package com.tradingmentor.trading_mentor_backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * transactions
 *
 * Cash / funds ledger for trading accounts.
 * Each row is a credit or debit against a trading_account.
 */
@Entity
@Table(name = "transactions")
public class AccountTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "trading_account_id", nullable = false)
    private Long tradingAccountId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "symbol", length = 20)
    private String symbol; // AAPL, MSFT; null for pure cash events

    @Column(name = "security_type", nullable = false, length = 1)
    private String securityType; 
    // 'E' = Equity, 'M' = Mutual Fund, 'C' = Commodity, 'F' = pure Funds

    @Column(name = "credit_debit_flag", nullable = false, length = 1)
    private String creditDebitFlag; 
    // 'C' = Credit (money added), 'D' = Debit (money removed)

    @Column(name = "amount", nullable = false)
    private BigDecimal amount; // always positive

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "related_order_id")
    private Long relatedOrderId;

    @Column(name = "related_trade_id")
    private Long relatedTradeId;

    @Column(name = "trade_date", nullable = false)
    private LocalDateTime tradeDate;

    @Column(name = "settlement_date")
    private LocalDateTime settlementDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public AccountTransaction() {
        // default constructor
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.tradeDate == null) {
            this.tradeDate = this.createdAt;
        }
        if (this.settlementDate == null) {
            // In real markets T+2/T+1; here we can use same day for now
            this.settlementDate = this.tradeDate;
        }
    }

    // ===== Getters & Setters =====

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getTradingAccountId() {
        return tradingAccountId;
    }

    public void setTradingAccountId(Long tradingAccountId) {
        this.tradingAccountId = tradingAccountId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getSecurityType() {
        return securityType;
    }

    public void setSecurityType(String securityType) {
        this.securityType = securityType;
    }

    public String getCreditDebitFlag() {
        return creditDebitFlag;
    }

    public void setCreditDebitFlag(String creditDebitFlag) {
        this.creditDebitFlag = creditDebitFlag;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getRelatedOrderId() {
        return relatedOrderId;
    }

    public void setRelatedOrderId(Long relatedOrderId) {
        this.relatedOrderId = relatedOrderId;
    }

    public Long getRelatedTradeId() {
        return relatedTradeId;
    }

    public void setRelatedTradeId(Long relatedTradeId) {
        this.relatedTradeId = relatedTradeId;
    }

    public LocalDateTime getTradeDate() {
        return tradeDate;
    }

    public void setTradeDate(LocalDateTime tradeDate) {
        this.tradeDate = tradeDate;
    }

    public LocalDateTime getSettlementDate() {
        return settlementDate;
    }

    public void setSettlementDate(LocalDateTime settlementDate) {
        this.settlementDate = settlementDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
