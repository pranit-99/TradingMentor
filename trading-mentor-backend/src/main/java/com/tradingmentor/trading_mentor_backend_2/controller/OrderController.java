package com.tradingmentor.trading_mentor_backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.Service.MatchingEngineService;
import com.tradingmentor.trading_mentor_backend.model.Order;
import com.tradingmentor.trading_mentor_backend.model.OrderStatus;
import com.tradingmentor.trading_mentor_backend.model.Position;
import com.tradingmentor.trading_mentor_backend.model.Side;
import com.tradingmentor.trading_mentor_backend.model.TradingAccount;
import com.tradingmentor.trading_mentor_backend.repository.OrderRepository;
import com.tradingmentor.trading_mentor_backend.repository.PositionRepository;
import com.tradingmentor.trading_mentor_backend.repository.StockRepository;
import com.tradingmentor.trading_mentor_backend.repository.TradingAccountRepository;

/**
 * Controller for handling order-related REST APIs.
 *
 * Base URL: /api/orders
 */
@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")  // allow frontend calls (React etc.)
public class OrderController {

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;
    private final MatchingEngineService matchingEngineService;
    private final TradingAccountRepository tradingAccountRepository;
    private final PositionRepository positionRepository;

    // Constructor injection: Spring will inject the repositories here
    public OrderController(OrderRepository orderRepository,
                           StockRepository stockRepository,
                           MatchingEngineService matchingEngineService,
                           TradingAccountRepository tradingAccountRepository,
                           PositionRepository positionRepository) {
        this.orderRepository = orderRepository;
        this.stockRepository = stockRepository;
        this.matchingEngineService = matchingEngineService;
        this.tradingAccountRepository = tradingAccountRepository;
        this.positionRepository = positionRepository;
    }

