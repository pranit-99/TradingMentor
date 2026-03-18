import { useEffect, useState } from "react";
import "./StockDetails.css";

function SimpleLineChart({ data = [], width = 900, height = 280 }) {
  if (!data.length) {
    return <div className="stock-details-card">No chart data available.</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <div className="stock-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="stock-chart-svg"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={isPositive ? "#22c55e" : "#ef4444"}
          strokeWidth="3"
          points={points}
        />
      </svg>

      <div className="stock-chart-scale">
        <span>${max.toFixed(2)}</span>
        <span>${min.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function StockDetails({ symbol, onBack }) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const AI_BASE_URL =
    import.meta.env.VITE_AI_BASE_URL || "http://127.0.0.1:8001";

  useEffect(() => {
    if (!symbol) {
      setPrices(null);
      return;
    }

    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${AI_BASE_URL}/prices?symbol=${encodeURIComponent(symbol)}`
        );

        if (!res.ok) {
          throw new Error(`Prices HTTP ${res.status}`);
        }

        const data = await res.json();
        setPrices(data);
      } catch (err) {
        setError(err.message);
        setPrices(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [symbol, AI_BASE_URL]);

  const closes = prices?.closes || [];

  const latestClose =
    closes.length > 0 ? closes[closes.length - 1] : null;

  const firstClose =
    closes.length > 0 ? closes[0] : null;

  const priceDiff =
    latestClose != null && firstClose != null
      ? latestClose - firstClose
      : null;

  const percentChange =
    latestClose != null && firstClose != null && firstClose !== 0
      ? (priceDiff / firstClose) * 100
      : null;

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

      {!symbol && (
        <div className="stock-details-card">No symbol selected.</div>
      )}

      {loading && (
        <div className="stock-details-card">Loading chart data...</div>
      )}

      {error && (
        <div className="stock-details-card">
          <b>Error:</b> {error}
        </div>
      )}

      {!loading && !error && prices && (
        <>
          <div className="stock-details-card">
            <h3>{symbol}</h3>
            <p className="stock-subtitle">1 Month Historical Summary</p>

            <div className="stock-summary-top">
              <div className="stock-price-block">
                <div className="stock-price">
                  {latestClose != null ? `$${latestClose.toFixed(2)}` : "N/A"}
                </div>

                {priceDiff != null && percentChange != null && (
                  <div className={`stock-change ${priceDiff >= 0 ? "pos" : "neg"}`}>
                    {priceDiff >= 0 ? "+" : ""}
                    {priceDiff.toFixed(2)} ({priceDiff >= 0 ? "+" : ""}
                    {percentChange.toFixed(2)}%)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="stock-details-card">
            <h3>1 Month Price Trend</h3>
            <SimpleLineChart data={closes} />

            <div className="stock-chart-dates">
              <span>{prices?.dates?.[0] || "—"}</span>
              <span>{prices?.dates?.[prices?.dates?.length - 1] || "—"}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}