package com.tradingmentor.trading_mentor_backend.controller;

import com.tradingmentor.trading_mentor_backend.model.Order;
import com.tradingmentor.trading_mentor_backend.model.OrderStatus;
import com.tradingmentor.trading_mentor_backend.repository.OrderRepository;
import com.tradingmentor.trading_mentor_backend.repository.StockRepository;
import com.tradingmentor.trading_mentor_backend.Service.MatchingEngineService;  // <-- fixed import

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // Constructor injection: Spring will inject repositories + service here
    public OrderController(OrderRepository orderRepository,
                           StockRepository stockRepository,
                           MatchingEngineService matchingEngineService) {
        this.orderRepository = orderRepository;
        this.stockRepository = stockRepository;
        this.matchingEngineService = matchingEngineService;
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
     * Creates a new order and sends it to the matching engine.
     * Expected JSON body (example):
     *
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

        // 1) Validate side (must not be null)
        if (order.getSide() == null) {
            return ResponseEntity.badRequest()
                    .body("Error: side is required and must be BUY or SELL.");
        }

        // 2) Validate stock symbol against stock_master table
        boolean symbolExists = stockRepository
                .findBySymbol(order.getSymbol().toUpperCase())
                .isPresent();

        if (!symbolExists) {
            return ResponseEntity.badRequest()
                    .body("Error: Stock symbol '" + order.getSymbol() + "' is not valid.");
        }

        // 3) Set initial status and save order
        order.setStatus(OrderStatus.OPEN);  // initial state is OPEN
        Order savedOrder = orderRepository.save(order);

        // 4) Send the order to the matching engine so it can try to match it
        matchingEngineService.processNewOrder(savedOrder);

        // 5) Return the (possibly updated) order to the client
        return ResponseEntity.ok(savedOrder);
    }
}
