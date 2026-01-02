package com.tradingmentor.trading_mentor_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.model.Stock;
import com.tradingmentor.trading_mentor_backend.repository.StockRepository;

/**
 * REST API for exposing the list of tradable stocks to clients.
 *
 * Examples:
 *   GET /api/stocks         -> list all active stocks
 *   GET /api/stocks/AAPL    -> details for symbol "AAPL"
 */
@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "*")  // allow frontend (e.g. React on another port) to call these APIs
public class StocksController {

    private final StockRepository stockRepository;

    // Constructor injection: Spring will automatically inject StockRepository
    public StocksController(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    /**
     * Get all active stocks from stock_master.
     *
     * URL:
     *   GET /api/stocks
     *
     * This will be used by the frontend to show a dropdown or list
     * of stocks that the user can trade.
     */
    @GetMapping
    public ResponseEntity<List<Stock>> getAllActiveStocks() {
        List<Stock> stocks = stockRepository.findByIsActiveTrue();
        return ResponseEntity.ok(stocks);
    }

    /**
     * Get details for a single stock by symbol.
     *
     * URL:
     *   GET /api/stocks/{symbol}
     *
     * Example:
     *   GET /api/stocks/AAPL
     */
    @GetMapping("/{symbol}")
    public ResponseEntity<Stock> getStockBySymbol(@PathVariable String symbol) {
        return stockRepository.findBySymbol(symbol.toUpperCase())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

