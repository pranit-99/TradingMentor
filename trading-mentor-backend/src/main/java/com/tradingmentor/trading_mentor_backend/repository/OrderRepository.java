package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
}
