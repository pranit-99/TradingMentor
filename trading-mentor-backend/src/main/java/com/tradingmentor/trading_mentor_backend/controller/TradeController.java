package com.tradingmentor.trading_mentor_backend.controller;

import com.tradingmentor.trading_mentor_backend.model.UserTrade;
import com.tradingmentor.trading_mentor_backend.model.Side;
import com.tradingmentor.trading_mentor_backend.repository.UserTradeRepository;
import com.tradingmentor.trading_mentor_backend.Service.PositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST API for executed trades.
 * - POST /api/trades : create a new trade
 * - GET  /api/trades : list all trades
 */
@RestController
@RequestMapping("/api/trades")
@CrossOrigin(origins = "*")
public class TradeController {

    private final UserTradeRepository userTradeRepository;
    private final PositionService positionService;  // to update holdings

    public TradeController(UserTradeRepository userTradeRepository,
                           PositionService positionService) {
        this.userTradeRepository = userTradeRepository;
        this.positionService = positionService;
    }

    /**
     * DTO that represents the JSON body for creating a trade.
     * This is separate from the entity for clarity.
     */
    public static class TradeRequest {
        private Integer orderId;
        private Integer userId;
        private String symbol;
        private String side;   // "BUY" or "SELL"
        private BigDecimal price;
        private Integer quantity;

        public TradeRequest() {
        }

        public Integer getOrderId() {
            return orderId;
        }

        public void setOrderId(Integer orderId) {
            this.orderId = orderId;
        }

        public Integer getUserId() {
            return userId;
        }

        public void setUserId(Integer userId) {
            this.userId = userId;
        }

        public String getSymbol() {
            return symbol;
        }

        public void setSymbol(String symbol) {
            this.symbol = symbol;
        }

        public String getSide() {
            return side;
        }

        public void setSide(String side) {
            this.side = side;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }

    @PostMapping
    public ResponseEntity<UserTrade> createTrade(@RequestBody TradeRequest req) {
        // 1. Map incoming JSON to UserTrade entity
        UserTrade t = new UserTrade();
        t.setOrderId(req.getOrderId());
        t.setUserId(req.getUserId());
        t.setSymbol(req.getSymbol());
        t.setSide(Side.valueOf(req.getSide().toUpperCase()));
        t.setPrice(req.getPrice());
        t.setQuantity(req.getQuantity());

        // 2. Save the trade to the DB
        UserTrade saved = userTradeRepository.save(t);

        // 3. Update the user's position based on this trade
        positionService.applyTrade(saved);

        // 4. Return the saved trade as response
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<UserTrade>> getAllTrades() {
        return ResponseEntity.ok(userTradeRepository.findAll());
    }
}
