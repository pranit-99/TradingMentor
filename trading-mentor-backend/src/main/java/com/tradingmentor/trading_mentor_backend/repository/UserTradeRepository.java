package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.UserTrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserTradeRepository extends JpaRepository<UserTrade, Integer> {
    List<UserTrade> findByUserIdOrderByTradeTimeDesc(Long userId);
}
