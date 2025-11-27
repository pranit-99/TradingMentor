package com.tradingmentor.trading_mentor_backend.Service;

import com.tradingmentor.trading_mentor_backend.model.Order;
import com.tradingmentor.trading_mentor_backend.model.OrderStatus;
import com.tradingmentor.trading_mentor_backend.model.Side;
import com.tradingmentor.trading_mentor_backend.model.Trade;
import com.tradingmentor.trading_mentor_backend.repository.OrderRepository;
import com.tradingmentor.trading_mentor_backend.repository.PositionRepository;
import com.tradingmentor.trading_mentor_backend.repository.TradeRepository;
import com.tradingmentor.trading_mentor_backend.model.Position;
import java.math.RoundingMode;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tradingmentor.trading_mentor_backend.model.UserTrade;
import com.tradingmentor.trading_mentor_backend.repository.UserTradeRepository;

import java.util.List;
import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * MatchingEngineService
 *
 * This service contains the core matching logic.
 * Whenever a new order comes in, we call processNewOrder(order)
 * to try to match it against existing opposite-side orders.
 *
 * NOTE: This is a simple single-node, single-threaded matching engine
 * for learning and demo purposes.
 */
@Service
public class MatchingEngineService {

    private final OrderRepository orderRepository;
    private final PositionRepository positionRepository;
    private final UserTradeRepository userTradeRepository;
    private final TradeRepository tradeRepository;

    public MatchingEngineService(OrderRepository orderRepository,
                                PositionRepository positionRepository,
                                TradeRepository tradeRepository,
                                 UserTradeRepository userTradeRepository) {
        this.orderRepository = orderRepository;
        this.positionRepository = positionRepository;
        this.userTradeRepository = userTradeRepository;
        this.tradeRepository = tradeRepository;
    }

    /**
     * Process a newly created order.
     * - If BUY: try to match with best SELL orders
     * - If SELL: try to match with best BUY orders
     *
     * @param incomingOrder the order we just inserted into DB
     */
    @Transactional
    public void processNewOrder(Order incomingOrder) {

        // If order is already filled or cancelled, do nothing
        if (incomingOrder.getStatus() != OrderStatus.OPEN) {
            return;
        }

        // Remaining quantity to be matched
        int remainingQty = incomingOrder.getQuantity();

        // Decide which side we need to match against
        if (incomingOrder.getSide() == Side.BUY) {
            matchBuyOrder(incomingOrder, remainingQty);
        } else if (incomingOrder.getSide() == Side.SELL) {
            matchSellOrder(incomingOrder, remainingQty);
        }
    }

    /**
     * Match a BUY order against existing SELL orders.
     */
    private void matchBuyOrder(Order buyOrder, int remainingQty) {

        // Get all OPEN SELL orders for the same symbol, best price first
        List<Order> sellOrders = orderRepository
                .findBySymbolAndSideAndStatusOrderByPriceAscCreatedAtAsc(
                        buyOrder.getSymbol(),
                        Side.SELL,
                        OrderStatus.OPEN
                );

        for (Order sellOrder : sellOrders) {

            // Stop if BUY order is fully satisfied
            if (remainingQty <= 0) {
                break;
            }

            // Price condition: BUY price must be >= SELL price
            if (buyOrder.getPrice().compareTo(sellOrder.getPrice()) < 0) {
                // Remaining sell orders are even more expensive, so we stop
                break;
            }

            // Calculate how much we can trade in this match
            int tradableQty = Math.min(remainingQty, sellOrder.getQuantity());

            // --- Create Trade Record ---
Trade trade = new Trade();
trade.setBuyOrderId(buyOrder.getOrderId());
trade.setSellOrderId(sellOrder.getOrderId());
trade.setBuyerId(buyOrder.getUserId());
trade.setSellerId(sellOrder.getUserId());
trade.setSymbol(buyOrder.getSymbol());
trade.setPrice(sellOrder.getPrice()); // trade price = sell price (common rule)
trade.setQuantity(tradableQty);

tradeRepository.save(trade);


            // --- Update quantities ---
            remainingQty -= tradableQty;
            sellOrder.setQuantity(sellOrder.getQuantity() - tradableQty);

            // Update SELL order status
            if (sellOrder.getQuantity() == 0) {
                sellOrder.setStatus(OrderStatus.FILLED);
            } else {
                sellOrder.setStatus(OrderStatus.PARTIALLY_FILLED);
            }

            // Save updated SELL order
            orderRepository.save(sellOrder);

            // Calculate trade price (here we use the SELL price, but you can choose mid or BUY)
            BigDecimal tradePrice = sellOrder.getPrice();

            // 1) Insert two rows in user_trades (buyer + seller)
            //recordTrade(buyOrder, sellOrder, tradableQty, tradePrice);
            
            recordTradeAndUpdatePositions(
                buyOrder,
                sellOrder,
                tradableQty,
                sellOrder.getPrice()      // trade price
        );
            
        }

        // Update BUY order based on remaining quantity
        buyOrder.setQuantity(remainingQty);
        if (remainingQty == 0) {
            buyOrder.setStatus(OrderStatus.FILLED);
        } else if (remainingQty < 0) {
            // Should never happen, but just in case
            throw new IllegalStateException("Remaining quantity cannot be negative");
        } else if (remainingQty < buyOrder.getQuantity()) {
            buyOrder.setStatus(OrderStatus.PARTIALLY_FILLED);
        }

        orderRepository.save(buyOrder);
    }

