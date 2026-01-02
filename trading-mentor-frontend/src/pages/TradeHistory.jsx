import React, { useMemo, useState } from "react";
import "./TradeHistory.css";

export default function TradeHistory() {
  // ✅ Always use logged-in userId (not hardcoded)
  const userId = localStorage.getItem("userId");

  const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);

  const [symbolQ, setSymbolQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  const fetchLedger = async () => {
    try {
      setErr("");

      if (!userId) {
        setErr("User not logged in. Please login again.");
        return;
      }
      if (!fromDate || !toDate) {
        setErr("Please select From Date and To Date.");
        return;
      }
      if (fromDate > toDate) {
        setErr("From Date cannot be after To Date.");
        return;
      }

      setLoading(true);

      const url = `http://localhost:8080/api/transactions/ledger?userId=${encodeURIComponent(
        userId
      )}&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed: ${res.status}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      // ✅ Trade History = only trade-executed rows
      // Use whichever is true in your data:
      // - description contains "Trade executed"
      // - OR transactionType == "E"
      const onlyTrades = list.filter((t) => {
        const desc = (t.description || "").toLowerCase();
        const txType = (t.transactionType || "").toUpperCase();
        return desc.includes("trade executed") || txType === "E";
      });

      setRows(onlyTrades);
    } catch (e) {
      setErr(e.message || "Failed to load trade history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = symbolQ.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.symbol || "").toLowerCase().includes(q));
  }, [rows, symbolQ]);

  const totals = useMemo(() => {
    let buy = 0;
    let sell = 0;

    for (const r of filteredRows) {
      const amt = Number(r.amount ?? 0);
      const side = (r.buySellFlag || "").toUpperCase(); // "B" or "S"
      if (side === "B") buy += amt;
      else if (side === "S") sell += amt;
    }

    return {
      trades: filteredRows.length,
      totalBuy: buy,
      totalSell: sell,
      net: sell - buy, // +ve means net inflow, -ve means outflow
    };
  }, [filteredRows]);

  return (
    <div className="th-page">
      {/* Header */}
      <div className="th-header">
        <div>
          <div className="th-kicker">TradingMentor</div>
          <h2 className="th-title">Trade History</h2>
          <div className="th-sub">
            User ID: <b>{userId || "—"}</b>
          </div>
        </div>

        <div className="th-controls">
          <div className="th-field">
            <label>From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="th-field">
            <label>To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button className="th-btnPrimary" onClick={fetchLedger} disabled={loading}>
            {loading ? "Loading..." : "Ledger"}
          </button>
        </div>
      </div>

      {/* Filters + Summary */}
      <div className="th-topRow">
        <input
          className="th-search"
          placeholder="Search symbol (AAPL, MSFT...)"
          value={symbolQ}
          onChange={(e) => setSymbolQ(e.target.value)}
        />

        <div className="th-summary">
          <div className="th-chip">
            Trades: <b>{totals.trades}</b>
          </div>
          <div className="th-chip">
            Buy: <b>${totals.totalBuy.toFixed(2)}</b>
          </div>
          <div className="th-chip">
            Sell: <b>${totals.totalSell.toFixed(2)}</b>
          </div>

          <div className={`th-chip th-net ${totals.net >= 0 ? "pos" : "neg"}`}>
            Net: <b>${totals.net.toFixed(2)}</b>
          </div>
        </div>
      </div>

      {/* Errors */}
      {err && <div className="th-error">{err}</div>}

      {/* Table */}
      <div className="th-block">
        <div className="th-blockHead">
          <div className="th-blockTitle">Executed Trades</div>
          <div className="th-blockHint">
            Source: /api/transactions/ledger (filtered to trade rows)
          </div>
        </div>

        {(!loading && filteredRows.length === 0) ? (
          <div className="th-empty">
            No trades found for selected dates.
          </div>
        ) : (
          <div className="th-tableWrap">
            <table className="th-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Cr/Dr</th>
                  <th className="right">Amount</th>
                  <th>Description</th>
                  <th className="right">Order ID</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const side = (r.buySellFlag || "").toUpperCase();
                  const sideText = side === "B" ? "BUY" : side === "S" ? "SELL" : "—";
                  const cd = (r.creditDebitFlag || "").toUpperCase(); // C or D
                  const amt = Number(r.amount ?? 0);

                  return (
                    <tr key={r.transactionId}>
                      <td className="muted">
                        {r.transactionDate
                          ? new Date(r.transactionDate).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        <span className="th-symbol">{r.symbol || "-"}</span>
                      </td>

                      <td>
                        <span className={`th-pill ${side === "B" ? "buy" : "sell"}`}>
                          {sideText}
                        </span>
                      </td>

                      <td>
                        <span className={`th-pill ${cd === "C" ? "credit" : "debit"}`}>
                          {cd || "—"}
                        </span>
                      </td>

                      <td className="right">
                        ${amt.toFixed(2)}
                      </td>

                      <td className="muted">
                        {r.description || "-"}
                      </td>

                      <td className="right muted">
                        {r.orderId ?? "-"}
                      </td>

                      <td className="muted">
                        {r.accountNumber || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom total bar */}
            <div className="th-footerBar">
              <div className="th-footerBox">
                <div className="label">Total Buy</div>
                <div className="value">${totals.totalBuy.toFixed(2)}</div>
              </div>
              <div className="th-footerBox">
                <div className="label">Total Sell</div>
                <div className="value">${totals.totalSell.toFixed(2)}</div>
              </div>
              <div className={`th-footerBox net ${totals.net >= 0 ? "pos" : "neg"}`}>
                <div className="label">Net</div>
                <div className="value">${totals.net.toFixed(2)}</div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
