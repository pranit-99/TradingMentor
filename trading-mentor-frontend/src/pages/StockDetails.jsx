import { useEffect, useState } from "react";


export default function StockDetails({ symbol, onBack }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const SPRING_BASE_URL =
  import.meta.env.VITE_SPRING_BASE_URL || "http://localhost:8080";

  useEffect(() => {
    if (!symbol) {
      return <div style={{ color: "white" }}>No symbol selected</div>;
    }
    console.log("SPRING BASE:", SPRING_BASE_URL);
    console.log("SYMBOL:", symbol);

    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${SPRING_BASE_URL}/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`
        );

        if (!res.ok) {
          throw new Error(`Quote HTTP ${res.status}`);
        }

        const data = await res.json();
        setQuote(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [symbol, SPRING_BASE_URL]);

  return (
    <div className="stock-details-page">
      <button className="stock-back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="stock-details-header">
        <h1>Stock Details</h1>
        <p>
          Selected Symbol: <b>{symbol || "N/A"}</b>
        </p>
      </div>

      {loading && (
        <div className="stock-details-card">Loading live stock summary...</div>
      )}

      {error && (
        <div className="stock-details-card">
          <b>Error:</b> {error}
        </div>
      )}

      {!loading && !error && quote && (
        <div className="stock-details-card">
          <div className="stock-summary-top">
            <div>
              <h2>{quote.symbol || symbol}</h2>
              <p className="stock-subtitle">Live market snapshot</p>
            </div>

            <div className="stock-price-block">
              <div className="stock-price">
                {quote.currentPrice ?? quote.c ?? "N/A"}
              </div>
              <div
                className={`stock-change ${
                  (quote.change ?? quote.d ?? 0) >= 0 ? "pos" : "neg"
                }`}
              >
                {quote.change ?? quote.d ?? "N/A"} (
                {quote.changePercent ?? quote.dp ?? "N/A"}%)
              </div>
            </div>
          </div>

          <div className="stock-stats-grid">
            <div className="stock-stat">
              <span>Open</span>
              <b>{quote.open ?? quote.o ?? "N/A"}</b>
            </div>

            <div className="stock-stat">
              <span>High</span>
              <b>{quote.high ?? quote.h ?? "N/A"}</b>
            </div>

            <div className="stock-stat">
              <span>Low</span>
              <b>{quote.low ?? quote.l ?? "N/A"}</b>
            </div>

            <div className="stock-stat">
              <span>Previous Close</span>
              <b>{quote.previousClose ?? quote.pc ?? "N/A"}</b>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !quote && (
        <div className="stock-details-card">
          No live quote available for <b>{symbol}</b>.
        </div>
      )}
    </div>
  );
}