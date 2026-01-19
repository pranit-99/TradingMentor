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
    private final FinnhubQuoteService finnhubQuoteService;

    public StockPriceUpdateService(StockRepository stockRepository,
                                   FinnhubQuoteService finnhubQuoteService) {
        this.stockRepository = stockRepository;
        this.finnhubQuoteService = finnhubQuoteService;
    }

    @Transactional
    public void updateAllStockPrices() {
        System.out.println(" Scheduler started: Updating all stock prices...");

        List<Stock> stocks = stockRepository.findByIsActiveTrue();

        for (Stock stock : stocks) {
            String symbol = stock.getSymbol();
            if (symbol == null || symbol.isBlank()) continue;

            try {
                var price = finnhubQuoteService.fetchCurrentPrice(symbol);
                if (price == null) continue;

                stock.setLastPrice(price);
                stock.setLastPriceCurrency("USD");
                stock.setLastPriceUpdatedAt(LocalDateTime.now());
                stockRepository.save(stock);

                // small delay (optional)
                Thread.sleep(1200);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        System.out.println(" Scheduler finished: Stock prices updated.");
    }
}
