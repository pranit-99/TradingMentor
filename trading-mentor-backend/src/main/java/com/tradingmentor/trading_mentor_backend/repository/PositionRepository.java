package com.tradingmentor.trading_mentor_backend.repository;

import com.tradingmentor.trading_mentor_backend.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for reading/writing Position rows in the "positions" table.
 */
@Repository
public interface PositionRepository extends JpaRepository<Position, Integer> {

    // Get all positions for a given user (used to display portfolio)
    List<Position> findByUserId(Integer userId);

    // Get a single position for user + symbol (for updating holdings)
    Optional<Position> findByUserIdAndSymbol(Integer userId, String symbol);
}
