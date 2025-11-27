package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.Order;
import com.tradingmentor.trading_mentor_backend.model.OrderStatus;
import com.tradingmentor.trading_mentor_backend.model.Side;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // For a new BUY order: find best SELL orders to match
    List<Order> findBySymbolAndSideAndStatusOrderByPriceAscCreatedAtAsc(
            String symbol,
            Side side,
            OrderStatus status
    );

    // For a new SELL order: find best BUY orders to match
    List<Order> findBySymbolAndSideAndStatusOrderByPriceDescCreatedAtAsc(
            String symbol,
            Side side,
            OrderStatus status
    );
}
