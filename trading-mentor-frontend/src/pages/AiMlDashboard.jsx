import { useEffect, useState } from "react";
import "./AiMlDashboard.css";

export default function AiMlDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [predMap, setPredMap] = useState({});



  const symbols = "AAPL,MSFT,TSLA,NVDA";
  const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL;

  useEffect(() => {
    //const url = `http://localhost:8001/overview?symbols=${encodeURIComponent(symbols)}`;
    //const predictUrl = `http://localhost:8001/predict_compare?symbols=${encodeURIComponent(symbols)}`;
    const url = `${AI_BASE_URL}/overview?symbols=${encodeURIComponent(symbols)}`;
    const predictUrl = `${AI_BASE_URL}/predict_compare?symbols=${encodeURIComponent(symbols)}`;


    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));

      /*fetch(predictUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Predict HTTP ${res.status}`);
        return res.json();
      })
      .then((pred) => {
        const map = {};
        (pred.results || []).forEach((p) => {
          map[p.symbol] = p;
        });
        setPredMap(map);
      })
      .catch((err) => setError(err.message));*/
      fetch(predictUrl)
  .then((res) => {
    if (!res.ok) throw new Error(`Predict HTTP ${res.status}`);
    return res.json();
  })
  .then((pred) => {
    const map = {};
    (pred.results || []).forEach((p) => {
      map[p.symbol] = p;   // p has { symbol, linear:{...}, ridge:{...} }
    });
    setPredMap(map);
  })
  .catch((err) => setError(err.message));

  }, []);

  const trendBadgeClass = (trend) => {
    if (trend === "GREEN") return "badge-green";
    if (trend === "YELLOW") return "badge-yellow";
    if (trend === "RED") return "badge-red";
    return "badge-unknown";
  };

  const riskFillClass = (risk) => {
    if (risk === "LOW") return "fill-low";
    if (risk === "MEDIUM") return "fill-medium";
    if (risk === "HIGH") return "fill-high";
    return "fill-unknown";
  };

  return (
    <div className="aiml-wrap">
      <div className="aiml-title">AI/ML Dashboard (Live Signals)</div>

      {error && (
        <div className="aiml-card">
          <b>Error:</b> {error}
        </div>
      )}

      {!error && !data && <div className="aiml-card">Loading AI signals...</div>}

      {data && (
        <div className="aiml-grid">
          {data.results.map((row) => (
            <div key={row.symbol} className="aiml-card">
              <div className="aiml-card-top">
                <div className="aiml-symbol">{row.symbol}</div>

                <div className={`aiml-badge ${trendBadgeClass(row.trend)}`}>
                  {row.trend}
                </div>
              </div>

              <div className="aiml-row">
                <span>Risk</span>
                <b>{row.risk}</b>
              </div>

              <div className="aiml-row">
                <span>Risk Score</span>
                <b>{row.risk_score}</b>
              </div>

              <div className="aiml-row">
                <span>Volatility</span>
                <b>{row.volatility}</b>
              </div>

              {/*<div className="aiml-row">
              <span>Prediction</span>
              <b>
              {(() => {
              const p = predMap[row.symbol];
              if (!p) return "Loading...";
              if (!p.direction || typeof p.predicted_next_day_return !== "number") return "N/A";
              return `${p.direction} (${p.predicted_next_day_return})`;
              })()}
              </b>
            </div>*/}
            <div className="aiml-row">
            <span>Prediction</span>
            {/*{(() => {
             const p = predMap[row.symbol];

             if (!p) return <b>Loading...</b>;
             if (!p.direction || typeof p.predicted_next_day_return !== "number") return <b>N/A</b>;

            const pct = (p.predicted_next_day_return * 100).toFixed(2); // convert to %
            const sign = p.predicted_next_day_return >= 0 ? "+" : "";  // add + for positive

            const cls =
          p.direction === "UP" ? "pred-up" :
          p.direction === "DOWN" ? "pred-down" :
          "pred-flat";

          return (
          <b className={cls}>
          {p.direction} ({sign}{pct}%)
          </b>
          );
           })()}*/}
           {(() => {
  const p = predMap[row.symbol];
  if (!p) {
    return (
      <div className="aiml-row">
        <span>Prediction</span>
        <b>Loading...</b>
      </div>
    );
  }

  const renderPred = (label, obj) => {
    if (!obj || typeof obj.predicted_next_day_return !== "number" || !obj.direction) {
      return (
        <div className="aiml-row">
          <span><span className="pred-label">{label}:</span>Prediction</span>
          <b>N/A</b>
        </div>
      );
    }

    const pct = (obj.predicted_next_day_return * 100).toFixed(2);
    const sign = obj.predicted_next_day_return >= 0 ? "+" : "";

    const cls =
      obj.direction === "UP" ? "pred-up" :
      obj.direction === "DOWN" ? "pred-down" :
      "pred-flat";

    return (
      <div className="aiml-row">
        <span><span className="pred-label">{label}:</span>Prediction</span>
        <b className={cls}>
          {obj.direction} ({sign}{pct}%)
        </b>
      </div>
    );
  };

  return (
    <>
      {renderPred("Linear", p.linear)}
      {renderPred("Ridge", p.ridge)}
    </>
  );
})()}

          </div>

              <div className="aiml-riskbar">
                <div
                  className={`aiml-riskfill ${riskFillClass(row.risk)}`}
                  style={{ width: `${row.risk_score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
