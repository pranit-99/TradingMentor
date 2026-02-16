import { useEffect, useState } from "react";
import "./AiMlDashboard.css";

export default function AiMlDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [predMap, setPredMap] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [allSymbols, setAllSymbols] = useState([]);
const [pageIndex, setPageIndex] = useState(0);
const [chatInput, setChatInput] = useState("");
const [chatOpen, setChatOpen] = useState(false);
const [chatMessages, setChatMessages] = useState([
  {
    role: "assistant",
    text: "Hi! I’m your Trading Mentor. Ask me about signals (Trend/Risk/Prediction/Anomaly) or trading concepts like: What is equity?"
  }
])



const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL;


if (!AI_BASE_URL) {
  throw new Error("VITE_AI_BASE_URL is not defined");
}

const PAGE_SIZE = 3;

const totalPages = allSymbols.length
  ? Math.ceil(allSymbols.length / PAGE_SIZE)
  : 0;

const visibleSymbols = allSymbols.slice(
  pageIndex * PAGE_SIZE,
  pageIndex * PAGE_SIZE + PAGE_SIZE
);

const symbols = visibleSymbols.join(",");





  //const symbols = "AAPL,MSFT,TSLA,NVDA";
  useEffect(() => {
    setAllSymbols([
      "AAPL","MSFT","GOOGL","AMZN","TSLA","META","NVDA",
      "JPM","BAC","NFLX","V","MA","DIS","KO","PEP"
    ]);
    
    if (!symbols) return;
    let cancelled = false;
  
    const fetchAll = async () => {
      try {
        setError(null);
  
        //const url = `http://localhost:8001/overview?symbols=${encodeURIComponent(symbols)}`;
    	//const predictUrl = `http://localhost:8001/predict_compare?symbols=${encodeURIComponent(symbols)}`;
      const url = `${AI_BASE_URL}/overview?symbols=${encodeURIComponent(symbols)}`;
      const predictUrl = `${AI_BASE_URL}/predict_compare?symbols=${encodeURIComponent(symbols)}`;
  
        // 1) overview
        const ovRes = await fetch(url);
        if (!ovRes.ok) throw new Error(`Overview HTTP ${ovRes.status}`);
        const ovJson = await ovRes.json();
  
        // 2) prediction compare
        const prRes = await fetch(predictUrl);
        if (!prRes.ok) throw new Error(`Predict HTTP ${prRes.status}`);
        const prJson = await prRes.json();
  
        if (cancelled) return;
  
        setData(ovJson);
  
        const map = {};
        (prJson.results || []).forEach((p) => {
          map[p.symbol] = p;
        });
        setPredMap(map);
  
        setLastUpdated(new Date());
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };
  
    // run immediately
    fetchAll();
  
    // refresh every 60 seconds
    const id = setInterval(fetchAll, 60_000);
  
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbols]);

  useEffect(() => {
    if (!totalPages) return;
  
    const timer = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % totalPages);
    }, 8000); // 8 seconds
  
    return () => clearInterval(timer);
  }, [totalPages]);
  
  
 
  

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

  const handleSend = () =>{
    const msg = chatInput.trim();
    if (!msg) return;

    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
        text: "Got it. (Step 1 dummy reply) Next we will connect this to your /chat API."
        }
      ]);
    }, 300)
  };

  return (
    <div className="aiml-wrap">
      <div className="aiml-title">AI/ML Dashboard (Live Signals)</div>
      <div className="aiml-updated">
        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
      </div>

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
              <div className="aiml-carousel">
                
              <div
                className="aiml-track"
                style={{ transform: `translateX(-${pageIndex * 100}%)` }}
                >
                {Array.from({ length: totalPages }).map((_, page) => {
                const chunk = allSymbols.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
                const chunkSymbols = chunk.join(",");

                // IMPORTANT: Render same card UI, but for THIS chunk
                // We will reuse existing rendering by mapping chunk results
                return (
                <div className="aiml-slide" key={chunkSymbols}>
                  {/* render your 3 cards here for this chunk */}
                </div>
                  );
                    })}
                </div>
              </div>

              <div className="aiml-card-top">
                <div className="aiml-symbol">{row.symbol}</div>

                  <div className="aiml-badges">
                  <div className={`aiml-badge ${trendBadgeClass(row.trend)}`}>
                  {row.trend}
                  </div>

                  {row.anomaly?.flag && (
                  <div
                    className={`aiml-anom aiml-anom-${(row.anomaly.label || "MEDIUM").toLowerCase()}`}
                      title={row.anomaly.reason}
                      >
                    ⚠ {row.anomaly.label}
                  </div>
                 )}
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
              
              

            <div className="pred-section">
            <div className="pred-title">Prediction</div>
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
      return <div className="pred-loading">Loading...</div>;
    }

    const renderPred = (label, obj, meta = null) => {
      if (!obj || typeof obj.predicted_next_day_return !== "number" || !obj.direction) {
        return (
          <div className="pred-item">
            <div className="pred-name">{label}</div>
            <div className="pred-na">N/A</div>
          </div>
        );
      }

      const pct = (obj.predicted_next_day_return * 100).toFixed(2);
      const sign = obj.predicted_next_day_return >= 0 ? "+" : "";

      const cls =
        obj.direction === "UP" ? "pred-up" :
        obj.direction === "DOWN" ? "pred-down" :
        "pred-flat";

      /*return (
        <div className="pred-item">
          <div className="pred-name">{label}</div>

          <div className={`pred-value ${cls}`}>{obj.direction}</div>
          <div className={`pred-pct ${cls}`}>({sign}{pct}%)</div>

          {meta && <div className="pred-meta">{meta}</div>}
          
        </div>
      );*/
      return (
        <div className="pred-item">
          <div className="pred-name">{label}</div>
      
          <div className={`pred-value ${cls}`}>{obj.direction}</div>
          <div className={`pred-pct ${cls}`}>({sign}{pct}%)</div>
      
          {meta && <div className="pred-meta">{meta}</div>}
      
          {/* CONFIDENCE — only for Tuned */}
          {label === "Tuned" && obj.confidence && (
            <div className="pred-confidence">
              <span
                className={
                  obj.confidence.label === "HIGH"
                    ? "conf-high"
                    : obj.confidence.label === "MEDIUM"
                    ? "conf-med"
                    : "conf-low"
                }
              >
                Confidence: {obj.confidence.label}
              </span>
              <span className="conf-pill">
                {obj.confidence.percent}%
              </span>
            </div>
          )}
      
          {/* EXPLANATION — only for Tuned */}
          
        </div>
      );
      
    };

    return (
      <div className="pred-grid">
        {renderPred("Linear", p.linear)}
        {renderPred("Ridge", p.ridge_fixed)}
        {renderPred(
          "Tuned",
          p.ridge_tuned,
          p.ridge_tuned?.best_alpha
            ? `α=${p.ridge_tuned.best_alpha} | MAE=${p.ridge_tuned.val_mae}`
            : null
        )}
       {/*{p.ridge_tuned?.confidence && (
  <div className="aiml-row">
    <span>Confidence</span>
    <div className="conf-box">
      <span
        className={
          p.ridge_tuned.confidence.label === "HIGH"
            ? "conf-high"
            : p.ridge_tuned.confidence.label === "MEDIUM"
            ? "conf-med"
            : "conf-low"
        }
      >
        
        {p.ridge_tuned.confidence.label}
      </span>
      <span className="conf-pill">
        {p.ridge_tuned.confidence.percent}%
      </span>
    </div>
    
  </div>
)}*/}

      </div>
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
      {/* This Will be Chat Button */}
      <div className="chatbot-toggle"
      onClick={() => setChatOpen(!chatOpen)}
      >
      💬
      </div>
      {/* This part is for Chat Window*/}
      {chatOpen && (
        <div className="chatbot-window">
        <div>
        Trading Mentor
        <span onClick={() => setChatOpen(false)}>✕</span>
        </div>

        <div className="chatbot-body">
        <p>
        Hi! I’m your Trading Mentor. Ask about signals or trading concepts like
        "What is equity?"
        </p>
        </div>

        <div className="chatbot-input">
      <input placeholder="Ask about trading..." />
      <button>Send</button>
    </div>
        </div>
      )}
    </div>
    

  );
}