    /**
     * Match a SELL order against existing BUY orders.
     */
    private void matchSellOrder(Order sellOrder, int remainingQty) {

        // Get all OPEN BUY orders for the same symbol, best (highest) price first
        List<Order> buyOrders = orderRepository
                .findBySymbolAndSideAndStatusOrderByPriceDescCreatedAtAsc(
                        sellOrder.getSymbol(),
                        Side.BUY,
                        OrderStatus.OPEN
                );

        for (Order buyOrder : buyOrders) {

            if (remainingQty <= 0) {
                break;
            }

            // Price condition: BUY price must be >= SELL price
            if (buyOrder.getPrice().compareTo(sellOrder.getPrice()) < 0) {
                // Remaining BUY orders are even cheaper, so no more matches
                break;
            }

            int tradableQty = Math.min(remainingQty, buyOrder.getQuantity());

            Trade trade = new Trade();
trade.setBuyOrderId(buyOrder.getOrderId());
trade.setSellOrderId(sellOrder.getOrderId());
trade.setBuyerId(buyOrder.getUserId());
trade.setSellerId(sellOrder.getUserId());
trade.setSymbol(buyOrder.getSymbol());
trade.setPrice(sellOrder.getPrice()); // trade price = sell price (common rule)
trade.setQuantity(tradableQty);

            // --- Update quantities ---
            remainingQty -= tradableQty;
            buyOrder.setQuantity(buyOrder.getQuantity() - tradableQty);

            // Update BUY order status
            if (buyOrder.getQuantity() == 0) {
                buyOrder.setStatus(OrderStatus.FILLED);
            } else {
                buyOrder.setStatus(OrderStatus.PARTIALLY_FILLED);
            }

            // Save updated BUY order
            orderRepository.save(buyOrder);

            BigDecimal tradePrice = buyOrder.getPrice();

            // 1) Insert trade rows
            //recordTrade(buyOrder, sellOrder, tradableQty, tradePrice);

            // === NEW: record trade + update positions ===
            recordTradeAndUpdatePositions(
                buyOrder,
                sellOrder,
                tradableQty,
                sellOrder.getPrice()      // or buyOrder.getPrice(), your choice
        );
            
        }

        

        // Update SELL order status
        sellOrder.setQuantity(remainingQty);
        if (remainingQty == 0) {
            sellOrder.setStatus(OrderStatus.FILLED);
        } else if (remainingQty < sellOrder.getQuantity()) {
            sellOrder.setStatus(OrderStatus.PARTIALLY_FILLED);
        }

        orderRepository.save(sellOrder);
    }
    /**
 * Save trade history rows for BOTH sides of a matched trade.
 *
 * One match between a BUY order and a SELL order creates:
 *  - one UserTrade row for the buyer
 *  - one UserTrade row for the seller
 */
private void recordTrade(Order buyOrder,
    Order sellOrder,
    int tradeQty,
    BigDecimal tradePrice) {

LocalDateTime now = LocalDateTime.now();

// Trade seen from BUYER side
UserTrade buyTrade = new UserTrade();
buyTrade.setOrderId(buyOrder.getOrderId());
buyTrade.setUserId(buyOrder.getUserId());
buyTrade.setSymbol(buyOrder.getSymbol());
buyTrade.setSide(Side.BUY);
buyTrade.setPrice(tradePrice);
buyTrade.setQuantity(tradeQty);
buyTrade.setTradeTime(now);

// Trade seen from SELLER side
UserTrade sellTrade = new UserTrade();
sellTrade.setOrderId(sellOrder.getOrderId());
sellTrade.setUserId(sellOrder.getUserId());
sellTrade.setSymbol(sellOrder.getSymbol());
sellTrade.setSide(Side.SELL);
sellTrade.setPrice(tradePrice);
sellTrade.setQuantity(tradeQty);
sellTrade.setTradeTime(now);

// Persist both sides
userTradeRepository.save(buyTrade);
userTradeRepository.save(sellTrade);
}