    /**
     * GET /api/orders
     *
     * Returns all orders in the system.
     * Useful for debugging / admin view.
     */
    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    /**
     * POST /api/orders
     *
     * Creates a new order.
     * Expected JSON body (example):
     * {
     *   "userId": 1,
     *   "symbol": "AAPL",
     *   "side": "BUY",
     *   "price": 150.0,
     *   "quantity": 10
     * }
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {

        // 0) Basic null checks
        if (order.getUserId() == null) {
            return ResponseEntity.badRequest().body("Error: userId is required.");
        }
        if (order.getSide() == null) {
            return ResponseEntity.badRequest().body("Error: side is required and must be BUY or SELL.");
        }
        if (order.getSymbol() == null || order.getSymbol().isBlank()) {
            return ResponseEntity.badRequest().body("Error: symbol is required.");
        }
        if (order.getPrice() == null || order.getQuantity() == null || order.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body("Error: price and quantity must be provided and valid.");
        }

        // 1) Validate stock symbol against stock_master table
        boolean symbolExists = stockRepository
                .findBySymbol(order.getSymbol().toUpperCase())
                .isPresent();

        if (!symbolExists) {
            return ResponseEntity.badRequest()
                    .body("Error: Stock symbol '" + order.getSymbol() + "' is not valid.");
        }

        // 2) Load user's trading account
        //    (Right now, we assume exactly 1 trading account per user)
        Optional<TradingAccount> accountOpt =
                tradingAccountRepository.findByUserId(order.getUserId());

        if (accountOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Error: No trading account found for userId=" + order.getUserId()
                            + ". Please create a trading account first.");
        }

        TradingAccount account = accountOpt.get();

        if(order.getSide() == Side.BUY){
            Integer userID = order.getUserId();

            TradingAccount accounts = tradingAccountRepository
            .findByUserId(userID)
            .orElseThrow(() -> new IllegalStateException("No Trading Account for userID=" +userID));

            BigDecimal orderValue = order.getPrice()
            .multiply(BigDecimal.valueOf(order.getQuantity()));

            BigDecimal cashBalance =accounts.getCashBalance();
            BigDecimal reservedCash = account.getReservedCash();

            if (cashBalance == null) cashBalance = BigDecimal.ZERO;
        if (reservedCash == null) reservedCash = BigDecimal.ZERO;
        
            BigDecimal availableCash = cashBalance.subtract(reservedCash);

            if (availableCash.compareTo(orderValue) < 0) {
                // not enough free funds
                return ResponseEntity.badRequest()
                        .body("Insufficient funds. Available: " + availableCash
                              + ", required: " + orderValue);
            }
            accounts.setReservedCash(reservedCash.add(orderValue));
            tradingAccountRepository.save(account);
        }

        // 3) Pre-checks based on side (BUY or SELL)
        if (order.getSide() == Side.BUY) {
            String error = handleBuyPreChecks(order, account);
            if (error != null) {
                return ResponseEntity.badRequest().body(error);
            }
            // if success, account has updated reservedCash and is saved inside method

        } else if (order.getSide() == Side.SELL) {
            String error = handleSellPreChecks(order);
            if (error != null) {
                return ResponseEntity.badRequest().body(error);
            }
            // For SELL we are not reserving shares (simple version),
            // just checking that user has enough position.
        }
        if (order.getSide() == Side.SELL) {

            Position pos = positionRepository
                    .findByUserIdAndSymbol(order.getUserId(), order.getSymbol())
                    .orElse(null);
        
            if (pos == null || pos.getQuantity() < order.getQuantity()) {
                return ResponseEntity.badRequest()
                        .body("Error: Not enough stock to sell.");
            }
        
            // OPTIONAL: reserve quantity (soft block)
            //pos.setReservedQuantity(
                    //pos.getReservedQuantity() + order.getQuantity()
            //);
        
            positionRepository.save(pos);
        }
        

        // 4) Save order to DB with initial status OPEN
        order.setStatus(OrderStatus.OPEN);  // make sure initial status is OPEN
        Order savedOrder = orderRepository.save(order);

        // 5) Run matching engine (this may update orders, positions, transactions later)
        matchingEngineService.processNewOrder(savedOrder);

        return ResponseEntity.ok(savedOrder);
    }



    /**
     * BUY pre-checks:
     * - Check that user has enough available cash in trading_accounts.
     * - Reserve the required cash (increase reservedCash).
     * - Persist TradingAccount changes.
     *
     * @return null if OK, or error message string if something is wrong.
     */
    private String handleBuyPreChecks(Order order, TradingAccount account) {

        BigDecimal price = order.getPrice();
        int qty = order.getQuantity();

        // orderValue = price * quantity
        BigDecimal orderValue = price.multiply(BigDecimal.valueOf(qty));

        // availableCash = cashBalance - reservedCash
        BigDecimal cashBalance = account.getCashBalance() != null
                ? account.getCashBalance()
                : BigDecimal.ZERO;

        BigDecimal reservedCash = account.getReservedCash() != null
                ? account.getReservedCash()
                : BigDecimal.ZERO;

        BigDecimal availableCash = cashBalance.subtract(reservedCash);

        // If not enough money, reject
        if (availableCash.compareTo(orderValue) < 0) {
            return "Insufficient funds. Required: " + orderValue
                    + ", Available: " + availableCash;
        }

        // Enough cash → reserve it
        BigDecimal newReserved = reservedCash.add(orderValue);
        account.setReservedCash(newReserved);

        // Save updated account
        tradingAccountRepository.save(account);

        return null; // success
    }

    /**
     * SELL pre-checks:
     * - Check that user has enough quantity in positions table.
     *   (For simplicity, we are not reserving shares here, only checking.)
     *
     * @return null if OK, or error message string if something is wrong.
     */
    private String handleSellPreChecks(Order order) {

        Integer userId = order.getUserId();
        String symbol = order.getSymbol().toUpperCase();
        int requestQty = order.getQuantity();

        // Find existing position for this user + symbol
        Optional<Position> positionOpt =
                positionRepository.findByUserIdAndSymbol(userId, symbol);

        if (positionOpt.isEmpty()) {
            return "You do not hold any position in " + symbol + ". Cannot SELL.";
        }

        Position position = positionOpt.get();

        if (position.getQuantity() == null || position.getQuantity() < requestQty) {
            return "Insufficient quantity to sell. You hold: "
                    + position.getQuantity() + ", trying to sell: " + requestQty;
        }

        // If you want, you can also introduce "reservedQuantity" in positions,
        // but for now we only check and let the matching engine + position update
        // tighten it after trade execution.

        return null; // success
    }
}
