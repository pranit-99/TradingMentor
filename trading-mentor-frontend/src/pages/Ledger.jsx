import React, { useMemo, useState } from "react";

export default function Ledger() {
  const [userId, setUserId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const handleFetchLedger = async () => {
    setError("");
    setRows([]);

    if (!userId || !fromDate || !toDate) {
      setError("Please enter User ID, From Date, and To Date.");
      return;
    }

    setLoading(true);
    try {
      const url = `http://localhost:8080/api/transactions/ledger?userId=${encodeURIComponent(
        userId
      )}&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed with status ${res.status}`);
      }

      const data = await res.json();
      //setRows(Array.isArray(data) ? data : []);
      const list = Array.isArray(data) ? data : [];
list.sort((a, b) => {
  const da = new Date(a.transactionDate || a.tradeDate || 0).getTime();
  const db = new Date(b.transactionDate || b.tradeDate || 0).getTime();
  return db - da; // latest first
});
setRows(list);

    } catch (e) {
      setError(e.message || "Something went wrong while loading ledger.");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;

    for (const r of rows) {
      const amt = Number(r.amount || 0);
      if (r.creditDebitFlag === "D") debit += amt;
      if (r.creditDebitFlag === "C") credit += amt;
    }

    return {
      debit,
      credit,
      net: credit - debit,
    };
  }, [rows]);

  const formatMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Ledger</h2>
        <p style={styles.subtitle}>
          View debit/credit history between selected dates
        </p>

        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>User ID</label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., 2"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            onClick={handleFetchLedger}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Ledger"}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {rows.length > 0 && (
  <div style={styles.summary}>
    Showing <b>{rows.length}</b> records for User <b>{userId}</b> from{" "}
    <b>{fromDate}</b> to <b>{toDate}</b>
  </div>
)}


        <div style={styles.tableWrap}>
          <div style={styles.tableHeaderRow}>
            <div style={styles.th}>Transaction Date</div>
            <div style={styles.th}>Symbol</div>
            <div style={styles.th}>Description</div>
            <div style={styles.thCenter}>D / C</div>
            <div style={styles.thRight}>Amount</div>
          </div>

          {rows.length === 0 ? (
            <div style={styles.empty}>
              {loading ? "Loading..." : "No records found. Try a wider date range or verify User ID."}
            </div>
          ) : (
            rows.map((r) => {
              const isDebit = r.creditDebitFlag === "D";
              const badgeStyle = isDebit ? styles.badgeDebit : styles.badgeCredit;

              return (
                <div key={r.transactionId} style={styles.trRow}>
                  <div style={styles.td}>
                    {r.transactionDate
                      ? new Date(r.transactionDate).toLocaleString()
                      : "-"}
                  </div>
                  <div style={styles.td}>{r.symbol || "-"}</div>
                  <div style={styles.td}>{r.description || "-"}</div>

                  <div style={styles.tdCenter}>
                    <span style={badgeStyle}>
                      {isDebit ? "DEBIT" : "CREDIT"}
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.tdRight,
                      color: isDebit ? "#ff6b6b" : "#2ee59d",
                      fontWeight: 800,
                    }}
                  >
                    {formatMoney(r.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals Bottom Center */}
        <div style={styles.totalsBox}>
          <div style={styles.totalItem}>
            <div style={styles.totalLabel}>Total Debit</div>
            <div style={{ ...styles.totalValue, color: "#ff6b6b" }}>
              {formatMoney(totals.debit)}
            </div>
          </div>

          <div style={styles.totalItem}>
            <div style={styles.totalLabel}>Total Credit</div>
            <div style={{ ...styles.totalValue, color: "#2ee59d" }}>
              {formatMoney(totals.credit)}
            </div>
          </div>

          <div style={styles.totalItem}>
            <div style={styles.totalLabel}>Net (C − D)</div>
            <div
              style={{
                ...styles.totalValue,
                color: totals.net >= 0 ? "#2ee59d" : "#ff6b6b",
              }}
            >
              {formatMoney(totals.net)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background: "#0b1220",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    width: "100%",
    maxWidth: "1100px",
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  title: { margin: 0, color: "#fff", fontSize: "22px" },
  subtitle: { marginTop: "6px", color: "rgba(255,255,255,0.7)" },

  formRow: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 140px",
    gap: "12px",
    alignItems: "end",
  },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { color: "rgba(255,255,255,0.8)", fontSize: "13px" },
  input: {
    height: "40px",
    padding: "0 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0b1220",
    color: "#fff",
    outline: "none",
  },
  button: {
    height: "40px",
    borderRadius: "10px",
    border: "none",
    background: "#2f6fed",
    color: "#fff",
    fontWeight: 800,
  },

  error: {
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "rgba(255, 80, 80, 0.12)",
    border: "1px solid rgba(255, 80, 80, 0.35)",
    color: "#ffb3b3",
  },

  tableWrap: {
    marginTop: "16px",
    borderRadius: "12px",
    background: "#0b1220",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  tableHeaderRow: {
    display: "grid",
    gridTemplateColumns: "220px 110px 1fr 120px 150px",
    gap: "10px",
    padding: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 800,
    fontSize: "13px",
  },
  th: { opacity: 0.95 },
  thCenter: { textAlign: "center", opacity: 0.95 },
  thRight: { textAlign: "right", opacity: 0.95 },

  trRow: {
    display: "grid",
    gridTemplateColumns: "220px 110px 1fr 120px 150px",
    gap: "10px",
    padding: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.85)",
    fontSize: "13px",
  },

  td: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  tdCenter: { textAlign: "center" },
  tdRight: { textAlign: "right" },

  badgeDebit: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255, 107, 107, 0.14)",
    border: "1px solid rgba(255, 107, 107, 0.35)",
    color: "#ffb3b3",
    fontWeight: 800,
    fontSize: "12px",
  },
  badgeCredit: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(46, 229, 157, 0.12)",
    border: "1px solid rgba(46, 229, 157, 0.35)",
    color: "#a6ffd9",
    fontWeight: 800,
    fontSize: "12px",
  },

  empty: {
    padding: "18px",
    color: "rgba(255,255,255,0.65)",
  },
  summary: {
    marginTop: "10px",
    color: "rgba(255,255,255,0.8)",
    fontSize: "13px",
  },
  

  totalsBox: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
    gap: "18px",
    padding: "12px",
    borderRadius: "12px",
    background: "#0b1220",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  totalItem: { textAlign: "center", minWidth: "180px" },
  totalLabel: { color: "rgba(255,255,255,0.7)", fontSize: "12px" },
  totalValue: { color: "#fff", fontSize: "18px", fontWeight: 900, marginTop: "4px" },
};
