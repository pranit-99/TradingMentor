package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.UserTrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserTradeRepository extends JpaRepository<UserTrade, Integer> {
}
