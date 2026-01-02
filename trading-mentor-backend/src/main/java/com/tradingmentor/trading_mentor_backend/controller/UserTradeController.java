package com.tradingmentor.trading_mentor_backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.model.UserTrade;
import com.tradingmentor.trading_mentor_backend.repository.UserTradeRepository;

/**
 * REST controller for user trade history.
 *
 * Base URL: /api/user-trades
 */
@RestController
@RequestMapping("/api/user-trades")
@CrossOrigin(origins = "*")   // allow frontend (React etc.) to call this API
public class UserTradeController {

    private final UserTradeRepository userTradeRepository;

    // Constructor injection – Spring injects the repository
    public UserTradeController(UserTradeRepository userTradeRepository) {
        this.userTradeRepository = userTradeRepository;
    }

    /**
     * GET /api/user-trades/{userId}
     *
     * Returns all trades for the given user.
     * Later we can add filters (by symbol, date range, etc.)
     */
    @GetMapping("/{userId}")
    public List<UserTrade> getTradesForUser(@PathVariable Long userId) {
        // Make sure you have a method like this in UserTradeRepository:
        // List<UserTrade> findByUserIdOrderByTradeTimeDesc(Long userId);
        return userTradeRepository.findByUserIdOrderByTradeTimeDesc(userId);
    }
}
