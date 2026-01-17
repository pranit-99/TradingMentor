package com.tradingmentor.trading_mentor_backend.Service;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;


@Service
public class FinnhubQuoteService {

    @Value("${FINNHUB_API_KEY:}")
    private String finnhubApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public BigDecimal fetchCurrentPrice(String symbol){
        if(finnhubApiKey == null || finnhubApiKey.trim().isEmpty()){
            throw new RuntimeException("FINNHUB_API_KEY is missing in environment variables");
        }

        String url = UriComponentsBuilder
        .fromUriString("https://finnhub.io/api/v1/quote")
        .queryParam("symbol", symbol)
        .queryParam("token", finnhubApiKey)
        .toUriString();

        @SuppressWarnings("unchecked")
        Map<String, Object> json = restTemplate.getForObject(url, Map.class);

        // Finnhub returns: { "c": currentPrice, ... }
        Object c = (json == null) ? null : json.get("c");
        if (c == null) return null;

        return new BigDecimal(String.valueOf(c));
    }
}
