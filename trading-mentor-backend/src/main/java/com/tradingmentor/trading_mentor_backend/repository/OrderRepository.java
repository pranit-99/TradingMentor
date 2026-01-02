package com.tradingmentor.trading_mentor_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tradingmentor.trading_mentor_backend.model.Order;
import com.tradingmentor.trading_mentor_backend.model.OrderStatus;
import com.tradingmentor.trading_mentor_backend.model.Side;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // For a new BUY order: find best SELL orders to match
    List<Order> findBySymbolAndSideAndStatusInOrderByPriceAscCreatedAtAsc(
        String symbol,
        Side side,
        List<OrderStatus> statuses
    );
    

    // For a new SELL order: find best BUY orders to match
    List<Order> findBySymbolAndSideAndStatusInOrderByPriceDescCreatedAtAsc(
            String symbol,
            Side side,
            List<OrderStatus> statuses
    );
}
