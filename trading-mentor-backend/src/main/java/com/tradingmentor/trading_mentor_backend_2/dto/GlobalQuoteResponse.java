package com.tradingmentor.trading_mentor_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Maps the JSON from Alpha Vantage "GLOBAL_QUOTE" endpoint
 * into a simple Java object.
 */
public class GlobalQuoteResponse {

    @JsonProperty("Global Quote")
    private GlobalQuote globalQuote;

    public GlobalQuote getGlobalQuote() {
        return globalQuote;
    }

    public void setGlobalQuote(GlobalQuote globalQuote) {
        this.globalQuote = globalQuote;
    }

    public static class GlobalQuote {

        @JsonProperty("01. symbol")
        private String symbol;

        @JsonProperty("05. price")
        private String price;

        @JsonProperty("07. latest trading day")
        private String latestTradingDay;

        // getters & setters

        public String getSymbol() {
            return symbol;
        }

        public void setSymbol(String symbol) {
            this.symbol = symbol;
        }

        public String getPrice() {
            return price;
        }

        public void setPrice(String price) {
            this.price = price;
        }

        public String getLatestTradingDay() {
            return latestTradingDay;
        }

        public void setLatestTradingDay(String latestTradingDay) {
            this.latestTradingDay = latestTradingDay;
        }
    }
}
