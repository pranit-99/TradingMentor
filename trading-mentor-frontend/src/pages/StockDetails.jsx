export default function StockDetails({symbol, onBack}){
    return(
        <div>
            <button onClick={onBack} style={{marginBottom: "16px"}}>
                Back 
            </button>

            <h1>Stock Details</h1>
            <p>Selected Symbol: <b>{symbol || "N/A"}</b></p>

            <div style={{ marginTop: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                Graph and Live Stock details for <b>{symbol || "N/A"}</b> will appear in next step
            </div>
        </div>
    );
}