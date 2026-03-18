import { useEffect, useState } from "react";


export default function StockDetails({ symbol, onBack }) {
  return (
    <div style={{ color: "white", padding: "24px" }}>
      <button onClick={onBack}>← Back</button>
      <h1>Stock Details</h1>
      <p>Selected Symbol: {symbol || "NONE"}</p>
    </div>
  );
}