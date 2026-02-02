package com.tradingmentor.trading_mentor_backend.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tradingmentor.trading_mentor_backend.dto.AccountCreationRequest;
import com.tradingmentor.trading_mentor_backend.model.TradingAccount;
import com.tradingmentor.trading_mentor_backend.model.Transact;
import com.tradingmentor.trading_mentor_backend.repository.TradingAccountRepository;
import com.tradingmentor.trading_mentor_backend.repository.TransactRepository;

@Service
public class AccountService {

    private final TradingAccountRepository tradingAccountRepository;
    private final TransactRepository transactRepository;

    public AccountService(TradingAccountRepository tradingAccountRepository,
                          TransactRepository transactRepository) {
        this.tradingAccountRepository = tradingAccountRepository;
        this.transactRepository = transactRepository;
    }

    @Transactional
    public TradingAccount createTradingAccount(AccountCreationRequest request) {

        LocalDateTime now = LocalDateTime.now();

        // If account already exists for this user, you can either throw or return existing
        tradingAccountRepository.findByUserId(request.getUserId())
                .ifPresent(acc -> {
                    throw new IllegalStateException("Trading account already exists for this user");
                });

        TradingAccount account = new TradingAccount();

        // Link to user
        account.setUserId(request.getUserId());

        // Copy basic details
        account.setFirstName(request.getFirstName());
        account.setLastName(request.getLastName());
        account.setEmail(request.getEmail());
        account.setPhone(request.getPhone());
        account.setBirthdate(request.getBirthdate());
        account.setAddressLine1(request.getAddressLine1());
        account.setCity(request.getCity());
        account.setCountry(request.getCountry());
        account.setState(request.getState());
        account.setZip(request.getZip());
        account.setJobTitle(request.getJobTitle());
        account.setIncomeRange(request.getIncomeRange());
        //Initial Virtual Credit
        account.setCashBalance(new BigDecimal("500.00"));
        account.setReservedCash(BigDecimal.ZERO);

        // Generate unique account number
        account.setAccountNumber(generateAccountNumber());

        // Timestamps
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());

        //return tradingAccountRepository.save(account);
        TradingAccount saved = tradingAccountRepository.save(account);

        Transact t = new Transact();
        t.setUserId(saved.getUserId());
        t.setAccountNumber(saved.getAccountNumber());
        t.setSecurityType("C");         // CASH (your decision ✅)
        t.setInstrumentType("CASH");
        t.setCreditDebitFlag("C");      // credit
        t.setAmount(new BigDecimal("500.00"));
        t.setTransactionType("SIGNUP_BONUS"); // or "DEPOSIT"
        t.setDescription("Initial virtual cash credited on account creation");
        t.setRemarks("Auto Credit");
        t.setSymbol(null);
        t.setBuySellFlag(null);
        t.setOrderId(null);
        t.setTradeId(null);
        t.setTransactionDate(now);       // ✅ ledger-friendly timestamp
        t.setTradeDate(now);

        transactRepository.save(t);

        return saved;
    }

    private String generateAccountNumber() {
        Long randomPart = ThreadLocalRandom.current().nextLong(10000000L, 99999999L);
        return "TM-" + randomPart;
    }
}
