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

  const closes = prices?.closes || [];

  const latestClose = closes.length > 0 ? closes[closes.length - 1] : null;

  const firstClose = closes.length > 0 ? closes[0] : null;

  const priceDiff = latestCose != null && firstClose != null
                    ? latestClose - firstClose
                    : null;

  const percentChange = latestClose != null && firstClose != null && firstClose !== 0
                        ? (priceDiff / firstClose) * 100
                        : null;

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
          <h3>Prices API Response</h3>
          <pre>{JSON.stringify(prices, null, 2)}</pre>
        </div>
        </>
      )}
    </div>
  )
}