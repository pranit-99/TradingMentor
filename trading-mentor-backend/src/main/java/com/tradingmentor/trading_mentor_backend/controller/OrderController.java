package com.tradingmentor.trading_mentor_backend.controller;

import com.tradingmentor.trading_mentor_backend.model.Order;
import com.tradingmentor.trading_mentor_backend.model.OrderStatus;
import com.tradingmentor.trading_mentor_backend.model.Side;
import com.tradingmentor.trading_mentor_backend.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // Simple DTO (inner class for now)
    public static class OrderRequest {
        public Integer userId;
        public String symbol;
        public String side;
        public BigDecimal price;
        public Integer quantity;
    }

    @PostMapping
    public ResponseEntity<Order> placeOrder(@RequestBody OrderRequest req) {
        Order o = new Order();
        o.setUserId(req.userId);
        o.setSymbol(req.symbol);
        o.setSide(Side.valueOf(req.side.toUpperCase()));
        o.setPrice(req.price);
        o.setQuantity(req.quantity);
        o.setStatus(OrderStatus.OPEN);

        Order saved = orderRepository.save(o);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }
}
