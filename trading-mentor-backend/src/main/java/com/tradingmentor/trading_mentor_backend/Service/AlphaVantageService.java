package com.tradingmentor.trading_mentor_backend.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.tradingmentor.trading_mentor_backend.dto.GlobalQuoteResponse;

/**
 * Calls Alpha Vantage GLOBAL_QUOTE endpoint to fetch latest price
 * for a given stock symbol (e.g. "AAPL").
 */
@Service
public class AlphaVantageService {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String baseUrl;

    // values are read from application.properties
    public AlphaVantageService(RestTemplate restTemplate,
                               @Value("${alpha-vantage.api-key}") String apiKey,
                               @Value("${alpha-vantage.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    /**
     * Fetch latest price for a symbol using GLOBAL_QUOTE.
     *
     * @param symbol e.g. "AAPL"
     * @return QuoteResult with price, or null if fetch failed
     */
    public QuoteResult fetchLatestPrice(String symbol) {

        String url = String.format(
                "%s/query?function=GLOBAL_QUOTE&symbol=%s&apikey=%s",
                baseUrl,
                symbol,
                apiKey
        );

        GlobalQuoteResponse response =
                restTemplate.getForObject(url, GlobalQuoteResponse.class);

        if (response == null || response.getGlobalQuote() == null) {
            return null;
        }

        GlobalQuoteResponse.GlobalQuote quote = response.getGlobalQuote();

        if (quote.getPrice() == null || quote.getPrice().isEmpty()) {
            return null;
        }

        BigDecimal price = new BigDecimal(quote.getPrice());

        LocalDate latestDate = null;
        if (quote.getLatestTradingDay() != null && !quote.getLatestTradingDay().isEmpty()) {
            latestDate = LocalDate.parse(quote.getLatestTradingDay());
        }

        return new QuoteResult(quote.getSymbol(), price, latestDate);
    }

    /**
     * Small helper class to return clean data to our app.
     */
    public static class QuoteResult {

        private final String symbol;
        private final BigDecimal price;
        private final LocalDate latestTradingDay;

        public QuoteResult(String symbol, BigDecimal price, LocalDate latestTradingDay) {
            this.symbol = symbol;
            this.price = price;
            this.latestTradingDay = latestTradingDay;
        }

        public String getSymbol() {
            return symbol;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public LocalDate getLatestTradingDay() {
            return latestTradingDay;
        }
    }
}
