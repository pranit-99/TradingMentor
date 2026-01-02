import React, { useEffect, useMemo, useState } from "react";
import "./Portfolio.css";

const API_BASE = "http://localhost:8080";
const STOCKS_URL = `${API_BASE}/api/stocks`; // ✅ use same as StocksListing

export default function Portfolio({ currentUser }) {
  const [positions, setPositions] = useState([]);
  const [stocks, setStocks] = useState([]); // ✅ live prices list
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("value"); // value | qty | symbol
  const [sortDir, setSortDir] = useState("desc");

  const userId = currentUser?.userId ?? Number(localStorage.getItem("userId"));

 
  

  // ✅ Fetch positions + stocks prices together
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const [posRes, stockRes] = await Promise.all([
          fetch(`http://localhost:8080/api/positions/user/${userId}`),
          fetch(STOCKS_URL),
        ]);

        if (!posRes.ok) throw new Error((await posRes.text()) || `Positions failed: ${posRes.status}`);
        if (!stockRes.ok) throw new Error((await stockRes.text()) || `Stocks failed: ${stockRes.status}`);

        const posData = await posRes.json();
        const stockData = await stockRes.json();

        setPositions(Array.isArray(posData) ? posData : []);
        setStocks(Array.isArray(stockData) ? stockData : []);
      } catch (e) {
        setErr(e.message || "Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  // ✅ Build price map: { AAPL: 180.12, MSFT: 401.10 }
  const priceMap = useMemo(() => {
    const map = {};
    for (const s of stocks) {
      const sym = (s.symbol || "").toUpperCase();
      const lp = Number(s.lastPrice ?? s.price ?? 0); // ✅ supports either lastPrice or price
      if (sym) map[sym] = lp;
    }
    return map;
  }, [stocks]);

  // ✅ Merge + compute per row
  const rows = useMemo(() => {
    const filtered = positions.filter((p) =>
      (p.symbol || "").toLowerCase().includes(q.trim().toLowerCase())
    );

    const mapped = filtered.map((p) => {
      const symbol = (p.symbol || "").toUpperCase();
      const qty = Number(p.quantity ?? 0);
      const avg = Number(p.avgPrice ?? 0);

      const invested = qty * avg;

      const lastPrice = Number(priceMap[symbol] ?? 0);
      const marketValue = qty * lastPrice;

      const pnl = (lastPrice - avg) * qty;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

      return {
        ...p,
        symbol,
        qty,
        avg,
        invested,
        lastPrice,
        marketValue,
        pnl,
        pnlPct,
      };
    });

    mapped.sort((a, b) => {
      if (sortKey === "symbol") {
        const A = (a.symbol || "").toUpperCase();
        const B = (b.symbol || "").toUpperCase();
        return sortDir === "asc" ? A.localeCompare(B) : B.localeCompare(A);
      }

      const A = sortKey === "qty" ? a.qty : a.marketValue; // ✅ value now uses marketValue
      const B = sortKey === "qty" ? b.qty : b.marketValue;
      return sortDir === "asc" ? A - B : B - A;
    });

    return mapped;
  }, [positions, q, sortKey, sortDir, priceMap]);

  // ✅ Totals
  const totals = useMemo(() => {
    const invested = rows.reduce((sum, r) => sum + (r.invested || 0), 0);
    const marketValue = rows.reduce((sum, r) => sum + (r.marketValue || 0), 0);
    const pnl = rows.reduce((sum, r) => sum + (r.pnl || 0), 0);

    const holdings = rows.length;
    const shares = rows.reduce((sum, r) => sum + (r.qty || 0), 0);

    return { invested, marketValue, pnl, holdings, shares };
  }, [rows]);

  // ✅ Allocation based on Market Value (better)
  const allocation = useMemo(() => {
    const total = totals.marketValue || 0;
    if (!total) return [];
    return rows
      .map((r) => ({
        symbol: r.symbol,
        pct: (r.marketValue / total) * 100,
      }))
      .filter((x) => x.pct > 0.5);
  }, [rows, totals.marketValue]);

  return (
    <div className="port-page">
      <div className="port-headerRow">
        <div>
          <div className="port-kicker">TradingMentor</div>
          <h2 className="port-title">Portfolio</h2>
          <div className="port-sub">
            User ID: <b>{userId}</b> • Holdings: <b>{totals.holdings}</b>
          </div>
        </div>

        <div className="port-searchWrap">
          <input
            className="port-search"
            placeholder="Search symbol (AAPL, MSFT...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select className="port-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="value">Sort: Market Value</option>
            <option value="qty">Sort: Quantity</option>
            <option value="symbol">Sort: Symbol</option>
          </select>

          <button
            className="port-btnGhost"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title="Toggle sort direction"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="port-cards">
        <Card label="Holdings" value={totals.holdings} hint="Total symbols in portfolio" />
        <Card label="Total Shares" value={totals.shares} hint="Total quantity across holdings" />
        <Card
          label="Total Invested"
          value={`$${totals.invested.toFixed(2)}`}
          hint="Qty × Avg Price"
        />
        <Card
          label="Market Value"
          value={`$${totals.marketValue.toFixed(2)}`}
          hint="Qty × Live Price"
        />
      </div>

      {/* Total P/L */}
      <div className="port-block">
        <div className="port-blockHead">
          <div className="port-blockTitle">Total P/L</div>
          <div className="port-blockHint">Based on live prices</div>
        </div>

        <div className={`port-plBig ${totals.pnl >= 0 ? "port-green" : "port-red"}`}>
          {totals.pnl >= 0 ? "+" : "-"}${Math.abs(totals.pnl).toFixed(2)}
        </div>
      </div>

      {/* Allocation */}
      <div className="port-block">
        <div className="port-blockHead">
          <div className="port-blockTitle">Allocation</div>
          <div className="port-blockHint">Based on market value</div>
        </div>

        {allocation.length === 0 ? (
          <div className="port-emptyMini">No allocation yet.</div>
        ) : (
          <div className="port-allocBar">
            {allocation.map((a) => (
              <div
                key={a.symbol}
                className="port-allocSeg"
                style={{ width: `${a.pct}%` }}
                title={`${a.symbol} • ${a.pct.toFixed(1)}%`}
              />
            ))}
          </div>
        )}

        <div className="port-allocLegend">
          {allocation.slice(0, 6).map((a) => (
            <span key={a.symbol} className="port-chip">
              {a.symbol} • {a.pct.toFixed(1)}%
            </span>
          ))}
          {allocation.length > 6 && <span className="port-chipMuted">+{allocation.length - 6} more</span>}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="port-block">
        <div className="port-blockHead">
          <div className="port-blockTitle">Holdings</div>
          <div className="port-blockHint">Positions + Live prices</div>
        </div>

        {loading && <div className="port-info">Loading portfolio...</div>}
        {err && <div className="port-error">{err}</div>}

        {!loading && !err && rows.length === 0 && (
          <div className="port-empty">
            <div className="port-emptyTitle">No holdings yet</div>
            <div className="port-emptyText">
              Place a BUY order and execute a trade to create your first position.
            </div>
            <button className="port-btnPrimary" onClick={() => (window.location.href = "/stocks")}>
              Go to Stocks
            </button>
          </div>
        )}

        {!loading && !err && rows.length > 0 && (
          <div className="port-tableWrap">
            <table className="port-table">
              <thead>
                <tr>
                  <th className="port-th">Symbol</th>
                  <th className="port-thRight">Qty</th>
                  <th className="port-thRight">Avg</th>
                  <th className="port-thRight">Last</th>
                  <th className="port-thRight">Invested</th>
                  <th className="port-thRight">Mkt Value</th>
                  <th className="port-thRight">P/L</th>
                  <th className="port-thRight">P/L%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.positionId || `${r.symbol}-${r.userId}`} className="port-tr">
                    <td className="port-td">
                      <span className="port-symbolBadge">{r.symbol}</span>
                    </td>
                    <td className="port-tdRight">{r.qty}</td>
                    <td className="port-tdRight">${r.avg.toFixed(2)}</td>
                    <td className="port-tdRight">${r.lastPrice.toFixed(2)}</td>
                    <td className="port-tdRight">${r.invested.toFixed(2)}</td>
                    <td className="port-tdRight">${r.marketValue.toFixed(2)}</td>

                    <td className={`port-tdRight ${r.pnl >= 0 ? "port-green" : "port-red"}`}>
                      {r.pnl >= 0 ? "+" : "-"}${Math.abs(r.pnl).toFixed(2)}
                    </td>

                    <td className={`port-tdRight ${r.pnlPct >= 0 ? "port-green" : "port-red"}`}>
                      {r.pnlPct >= 0 ? "+" : "-"}
                      {Math.abs(r.pnlPct).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="port-footerTotals">
              <div className="port-footerBox">
                <div className="port-footerLabel">Total Invested</div>
                <div className="port-footerValue">${totals.invested.toFixed(2)}</div>
              </div>

              <div className="port-footerBox">
                <div className="port-footerLabel">Total Market Value</div>
                <div className="port-footerValue">${totals.marketValue.toFixed(2)}</div>
              </div>

              <div className="port-footerBox">
                <div className="port-footerLabel">Total P/L</div>
                <div className={`port-footerValue ${totals.pnl >= 0 ? "port-green" : "port-red"}`}>
                  {totals.pnl >= 0 ? "+" : "-"}${Math.abs(totals.pnl).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, hint, muted }) {
  return (
    <div className={`port-card ${muted ? "port-cardMuted" : ""}`}>
      <div className="port-cardLabel">{label}</div>
      <div className="port-cardValue">{value}</div>
      <div className="port-cardHint">{hint}</div>
    </div>
  );
}
