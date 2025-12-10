package com.tradingmentor.trading_mentor_backend.controller;

import com.tradingmentor.trading_mentor_backend.model.Position;
import com.tradingmentor.trading_mentor_backend.repository.PositionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for positions (current holdings of a user).
 *
 * This will be used by the frontend to show:
 * - "Your Portfolio"
 * - List of symbols, quantities, and avg prices for a user.
 */
@RestController
@RequestMapping("/api/positions")
@CrossOrigin(origins = "*")  // allow calls from frontend running on a different port
public class PositionController {

    private final PositionRepository positionRepository;

    // Constructor injection (Spring injects the PositionRepository bean)
    public PositionController(PositionRepository positionRepository) {
        this.positionRepository = positionRepository;
    }

    /**
     * Get all positions for a specific user.
     *
     * Example:
     *   GET /api/positions/user/1
     *
     * Returns JSON array with that user's holdings.
     */
    @GetMapping("/user/{userId}")
    public List<Position> getPositionsForUser(@PathVariable Integer userId) {
        // Repository method returns list of Position rows for that user
        return positionRepository.findByUserId(userId);
    }

    /**
     * (Optional) Get all positions for all users.
     * Useful for debugging or admin views.
     *
     * Example:
     *   GET /api/positions
     */
    @GetMapping
    public ResponseEntity<List<Position>> getAllPositions() {
        List<Position> positions = positionRepository.findAll();
        return ResponseEntity.ok(positions);
    }
}
