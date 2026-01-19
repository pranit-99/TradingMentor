import "./SignupBonusModal.css";

export default function SignupBonusModal({firstName = "Trader", onClose}){
    return(
        <div className="bonus-backdrop" onClick={onClose}>
            <div className="bonus-card"  onClick={(e) => e.stopPropagation()}>
                <button className="bonus-close" onClick={onClose}>X</button>
                <div className="bonus-badge"> Welcome Bonus</div>
                <h2 className="bonus-title">Welcome, {firstName}!</h2>

                <p className="bonus-text">
                    Your Trading account is created successfully.
                    <br />
                We’ve credited <span className="bonus-amount">$500</span> to your{" "}
          <     span className="bonus-highlight">paper trading</span> wallet.
                </p>

                <div className="bonus-actions">
                    <button className="bonus-primary" onClick={onClose}>
                    Start Trading
                    </button>
                    </div>

            </div>
        </div>
    );
}