    /**
     * Update the buyer's position after a BUY trade.
     *
     * Logic:
     * - If no existing position: newQty = tradeQty, avgPrice = tradePrice
     * - If position exists:
     *      newQty      = oldQty + tradeQty
     *      newAvgPrice = (oldQty*oldAvgPrice + tradeQty*tradePrice) / newQty
     */
    private void updateBuyerPosition(int  userId,
        String symbol,
        int tradeQty,
        BigDecimal tradePrice) {

Position position = positionRepository
.findByUserIdAndSymbol(userId, symbol)
.orElseGet(() -> {
Position p = new Position();
p.setUserId(userId);
p.setSymbol(symbol);
p.setQuantity(0);
p.setAvgPrice(BigDecimal.ZERO);
return p;
});

int oldQty = position.getQuantity();
BigDecimal oldAvg = position.getAvgPrice() == null
? BigDecimal.ZERO
: position.getAvgPrice();

int newQty = oldQty + tradeQty;

// total cost before + new trade cost
BigDecimal totalOldCost = oldAvg.multiply(BigDecimal.valueOf(oldQty));
BigDecimal tradeCost    = tradePrice.multiply(BigDecimal.valueOf(tradeQty));
BigDecimal totalNewCost = totalOldCost.add(tradeCost);

BigDecimal newAvgPrice = newQty == 0
? BigDecimal.ZERO
: totalNewCost.divide(BigDecimal.valueOf(newQty), 4, RoundingMode.HALF_UP);

position.setQuantity(newQty);
position.setAvgPrice(newAvgPrice);

positionRepository.save(position);
}

    /**
     * Update the seller's position after a SELL trade.
     *
     * For now we keep it simple:
     * - We assume user is selling from existing holdings (no short selling).
     * - Quantity decreases.
     * - Avg price stays the same for remaining quantity.
     */
    private void updateSellerPosition(int userId,
        String symbol,
        int tradeQty) {

Position position = positionRepository
.findByUserIdAndSymbol(userId, symbol)
.orElseThrow(() ->
new IllegalStateException("Seller has no position for symbol " + symbol));

int oldQty = position.getQuantity();
int newQty = oldQty - tradeQty;

if (newQty < 0) {
throw new IllegalStateException("Seller is selling more than they hold. userId="
+ userId + ", symbol=" + symbol);
}

position.setQuantity(newQty);

// If position fully closed, we can optionally reset avg price
if (newQty == 0) {
position.setAvgPrice(BigDecimal.ZERO);
}

positionRepository.save(position);
}

    /**
     * Record trade for both users and update their positions.
     *
     * - Inserts one UserTrade row for BUYER
     * - Inserts one UserTrade row for SELLER
     * - Updates positions table for both users
     */
    private void recordTradeAndUpdatePositions(Order buyOrder,
        Order sellOrder,
        int tradeQty,
        BigDecimal tradePrice) {

LocalDateTime now = LocalDateTime.now();

// ---- 1) Save trade from BUYER perspective ----
UserTrade buyerTrade = new UserTrade();
buyerTrade.setUserId(buyOrder.getUserId());
buyerTrade.setOrderId(buyOrder.getOrderId());
buyerTrade.setSymbol(buyOrder.getSymbol());
buyerTrade.setSide(Side.BUY);
buyerTrade.setQuantity(tradeQty);
buyerTrade.setPrice(tradePrice);
buyerTrade.setTradeTime(now);
userTradeRepository.save(buyerTrade);

// ---- 2) Save trade from SELLER perspective ----
UserTrade sellerTrade = new UserTrade();
sellerTrade.setUserId(sellOrder.getUserId());
sellerTrade.setOrderId(sellOrder.getOrderId());
sellerTrade.setSymbol(sellOrder.getSymbol());
sellerTrade.setSide(Side.SELL);
sellerTrade.setQuantity(tradeQty);
sellerTrade.setPrice(tradePrice);
sellerTrade.setTradeTime(now);
userTradeRepository.save(sellerTrade);

// ---- 3) Update positions ----
updateBuyerPosition(
buyOrder.getUserId(),
buyOrder.getSymbol(),
tradeQty,
tradePrice
);

updateSellerPosition(
sellOrder.getUserId(),
sellOrder.getSymbol(),
tradeQty
);
}

}
