// src/pages/Funds.jsx
import React, { useState } from "react";
import "../App.css"; // or "../index.css" – same file where your other styles are

function Funds() {
  // TODO: later replace this with real value from backend
  const [balance] = useState(500); // example amount

  const isLow = balance < 100;

  return (
    <div className="content-card funds-page">
      <div className="funds-header">
        <h1>Funds</h1>
        <p>Track how much virtual cash you have available for trading.</p>
      </div>

      <div className="funds-main">
        <div className="funds-card">
          <span className="funds-label">Available Funds</span>
          <span className={`funds-amount ${isLow ? "low-funds" : "ok-funds"}`}>
            ${balance.toFixed(2)}
          </span>
          <span className="funds-hint">
            {isLow
              ? "Balance is low. Add more virtual funds to keep trading."
              : "You’re good to go. Place BUY orders freely within this limit."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Funds;
