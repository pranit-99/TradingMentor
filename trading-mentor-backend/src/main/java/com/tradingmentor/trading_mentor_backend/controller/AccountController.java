package com.tradingmentor.trading_mentor_backend.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.Service.AccountService;
import com.tradingmentor.trading_mentor_backend.dto.AccountCreationRequest;
import com.tradingmentor.trading_mentor_backend.dto.FundCreditRequest;
import com.tradingmentor.trading_mentor_backend.model.AccountMaster;
import com.tradingmentor.trading_mentor_backend.model.TradingAccount;
import com.tradingmentor.trading_mentor_backend.repository.AccountMasterRepository;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;
    private final AccountMasterRepository accountMasterRepository;

    public AccountController(AccountService accountService, AccountMasterRepository accountMasterRepository) {
        this.accountService = accountService;
        this.accountMasterRepository = accountMasterRepository;
    }

    @GetMapping
    public List<AccountMaster> getAllAccounts() {
        return accountMasterRepository.findAll();
    }

    @GetMapping("/{userId}")
    public AccountMaster getAccountByUserId(@PathVariable Long userId) {
        return accountMasterRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Account not found for userId: " + userId));
    }


    @PostMapping
    public ResponseEntity<TradingAccount> createAccount(
            @RequestBody AccountCreationRequest request) {

        TradingAccount account = accountService.createTradingAccount(request);
        return ResponseEntity.ok(account);
    }

    @PostMapping("/credit")
public ResponseEntity<?> creditFunds(@RequestBody FundCreditRequest req) {

    if (req.getUserId() == null) {
        return ResponseEntity.badRequest().body("userId is required");
    }
    if (req.getAmount() == null || req.getAmount().compareTo(new BigDecimal("0")) <= 0) {
        return ResponseEntity.badRequest().body("amount must be > 0");
    }

    AccountMaster account = accountMasterRepository
            .findByUserId(req.getUserId())
            .orElseThrow(() -> new IllegalStateException("No account found for userId=" + req.getUserId()));

    // cash_balance = cash_balance + amount
    account.setCashBalance(account.getCashBalance().add(req.getAmount()));

    accountMasterRepository.save(account);

    return ResponseEntity.ok(account);
}



}