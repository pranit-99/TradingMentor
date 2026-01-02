package com.tradingmentor.trading_mentor_backend.Service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tradingmentor.trading_mentor_backend.model.Stock;
import com.tradingmentor.trading_mentor_backend.repository.StockRepository;

/**
 * Updates stock_master prices using Alpha Vantage data.
 */
@Service
public class StockPriceUpdateService {

    private final StockRepository stockRepository;
    private final AlphaVantageService alphaVantageService;

    public StockPriceUpdateService(StockRepository stockRepository,
                                   AlphaVantageService alphaVantageService) {
        this.stockRepository = stockRepository;
        this.alphaVantageService = alphaVantageService;
    }

    /**
     * Fetch latest prices for ALL stocks in stock_master and update them.
     * Be careful with free API limits: avoid too many symbols.
     */
    @Transactional
    public void updateAllStockPrices() {

        // You can later change this to "findByIsActiveTrue()" if you add that method.
        List<Stock> stocks = stockRepository.findAll();

        for (Stock stock : stocks) {

            String symbol = stock.getSymbol();
            if (symbol == null || symbol.isBlank()) {
                continue;
            }

            AlphaVantageService.QuoteResult quote =
                    alphaVantageService.fetchLatestPrice(symbol);

            if (quote == null) {
                // Could not fetch quote for this symbol, skip it.
                continue;
            }

            // Update fields in entity
            stock.setLastPrice(quote.getPrice());
            stock.setLastPriceCurrency("USD");  // assuming US stocks
            stock.setLastPriceUpdatedAt(LocalDateTime.now());

            stockRepository.save(stock);

            // Respect Alpha Vantage free tier limits: small delay between calls
            try {
                Thread.sleep(4000); // 4 seconds between each symbol
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
