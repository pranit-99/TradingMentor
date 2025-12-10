package com.tradingmentor.trading_mentor_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.Service.AccountService;
import com.tradingmentor.trading_mentor_backend.dto.AccountCreationRequest;
import com.tradingmentor.trading_mentor_backend.model.TradingAccount;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<TradingAccount> createAccount(
            @RequestBody AccountCreationRequest request) {

        TradingAccount account = accountService.createTradingAccount(request);
        return ResponseEntity.ok(account);
    }
}
