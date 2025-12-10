// src/pages/StocksListing.jsx
import React, { useEffect, useState } from "react";
import "../App.css"; // reuse same CSS

/**
 * StocksListing
 * - Calls backend GET http://localhost:8080/api/stocks
 * - Shows results in a table
 * - Allows placing BUY orders via /api/orders
 */
function StocksListing({ currentUser }) {
  const [stocks, setStocks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- State for BUY modal ---
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderSide, setOrderSide] = useState("BUY");
  const [orderQty, setOrderQty] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");

  // 1. Fetch data once when component mounts
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("http://localhost:8080/api/stocks");
        if (!response.ok) {
          throw new Error("Failed to fetch stocks");
        }
        const data = await response.json();
        console.log("Stocks from backend:", data); // debug
        setStocks(data);
        setFiltered(data);
      } catch (err) {
        console.error("Error fetching stocks:", err.message);
        setError(
          "Unable to load stocks. Please try again later. Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // 2. When search text changes, update the filtered list
  useEffect(() => {
    const lower = search.toLowerCase();

    const result = stocks.filter((stock) => {
      const symbol = (stock.symbol || "").toLowerCase();
      const name = (stock.name || "").toLowerCase();
      const sector = (stock.sector || "").toLowerCase();
      return (
        symbol.includes(lower) || name.includes(lower) || sector.includes(lower)
      );
    });

    setFiltered(result);
  }, [search, stocks]);

  // 3. Open / close modal
  const openBuyModal = (stock, side = "BUY") => {
    if (!currentUser) {
      setOrderError("Please log in before placing an order.");
    }
  
    setSelectedStock(stock);
    setOrderSide(side.toUpperCase()); // <-- use passed side ("BUY" or "SELL")
    setOrderQty(1);
    setOrderError("");
    setOrderSuccess("");
    setIsOrderModalOpen(true);
  };
  

  const closeOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedStock(null);
    setOrderQty(1);
    setOrderError("");
    setOrderSuccess("");
  };

  // 4. Quantity handlers
  const increaseQty = () => {
    setOrderQty((prev) => prev + 1);
  };

  const decreaseQty = () => {
    setOrderQty((prev) => (prev > 1 ? prev - 1 : 1));
  };

  // 5. Place BUY order
  const handlePlaceOrder = async () => {
    if (!currentUser) {
      setOrderError("User is not logged in.");
      return;
    }

    if (!selectedStock) {
      setOrderError("No stock selected.");
      return;
    }

    if (!orderQty || orderQty <= 0) {
      setOrderError("Quantity must be at least 1.");
      return;
    }

    // SAFETY: use either real-time price or fallback to DB price
    const price =
      selectedStock.lastPrice !== undefined && selectedStock.lastPrice !== null
        ? Number(selectedStock.lastPrice)
        : Number(selectedStock.price || 0);

    if (!price || price <= 0) {
      setOrderError("Invalid price for this stock.");
      return;
    }

    

    const payload = {
      userId: currentUser.userId || currentUser.id, // adjust based on your login response
      symbol: selectedStock.symbol,
      side: orderSide.toUpperCase(), // "BUY"
      price: price,
      quantity: orderQty,
    };

    console.log("Sending order payload:", payload);

    try {
      setPlacingOrder(true);
      setOrderError("");
      setOrderSuccess("");

      const resp = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(errBody || "Order placement failed");
      }

      const savedOrder = await resp.json();
      console.log("Order placed successfully:", savedOrder);
      setOrderSuccess(
        `Order placed: ${savedOrder.side} ${savedOrder.quantity} ${savedOrder.symbol} @ ${savedOrder.price}`
      );
      // You can close modal automatically here if you want:
      // closeOrderModal();
    } catch (err) {
      console.error("Error placing order:", err);
      setOrderError(err.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // 6. Render
  if (loading) return <div style={{ padding: "1rem" }}>Loading stocks...</div>;
  if (error) return <div style={{ padding: "1rem", color: "red" }}>{error}</div>;

  return (
    <div className="stocks-page">
      {/* Header */}
      <div className="stocks-header">
        <div>
          <h1>Stocks Listing</h1>
          <p>
            Browse all available symbols from your <code>stock_master</code>{" "}
            table. Real-time prices are fetched using Alpha Vantage.
          </p>
        </div>
        <div className="stocks-toolbar">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search by symbol, name, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="stocks-search"
          />
        </div>
      </div>

      {/* State messages */}
      {loading && <div className="info-chip">Loading stocks...</div>}
      {error && <div className="error-chip">Error: {error}</div>}

      {/* Table */}
      {!loading && !error && (
        <div className="stocks-table-wrapper">
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Sector</th>
                <th>Exchange</th>
                <th>Price</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No stocks match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((stock) => (
                  <tr key={stock.stockId || stock.id || stock.symbol}>
                    <td className="symbol-cell">{stock.symbol}</td>
                    <td>{stock.name}</td>
                    <td>{stock.sector}</td>
                    <td>{stock.exchange}</td>
                    <td>
                      {stock.lastPrice !== undefined &&
                      stock.lastPrice !== null
                        ? Number(stock.lastPrice).toFixed(2)
                        : "-"}
                    </td>
                    <td>{stock.currency}</td>
                    <td>
                      <span
                        className={
                          stock.isActive ? "status-pill active" : "status-pill"
                        }
                      >
                        {stock.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-buy"
                        onClick={() => openBuyModal(stock, "BUY")}
                      >
                        Buy
                      </button>
                      <button
                        className="btn-sell"
                        style={{ marginLeft: "8px" }}
                        onClick={() => openBuyModal(stock, "SELL")}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* BUY Modal */}
          {isOrderModalOpen && selectedStock && (
            <div className="order-modal-overlay">
              <div className="order-modal">
                <h3>
                  {orderSide} {selectedStock.symbol}
                </h3>
                <p>{selectedStock.name}</p>

                <div className="order-row">
                  <span>Price:</span>
                  <span>
                    {selectedStock.lastPrice !== undefined &&
                    selectedStock.lastPrice !== null
                      ? Number(selectedStock.lastPrice).toFixed(2)
                      : Number(selectedStock.price || 0).toFixed(2)}
                  </span>
                </div>

                <div className="order-row">
                  <span>Quantity:</span>
                  <div className="qty-controls">
                    <button onClick={decreaseQty}>−</button>
                    <span>{orderQty}</span>
                    <button onClick={increaseQty}>+</button>
                  </div>
                </div>

                <div className="order-row total-row">
                  <span>Total:</span>
                  <span>
                    {(
                      orderQty *
                      (selectedStock.lastPrice !== undefined &&
                      selectedStock.lastPrice !== null
                        ? Number(selectedStock.lastPrice)
                        : Number(selectedStock.price || 0))
                    ).toFixed(2)}
                  </span>
                </div>

                {orderError && <div className="order-error">{orderError}</div>}

                {orderSuccess && (
                  <div className="order-success">{orderSuccess}</div>
                )}

                <div className="order-actions">
                  <button onClick={closeOrderModal} disabled={placingOrder}>
                    Cancel
                  </button>
                  <button
                    className="btn-confirm"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                  >
                    {placingOrder ? "Placing..." : "Confirm Order"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StocksListing;
