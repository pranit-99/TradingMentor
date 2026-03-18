import { useEffect, useState } from "react";

export default function StockDetails({symbol, onBack}){
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://127.0.0.1:8001";

  useEffect(() =>{
    if (!symbol){
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
      } catch (err){
        setError(err.message);
        setPrices(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [symbol, AI_BASE_URL]);

  return(
    <div className="stock-details-page">
      <button className="stock-back-btn" onClick={onBack}>
        Back
      </button>

      <div className="stock-details-header">
        <h1>Stock Details</h1>
        <p>
          Selected Symbol : <b>{symbol || "N/A"}</b>
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
        <div className="stock-details-card">
          <h3>Prices API Response</h3>
          <pre>{JSON.stringify(prices, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}