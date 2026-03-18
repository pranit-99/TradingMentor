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
  const [overview, setOverview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("1mo");

  const AI_BASE_URL =
    import.meta.env.VITE_AI_BASE_URL || "http://127.0.0.1:8001";

  const intervalMap = {
    "1mo": "1d",
    "3mo": "1d",
    "6mo": "1d",
    "1y": "1wk",
  };

  useEffect(() => {
    if (!symbol) {
      setPrices(null);
      setOverview(null);
      setPrediction(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const [pricesRes, overviewRes, predictionRes] = await Promise.all([
          fetch(
            `${AI_BASE_URL}/prices?symbol=${encodeURIComponent(
              symbol
            )}&period=${encodeURIComponent(timeframe)}&interval=${encodeURIComponent(
              intervalMap[timeframe]
            )}`
          ),
          fetch(`${AI_BASE_URL}/overview?symbols=${encodeURIComponent(symbol)}`),
          fetch(`${AI_BASE_URL}/predict_compare?symbols=${encodeURIComponent(symbol)}`),
        ]);

        if (!pricesRes.ok) throw new Error(`Prices HTTP ${pricesRes.status}`);
        if (!overviewRes.ok) throw new Error(`Overview HTTP ${overviewRes.status}`);
        if (!predictionRes.ok) throw new Error(`Prediction HTTP ${predictionRes.status}`);

        const pricesData = await pricesRes.json();
        const overviewData = await overviewRes.json();
        const predictionData = await predictionRes.json();

        setPrices(pricesData);
        setOverview(overviewData?.results?.[0] || null);
        setPrediction(predictionData?.results?.[0] || null);
      } catch (err) {
        setError(err.message);
        setPrices(null);
        setOverview(null);
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [symbol, timeframe, AI_BASE_URL]);

  const closes = prices?.closes || [];

  const latestClose = closes.length > 0 ? closes[closes.length - 1] : null;
  const firstClose = closes.length > 0 ? closes[0] : null;

  const priceDiff =
    latestClose != null && firstClose != null ? latestClose - firstClose : null;

  const percentChange =
    latestClose != null && firstClose != null && firstClose !== 0
      ? (priceDiff / firstClose) * 100
      : null;

  const renderPredictionBox = (label, obj, meta = null) => {
    if (
      !obj ||
      typeof obj.predicted_next_day_return !== "number" ||
      !obj.direction
    ) {
      return (
        <div className="stock-pred-item">
          <div className="stock-pred-name">{label}</div>
          <div className="stock-pred-na">N/A</div>
        </div>
      );
    }

    const pct = (obj.predicted_next_day_return * 100).toFixed(2);
    const sign = obj.predicted_next_day_return >= 0 ? "+" : "";

    const cls =
      obj.direction === "UP"
        ? "stock-pred-up"
        : obj.direction === "DOWN"
        ? "stock-pred-down"
        : "stock-pred-flat";

    return (
      <div className="stock-pred-item">
        <div className="stock-pred-name">{label}</div>
        <div className={`stock-pred-value ${cls}`}>{obj.direction}</div>
        <div className={`stock-pred-pct ${cls}`}>({sign}{pct}%)</div>

        {meta && <div className="stock-pred-meta">{meta}</div>}

        {label === "Tuned" && obj.confidence && (
          <div className="stock-pred-confidence">
            <span
              className={
                obj.confidence.label === "HIGH"
                  ? "stock-conf-high"
                  : obj.confidence.label === "MEDIUM"
                  ? "stock-conf-med"
                  : "stock-conf-low"
              }
            >
              Confidence: {obj.confidence.label}
            </span>
            <span className="stock-conf-pill">{obj.confidence.percent}%</span>
          </div>
        )}

        {label === "Tuned" && obj.explanation && (
          <div className="stock-pred-explanation">{obj.explanation}</div>
        )}
      </div>
    );
  };

  return (
    <div className="stock-details-page">
      <button className="stock-back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="stock-details-header">
  <div className="stock-header-left">
    <div className="stock-symbol-row">
      <h1>{symbol || "N/A"}</h1>
      <span className="stock-timeframe-badge">
        {timeframe.toUpperCase()}
      </span>
    </div>
    <p className="stock-header-subtitle">Historical trend summary</p>
  </div>

  <div className="stock-header-right">
    <div className="stock-header-price">
      {latestClose != null ? `$${latestClose.toFixed(2)}` : "N/A"}
    </div>

    {priceDiff != null && percentChange != null && (
      <div className={`stock-header-change ${priceDiff >= 0 ? "pos" : "neg"}`}>
        {priceDiff >= 0 ? "+" : ""}
        {priceDiff.toFixed(2)} ({priceDiff >= 0 ? "+" : ""}
        {percentChange.toFixed(2)}%)
      </div>
    )}
  </div>
</div>

      {!symbol && <div className="stock-details-card">No symbol selected.</div>}

      {loading && (
        <div className="stock-details-card">Loading stock details...</div>
      )}

      {error && (
        <div className="stock-details-card">
          <b>Error:</b> {error}
        </div>
      )}

      {!loading && !error && prices && (
        <>
           <div className="stock-details-card stock-chart-card">
  <div className="stock-chart-header">
    <div className="stock-chart-heading-block">
      <h3>{symbol} Price Trend</h3>
      <p className="stock-chart-subtitle">
        Historical closing-price movement for the selected timeframe
      </p>
    </div>

    <div className="stock-timeframe-tabs">
      <button
        className={timeframe === "1mo" ? "tf-btn active" : "tf-btn"}
        onClick={() => setTimeframe("1mo")}
      >
        1M
      </button>
      <button
        className={timeframe === "3mo" ? "tf-btn active" : "tf-btn"}
        onClick={() => setTimeframe("3mo")}
      >
        3M
      </button>
      <button
        className={timeframe === "6mo" ? "tf-btn active" : "tf-btn"}
        onClick={() => setTimeframe("6mo")}
      >
        6M
      </button>
      <button
        className={timeframe === "1y" ? "tf-btn active" : "tf-btn"}
        onClick={() => setTimeframe("1y")}
      >
        1Y
      </button>
    </div>
  </div>

  <div className="stock-chart-panel">
    <SimpleLineChart data={closes} />
  </div>

  <div className="stock-chart-footer">
    <div className="stock-chart-date-block">
      <span className="stock-chart-label">Start</span>
      <span>{prices?.dates?.[0] || "—"}</span>
    </div>

    <div className="stock-chart-date-block stock-chart-date-block-right">
      <span className="stock-chart-label">Latest</span>
      <span>{prices?.dates?.[prices?.dates?.length - 1] || "—"}</span>
    </div>
  </div>
</div>

          <div className="stock-details-card">
            <h3>Analytics</h3>

            <div className="stock-stats-grid">
              <div className="stock-stat">
                <span>Trend</span>
                <b>{overview?.trend || "N/A"}</b>
              </div>
              <div className="stock-stat">
                <span>Risk</span>
                <b>{overview?.risk || "N/A"}</b>
              </div>
              <div className="stock-stat">
                <span>Risk Score</span>
                <b>{overview?.risk_score ?? "N/A"}</b>
              </div>
              <div className="stock-stat">
                <span>Volatility</span>
                <b>{overview?.volatility ?? "N/A"}</b>
              </div>
              <div className="stock-stat">
                <span>Short Avg</span>
                <b>{overview?.short_avg ?? "N/A"}</b>
              </div>
              <div className="stock-stat">
                <span>Long Avg</span>
                <b>{overview?.long_avg ?? "N/A"}</b>
              </div>
            </div>

            {overview?.anomaly?.flag && (
              <div className="stock-anomaly-box">
                <b>Anomaly:</b> {overview.anomaly.label} — {overview.anomaly.reason}
              </div>
            )}
          </div>

          <div className="stock-details-card">
            <h3>Prediction Models</h3>

            <div className="stock-pred-grid">
              {renderPredictionBox("Linear", prediction?.linear)}
              {renderPredictionBox("Ridge", prediction?.ridge_fixed)}
              {renderPredictionBox(
                "Tuned",
                prediction?.ridge_tuned,
                prediction?.ridge_tuned?.best_alpha
                  ? `α=${prediction.ridge_tuned.best_alpha} | MAE=${prediction.ridge_tuned.val_mae}`
                  : null
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}