import React, { useEffect, useState } from "react";
import SpinWheelModal from "./SpinWheelModal";


const Funds = ({ currentUser }) => {
  const [funds, setFunds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSpin, setShowSpin] = useState(false);
const [spinning, setSpinning] = useState(false);
const [spinResult, setSpinResult] = useState(null);

  useEffect(() => {
    if (!currentUser || !currentUser.userId) {
      setError("Please log in to view funds.");
      setLoading(false);
      return;
    }

    const fetchFunds = async () => {
      try {
        setLoading(true);
        setError("");

        //  Adjust this URL if your backend endpoint name is different
        const response = await fetch(`http://localhost:8080/api/accounts/${currentUser.userId}`);


        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();
        // data should contain cashBalance and reservedCash from TradingAccount
        setFunds(data);
      } catch (err) {
        console.error("Error fetching funds:", err);
        setError("Unable to load funds right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="content-card">
        <p className="funds-subtext">Loading your funds…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-card">
        <p className="funds-error">{error}</p>
      </div>
    );
  }

  if (!funds) {
    return (
      <div className="content-card">
        <p className="funds-subtext">No trading account found for this user.</p>
      </div>
    );
  }

  const cashBalance = Number(funds.cashBalance || 0);
  const reservedCash = Number(funds.reservedCash || 0);
  const availableCash = cashBalance - reservedCash;

  const handleSpin = async () => {
    setSpinning(true);
    setSpinResult(null);
  
    // 🎯 Spin values
    const amounts = [10, 25, 50, 75, 100, 150, 200, 300];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
  
    // 🎡 Rotate wheel
    const wheel = document.getElementById("wheel");
    if (wheel) {
      const extraSpins = 6;
      const randomDeg = Math.floor(Math.random() * 360);
      wheel.style.transform = `rotate(${extraSpins * 360 + randomDeg}deg)`;
    }
  
    // ⏳ wait for animation
    setTimeout(async () => {
      try {
        // 🔗 Backend credit API
        await fetch("http://localhost:8080/api/accounts/credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.userId,
            amount: randomAmount,
          }),
        });
  
        setSpinResult(randomAmount);
        fetchFunds(); // refresh balance
      } catch (err) {
        console.error("Fund credit failed", err);
      } finally {
        setSpinning(false);
      }
    }, 3200);
  };
  

  const amountClass =
    availableCash < 100 ? "funds-amount funds-amount-low" : "funds-amount";

  return (
    <div className="content-card funds-page">
      <h2 className="funds-title">Funds Overview</h2>

      <div className="funds-main-row">
        {/* Big number card */}
        <div className="funds-balance-card">
          <span className="funds-label">Available Cash</span>
          <div className={amountClass}>${availableCash.toFixed(2)}</div>
          <p className="funds-subtext">
            {availableCash < 100
              ? "Your available funds are low. Consider adding more credits."
              : "You have enough funds to place new BUY orders."}
          </p>
        </div>

      


        {/* Side details */}
        <div className="funds-details-card">
          <div className="funds-detail-row">
            <span>Total Cash Balance</span>
            <span>${cashBalance.toFixed(2)}</span>
          </div>
          <div className="funds-detail-row">
            <span>Reserved for Open Orders</span>
            <span>${reservedCash.toFixed(2)}</span>
          </div>
        </div>

        
      </div>

      <button
  className="btn primary"
  style={{ marginTop: "16px" }}
  onClick={() => setShowSpin(true)}
>
  + Transfer Funds
</button>
<SpinWheelModal
  open={showSpin}
  onClose={() => {
    if (!spinning) {
      setShowSpin(false);
      setSpinResult(null);
    }
  }}
  onSpin={handleSpin}
  spinning={spinning}
  result={spinResult}
/>

      
    </div>
    
  );
};

export default Funds;
