package com.tradingmentor.trading_mentor_backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Transact
 * Stores ledger-style transactions for reporting & history:
 * - Fund credit/debit
 * - Trade debit/credit
 * - Fees/Tax entries
 *
 * This is useful for:
 * ✅ Funds mini-ledger UI
 * ✅ Audit trail
 * ✅ Future reports (P&L, brokerage, taxes)
 */
@Entity
@Table(name = "transactions")
public class Transact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    // Optional but recommended:
    @Column(name = "account_number")
    private String accountNumber;

    // E for equity, D for derivatives, etc.
    @Column(name = "instrument_type")
    private String instrumentType; // e.g. "E"

    @Column(name="security_type", nullable=false)
     private String securityType = "E";


    @Column(name = "symbol")
    private String symbol; // e.g. "AAPL" (can be null for cash-only txns)

    // C = Credit, D = Debit
    @Column(name = "credit_debit_flag", nullable = false, length = 1)
    private String creditDebitFlag;

    @Column(name = "buy_sell_flag" )
    private String buySellFlag;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_type")
    private String transactionType; // e.g. "TRADE", "ADD_FUNDS", "BROKERAGE", "TAX"

    @Column(name = "trade_id")
    private Long tradeId; // link if you have a trade table later

    @Column(name = "order_id")
    private Long orderId; // link to orders table if needed

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "description")
    private String description;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate = LocalDateTime.now();

    @Column(name = "trade_date")
    private LocalDateTime tradeDate = LocalDateTime.now();

    @Column(name = "settlement_date")
    private LocalDateTime settlementDate; // optional for future (T/T+1)

    // ---------- getters/setters ----------
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getInstrumentType() { return instrumentType; }
    public void setInstrumentType(String instrumentType) { this.instrumentType = instrumentType; }


    public String getSecurityType() { return securityType;}
    public void setSecurityType(String securityType){this.securityType = securityType;}

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getCreditDebitFlag() { return creditDebitFlag; }
    public void setCreditDebitFlag(String creditDebitFlag) { this.creditDebitFlag = creditDebitFlag; }

    public String getBuySellFlag(){ return buySellFlag;}
    public void setBuySellFlag(String buySellFlag){this.buySellFlag = buySellFlag;}

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public Long getTradeId() { return tradeId; }
    public void setTradeId(Long tradeId) { this.tradeId = tradeId; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDateTime transactionDate) { this.transactionDate = transactionDate; }

    public LocalDateTime getTradeDate(){return tradeDate;}
    public void setTradeDate(LocalDateTime tradeDate){this.tradeDate = tradeDate;}

    public LocalDateTime getSettlementDate() { return settlementDate; }
    public void setSettlementDate(LocalDateTime settlementDate) { this.settlementDate = settlementDate; }
}
