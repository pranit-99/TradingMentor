package com.tradingmentor.trading_mentor_backend.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.model.Transact;
import com.tradingmentor.trading_mentor_backend.repository.TransactRepository;


/**
 * TransactController
 *
 * Why it exists:
 * ✅ Lets frontend show "Recent Activity" mini-ledger
 * ✅ Allows backend to record credit/debit events (trades, add funds, fees)
 */
@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactController {

    private final TransactRepository transactRepository;

    public TransactController(TransactRepository transactRepository) {
        this.transactRepository = transactRepository;
    }

    /**
     * GET /api/transactions/user/{userId}?limit=5
     * Returns last N transactions for mini-ledger.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Transact>> getRecentByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        if (limit <= 0) limit = 5;
        if (limit > 50) limit = 50; // safety

        List<Transact> list =
                transactRepository.findByUserIdOrderByTransactionDateDesc(userId, PageRequest.of(0, limit));

        return ResponseEntity.ok(list);
    }

    /**
     * POST /api/transactions
     * Allows creating a transaction manually (testing or admin usage).
     */
    @PostMapping
    public ResponseEntity<Transact> create(@RequestBody Transact transact) {
        // minimal validation
        if (transact.getUserId() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (transact.getAmount() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (transact.getCreditDebitFlag() == null || transact.getCreditDebitFlag().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Transact saved = transactRepository.save(transact);
        return ResponseEntity.ok(saved);
    }

    // GET /api/transactions/ledger?userId=4&from=2025-12-01&to=2025-12-22
@GetMapping("/ledger")
public ResponseEntity<List<Transact>> getLedger(
        @RequestParam Integer userId,
        @RequestParam String from,
        @RequestParam String to
) {
    LocalDate fromDate = LocalDate.parse(from.trim()); // yyyy-MM-dd
    LocalDate toDate = LocalDate.parse(to.trim());

    LocalDateTime fromDateTime = fromDate.atStartOfDay();
    LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX); // 23:59:59.999999999

    List<Transact> list = transactRepository
            .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                    userId, fromDateTime, toDateTime
            );

    return ResponseEntity.ok(list);
}

}
