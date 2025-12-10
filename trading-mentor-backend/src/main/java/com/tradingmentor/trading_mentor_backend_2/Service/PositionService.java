package com.tradingmentor.trading_mentor_backend.Service;

import com.tradingmentor.trading_mentor_backend.model.Position;
import com.tradingmentor.trading_mentor_backend.model.Side;
import com.tradingmentor.trading_mentor_backend.model.UserTrade;
import com.tradingmentor.trading_mentor_backend.repository.PositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Business logic for updating positions when trades are executed.
 * This service is called from TradeController after a trade is saved.
 */
@Service
public class PositionService {

    private final PositionRepository positionRepository;

    public PositionService(PositionRepository positionRepository) {
        this.positionRepository = positionRepository;
    }

    /**
     * Apply a trade to the user's position.
     *
     * - For BUY:
     *      newQuantity = oldQuantity + tradeQuantity
     *      newAvgPrice = (oldCost + tradeCost) / newQuantity
     *
     * - For SELL:
     *      newQuantity = oldQuantity - tradeQuantity
     *      (we keep avgPrice as is for remaining shares)
     *
     * This method is @Transactional so that DB changes are atomic.
     */
    @Transactional
    public Position applyTrade(UserTrade trade) {
        Integer userId = trade.getUserId();
        String symbol = trade.getSymbol();

        // 1. Find existing position for user + symbol (if any)
        Optional<Position> existingOpt =
                positionRepository.findByUserIdAndSymbol(userId, symbol);

        Position position;

        if (existingOpt.isPresent()) {
            position = existingOpt.get();
        } else {
            // No position yet -> create a new one with 0 quantity & 0 avgPrice
            position = new Position();
            position.setUserId(userId);
            position.setSymbol(symbol);
            position.setQuantity(0);
            position.setAvgPrice(BigDecimal.ZERO);
        }

        int oldQty = position.getQuantity();
        BigDecimal oldAvg = position.getAvgPrice();
        int tradeQty = trade.getQuantity();
        BigDecimal tradePrice = trade.getPrice();

        if (trade.getSide() == Side.BUY) {
            // BUY trade: increase quantity and recompute average price

            int newQty = oldQty + tradeQty;

            // oldCost = oldQty * oldAvg
            BigDecimal oldCost = oldAvg.multiply(BigDecimal.valueOf(oldQty));

            // tradeCost = tradeQty * tradePrice
            BigDecimal tradeCost = tradePrice.multiply(BigDecimal.valueOf(tradeQty));

            // totalCost = oldCost + tradeCost
            BigDecimal totalCost = oldCost.add(tradeCost);

            // newAvg = totalCost / newQty
            BigDecimal newAvg = BigDecimal.ZERO;
            if (newQty > 0) {
                newAvg = totalCost
                        .divide(BigDecimal.valueOf(newQty), 2, RoundingMode.HALF_UP);
            }

            position.setQuantity(newQty);
            position.setAvgPrice(newAvg);

        } else if (trade.getSide() == Side.SELL) {
            // SELL trade: decrease quantity
            int newQty = oldQty - tradeQty;

            // In a simple model we keep the same avgPrice for remaining shares.
            // (Real PnL calculation can be added later.)
            if (newQty < 0) {
                // In a real system you would throw an error.
                // For now, we avoid negative quantity by setting to 0.
                newQty = 0;
            }

            position.setQuantity(newQty);
            // avgPrice unchanged for remaining quantity
        }

        // Save updated (or new) position to DB
        return positionRepository.save(position);
    }
}
