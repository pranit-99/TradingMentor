import "./SpinWheel.css";

export default function SpinWheelModal({ open, onClose, onSpin, spinning, result }) {
  if (!open) return null;

  const amounts = [10, 25, 50, 75, 100, 150, 200, 300]; // example

  return (
    <div className="spin-overlay">
      <div className="spin-modal">
        <div className="spin-title">Transfer Funds (Spin & Win)</div>
        <div className="spin-subtitle">Spin the wheel to get credits added to your cash balance.</div>

        <div className="wheel-wrap">
          <div className="pointer" />
          <div className={`wheel ${spinning ? "spinning" : ""}`} id="wheel">
            <div className="labels">
              {amounts.map((amt, i) => {
                const angle = (360 / amounts.length) * i;
                return (
                  <div
                    key={amt}
                    className="label"
                    style={{
                      transform: `rotate(${angle}deg) translate(110px) rotate(${90}deg)`,
                    }}
                  >
                    ${amt}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hub">{result ? `$${result}` : "SPIN"}</div>
        </div>

        <div className="spin-actions">
          <button className="btn" onClick={onClose} disabled={spinning}>Close</button>
          <button className="btn primary" onClick={onSpin} disabled={spinning}>
            {spinning ? "Spinning..." : "Spin Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
