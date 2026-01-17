package com.tradingmentor.trading_mentor_backend.Service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class StockPriceScheduler {

    private final StockPriceUpdateService stockPriceUpdateService;

    public StockPriceScheduler(StockPriceUpdateService stockPriceUpdateService) {
        this.stockPriceUpdateService = stockPriceUpdateService;
    }

    // every 5 minutes
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void refreshPrices() {
        stockPriceUpdateService.updateAllStockPrices();
    }
}