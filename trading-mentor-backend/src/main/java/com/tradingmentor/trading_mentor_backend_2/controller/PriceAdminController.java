package com.tradingmentor.trading_mentor_backend.controller;

import com.tradingmentor.trading_mentor_backend.Service.StockPriceUpdateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin endpoints for managing stock prices.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class PriceAdminController {

    private final StockPriceUpdateService stockPriceUpdateService;

    public PriceAdminController(StockPriceUpdateService stockPriceUpdateService) {
        this.stockPriceUpdateService = stockPriceUpdateService;
    }

    /**
     * POST /api/admin/refresh-prices
     *
     * When called, it fetches latest price for each stock in stock_master
     * and updates the table.
     */
    @PostMapping("/refresh-prices")
    public ResponseEntity<String> refreshPrices() {
        stockPriceUpdateService.updateAllStockPrices();
        return ResponseEntity.ok("Stock prices refreshed from Alpha Vantage.");
    }
}
