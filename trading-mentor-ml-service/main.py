from fastapi import FastAPI
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from fastapi.middleware.cors import CORSMiddleware
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error
from pydantic import BaseModel

import yfinance as yf
import numpy as np
import os, json, re


app = FastAPI()



app.add_middleware(
    CORSMiddleware,
   allow_origins=[
        "http://localhost:5173",
        "https://trading-mentor-nine.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KNOWN_SYMBOLS = {
    "AAPL","MSFT","GOOGL","AMZN","TSLA","META","NVDA","JPM","BAC","NFLX","V","MA","DIS","KO","PEP"
}



class ChatRequest(BaseModel):
    message: str
    

BASE_DIR = os.path.dirname(os.path.abspath(__file__))




@app.get("/health")
def health():
    return {"status": "ok"}

def handle_greetings(text: str):
    if text in ["hi", "hello", "hey", "hii", "helo"]:
        return "Hi! I'm your Trading Mentor Nirmala. How can I help you today?"

    if "good morning" in text:
        return "Good Morning! I'm your Trading Mentor Nirmala. How can I help you today?"

    if "good evening" in text:
        return "Good Evening! I'm your Trading Mentor Nirmala. How can I help you today?"

    if "good afternoon" in text:
        return "Good Afternoon! I'm your Trading Mentor Nirmala. How can I help you today?"

    if text in ["how are you", "how are you?"]:
        return "I’m doing great and ready to help you with trading concepts step by step."

    if text in ["who are you", "who are you?"]:
        return "I’m Nirmala, your Trading Mentor chatbot. Right now I can help with basic greetings, and I am getting Trained, so that i can clear your doubts regarding trading concepts.. Wish Me Luck."

    return None

def handle_trading_concepts(text: str):
    if "equity" in text:
        return "Equity means ownership in a company. If you buy a stock, you own a small part of that company."

    if "stock" in text:
        return "A stock is a share of ownership in a company. Its value can go up or down based on company performance and market conditions."

    if "trading" in text:
        return "Trading means buying and selling financial assets like stocks to make a profit from price changes."

    if "volatility" in text:
        return "Volatility shows how much a stock price moves up and down. Higher volatility means bigger price swings and usually higher risk."

    if "risk" in text:
        return "Risk is the chance of losing money or getting a lower return than expected in an investment."

    if "investment" in text:
        return "Investment means putting money into an asset like stocks, bonds, or funds with the goal of growing it over time."

    return None

def handle_dashboard_concepts(text: str):
    if "buy signal" in text:
        return "A buy signal suggests that a stock may have a favorable chance of moving upward based on the model or indicators being used."

    if "sell signal" in text:
        return "A sell signal suggests that a stock may be weakening or may have a higher chance of moving downward."

    if "trend" in text:
        return "Trend shows the overall market direction of a stock, such as upward, downward, or neutral movement."

    if "risk score" in text:
        return "Risk score is a simplified value used to represent how risky a stock currently appears. A higher risk score usually means more uncertainty or price movement."

    if "prediction" in text:
        return "Prediction is the model’s estimate of how the stock may move next based on historical data and selected features."

    if "confidence" in text:
        return "Confidence shows how strongly the model believes in its prediction. Higher confidence usually means the signal is more reliable, but it is never a guarantee."

    return None

def handle_symbol_queries(text: str):
    symbol = extract_known_symbol(text)
    if not symbol:
        return None

    try:
        result = overview(symbols=symbol)

        if not result or "results" not in result or not result["results"]:
            return f"I found the symbol {symbol}, but I could not fetch its live dashboard details right now."

        row = result["results"][0]

        trend = row.get("trend", "UNKNOWN")
        risk = row.get("risk", "UNKNOWN")
        risk_score = row.get("risk_score", "N/A")
        volatility = row.get("volatility", "N/A")

        return (
            f"{symbol} currently shows trend: {trend}, risk: {risk}, "
            f"risk score: {risk_score}, and volatility: {volatility}."
        )

    except Exception as e:
        return f"I found the symbol {symbol}, but there was an error fetching live data: {str(e)}"

        

def extract_known_symbol(text: str):
    words = re.findall(r"[A-Za-z]+", text.upper())

    for word in words:
        if word in known_symbols:
            return word
    return None
        
    
    

def get_basic_chat_response(message: str) -> str:
    text = message.strip().lower()

    greeting_reply = handle_greetings(text)
    if greeting_reply:
        return greeting_reply

    concept_reply = handle_trading_concepts(text)
    if concept_reply:
        return concept_reply

    dashboard_reply = handle_dashboard_concepts(text)
    if dashboard_reply:
        return dashboard_reply

    symbol_reply = handle_symbol_queries(text)
    if symbol_reply:
        return symbol_reply

    return "I am still learning. Please start with a greeting like hi or hello."


def compute_trend_from_close_prices(close_prices: np.ndarray) -> tuple[str, float, float]:
    """
    Trend rules:
    - GREEN if short_avg > long_avg by 1%+
    - RED if short_avg < long_avg by 1%+
    - YELLOW otherwise
    """
    short_avg = np.mean(close_prices[-5:])
    long_avg = np.mean(close_prices[-20:])

    if short_avg > long_avg * 1.01:
        trend = "GREEN"
    elif short_avg < long_avg * 0.99:
        trend = "RED"
    else:
        trend = "YELLOW"

    return trend, float(short_avg), float(long_avg)

def compute_risk_from_close_prices(close_prices: np.ndarray) -> tuple[str, int, float]:
    """
    Returns (risk_label, risk_score, volatility)
    Uses volatility (std dev of daily returns).
    """
    returns = (close_prices[1:] - close_prices[:-1]) / close_prices[:-1]
    vol = float(np.std(returns))

    if vol < 0.015:
        return "LOW", 25, vol
    elif vol < 0.035:
        return "MEDIUM", 55, vol
    else:
        return "HIGH", 85, vol

def compute_rsi(close_prices: np.ndarray, period: int = 14) -> float:
    """
    RSI (Relative Strength Index).
    Returns a single latest RSI value.
    """
    if len(close_prices) < period + 1:
        return float("nan")

    deltas = np.diff(close_prices)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return float(rsi)

def explain_tuned_prediction(feature_snapshot: dict, direction: str) -> str:
    """
    Creates a simple human-readable explanation using feature_snapshot.
    This is a rule-based explanation (XAI-style) for learning dashboards.
    """
    if not feature_snapshot:
        return "Not enough features to explain."

    vol20 = feature_snapshot.get("vol20")
    sma = feature_snapshot.get("sma5_vs_sma20")
    mom5 = feature_snapshot.get("momentum5")
    rsi = feature_snapshot.get("rsi14")

    reasons = []

    # RSI interpretation
    if isinstance(rsi, (int, float)):
        if rsi >= 70:
            reasons.append(f"RSI {rsi} (overbought)")
        elif rsi <= 30:
            reasons.append(f"RSI {rsi} (oversold)")
        else:
            reasons.append(f"RSI {rsi} (neutral)")

    # Momentum
    if isinstance(mom5, (int, float)):
        if mom5 > 0.02:
            reasons.append(f"momentum5 +{round(mom5*100,2)}% (strong positive)")
        elif mom5 < -0.02:
            reasons.append(f"momentum5 {round(mom5*100,2)}% (strong negative)")
        else:
            reasons.append(f"momentum5 {round(mom5*100,2)}% (mild)")

    # Trend structure
    if isinstance(sma, (int, float)):
        if sma > 0.01:
            reasons.append("SMA5 above SMA20 (up-trend structure)")
        elif sma < -0.01:
            reasons.append("SMA5 below SMA20 (down-trend structure)")
        else:
            reasons.append("SMA5 close to SMA20 (sideways)")

    # Volatility
    if isinstance(vol20, (int, float)):
        if vol20 > 0.02:
            reasons.append(f"high volatility ({vol20})")
        elif vol20 < 0.01:
            reasons.append(f"low volatility ({vol20})")
        else:
            reasons.append(f"moderate volatility ({vol20})")

    # Combine into final explanation based on direction
    if direction == "UP":
        return "Why UP: " + ", ".join(reasons)
    if direction == "DOWN":
        return "Why DOWN: " + ", ".join(reasons)
    return "Why FLAT: " + ", ".join(reasons)

def compute_anomaly_from_close_prices(close_prices: np.ndarray) -> dict:
    """
    Simple anomaly detection (volatility spike):
    - Compare short-term vol (last 5 returns) vs baseline vol (last 20 returns).
    - Flag anomaly when short vol is much higher than baseline AND last move is large.
    """
    # Need enough closes for 20-day returns
    if close_prices is None or len(close_prices) < 25:
        return {"flag": False, "label": "NONE", "score": 0, "reason": "Not enough data"}

    # daily returns
    rets = (close_prices[1:] - close_prices[:-1]) / close_prices[:-1]

    # baseline (20) and recent (5)
    base = rets[-20:]
    recent = rets[-5:]

    base_vol = float(np.std(base))
    recent_vol = float(np.std(recent))
    last_ret = float(rets[-1])

    # Avoid divide-by-zero
    if base_vol <= 1e-9:
        return {"flag": False, "label": "NONE", "score": 0, "reason": "Baseline vol too small"}

    ratio = recent_vol / base_vol
    last_move_sigma = abs(last_ret) / base_vol

    # thresholds (simple, learning-friendly)
    is_spike = (ratio >= 1.8) and (last_move_sigma >= 2.0)

    if not is_spike:
        return {
            "flag": False,
            "label": "NONE",
            "score": int(min(99, ratio * 20)),
            "reason": f"Stable (ratio={ratio:.2f}, last_move_sigma={last_move_sigma:.2f})"
        }

    # severity
    if ratio >= 2.5 or last_move_sigma >= 3.0:
        label = "HIGH"
        score = 85
    else:
        label = "MEDIUM"
        score = 65

    return {
        "flag": True,
        "label": label,
        "score": score,
        "reason": f"Vol spike: ratio={ratio:.2f}, last_move={last_ret*100:.2f}% (~{last_move_sigma:.1f}σ)"
    }


   

@app.get("/health")
def health_check():
    return {"status": "ML service is running"}

@app.post("/chat")
def chat(req: ChatRequest):
    return {"answer": get_basic_chat_response(req.message)}


@app.get("/trend")
def stock_trend(symbol: str):
    """
    Returns trend for a stock:
    GREEN / YELLOW / RED
    """

    # 1) Download last 1 month of daily price data
    data = yf.download(symbol, period="1mo", interval="1d")

    # Safety check
    if data.empty or len(data) < 20:
        return {"symbol": symbol.upper(), "trend": "UNKNOWN", "reason": "Not enough data"}

    # 2) Extract closing prices
    close_prices = data["Close"].values

    # 3) Compute moving averages
    #short_avg = np.mean(close_prices[-5:])
    #ong_avg = np.mean(close_prices[-20:])
    trend, short_avg, long_avg = compute_trend_from_close_prices(close_prices)


    # 4) Determine trend with a 1% buffer to avoid noise
    if short_avg > long_avg * 1.01:
        trend = "GREEN"
    elif short_avg < long_avg * 0.99:
        trend = "RED"
    else:
        trend = "YELLOW"

    return {
        "symbol": symbol.upper(),
        "short_avg": round(float(short_avg), 2),
        "long_avg": round(float(long_avg), 2),
        "trend": trend
    }

@app.get("/trending")
def trending_stocks(symbols: str):
    symbol_list = symbols.split(",")
    results = []

    for symbol in symbol_list:
        symbol = symbol.strip().upper()
        data = yf.download(symbol, period="1mo", interval="1d")

        if data.empty or len(data) < 20:
            results.append({
                "symbol": symbol,
                "trend": "UNKNOWN"
                })
            continue

        close_prices = data["Close"].values

        trend, _, _ = compute_trend_from_close_prices(close_prices)


        results.append({
            "symbol": symbol,
            "trend": trend
        })

    return {
        "count": len(results),
        "results": results
    }

@app.get("/risk")
def stock_risk(symbol: str):
    """
    Simple risk estimation using volatility of daily returns (last ~1 month).
    """
    data = yf.download(symbol, period="1mo", interval="1d")

    if data.empty or len(data) < 20:
        return {"Symbol": symbol.upper(), "Risk": "UNKNOWN", "Reason": "Not Enough Data"}

    close_prices = data["Close"].values

    # 1. Compute daily returns
    returns = (close_prices[1:] - close_prices[:-1]) / close_prices[:-1]

    #2. volatility = standard deviation of returns
    vol = float(np.std(returns))

    #3Convert volatility to label + score
    # These thresholds are simple starter values for learning
    if vol < 0.015:
        risk_label = "LOW"
        risk_score = 25
    elif vol < 0.035:
        risk_label = "MEDIUM"
        risk_score = 55
    else:
        risk_label = "HIGH"
        risk_score = 85
    return{
        "Symbol": symbol.upper(),
        "Volatility": round(vol, 4),
        "Risk": risk_label,
        "Risk_Score": risk_score
        }

@app.get("/prices")
def stock_prices(symbol: str):
    """
    Returns last 1 month daily close prices for charting.
    Example: /prices?symbol=AAPL
    """
    data = yf.download(symbol, period="1mo", interval="1d")

    if data.empty:
        return {"symbol": symbol.upper(), "dates": [], "closes": [], "reason": "No data found"}

    # Close can be Series OR a 1-column DataFrame depending on yfinance output
    close_obj = data["Close"]
    if hasattr(close_obj, "columns"):  # means it's a DataFrame
        close_obj = close_obj.iloc[:, 0]  # take first column

    # Now close_obj is a Series -> convert to 1D float array
    close_values = close_obj.to_numpy().astype(float)

    dates = [d.strftime("%Y-%m-%d") for d in data.index.to_pydatetime()]
    closes = [round(x, 2) for x in close_values]

    return {
        "symbol": symbol.upper(),
        "dates": dates,
        "closes": closes
    }

@app.get("/overview")
def overview(symbols: str):
    """
    Returns trend + risk for multiple stocks.
    Example: /overview?symbols=AAPL,MSFT,TSLA,NVDA
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results = []

    for symbol in symbol_list:
        try:
            data = yf.download(
                symbol,
                period="3mo",
                interval="1d",
                progress=False,
                threads=False
                )
        except Exception:
            data = None

        if data is None or getattr(data, "empty", True) or len(data) < 20:
            results.append({
                "symbol": symbol,
                "trend": "UNKNOWN",
                "risk": "UNKNOWN",
                "reason": "Download failed or insufficient data"
                })
            continue

        close_obj = data["Close"]
        if hasattr(close_obj, "columns"):   # if Close is a 1-col DataFrame
            close_obj = close_obj.iloc[:, 0]

        close_prices = close_obj.to_numpy().astype(float)

        trend, short_avg, long_avg = compute_trend_from_close_prices(close_prices)
        risk_label, risk_score, vol = compute_risk_from_close_prices(close_prices)
        anomaly = compute_anomaly_from_close_prices(close_prices)

        results.append({
            "symbol": symbol,
            "trend": trend,
            "risk": risk_label,
            "risk_score": risk_score,
            "volatility": round(vol, 4),
            "short_avg": round(short_avg, 2),
            "long_avg": round(long_avg, 2),
            "anomaly": anomaly
        })

    return {"count": len(results), "results": results}

@app.get("/predict")
def predict_next_day(symbol: str):
    """
    ML Prediction: Predict next-day return using Linear Regression.
    Example: /predict?symbol=AAPL
    """
    data = yf.download(symbol, period="6mo", interval="1d")

    if data.empty or len(data) < 60:
        return {"symbol": symbol.upper(), "status": "UNKNOWN", "reason": "Not enough data (need ~60+ days)"}

    # --- 1) Extract Close safely (same pattern you used earlier) ---
    close_obj = data["Close"]
    if hasattr(close_obj, "columns"):
        close_obj = close_obj.iloc[:, 0]
    close_prices = close_obj.to_numpy().astype(float)

    # --- 2) Build daily returns ---
    returns = (close_prices[1:] - close_prices[:-1]) / close_prices[:-1]

    # We need enough history for lag features
    lag = 5
    if len(returns) <= lag + 10:
        return {"symbol": symbol.upper(), "status": "UNKNOWN", "reason": "Not enough returns for lag features"}

    # --- 3) Create ML dataset (X features, y target) ---
    X = []
    y = []

    # for each day t, predict return[t] using past lag returns + rolling volatility
    for t in range(lag, len(returns)):
        past_returns = returns[t-lag:t]  # last 5 returns
        vol = float(np.std(past_returns))  # volatility of last 5 returns

        features = list(past_returns) + [vol]  # 6 features total
        X.append(features)
        y.append(float(returns[t]))

    X = np.array(X)
    y = np.array(y)

    # --- 4) Train/Test split (to see if model learned something) ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model = LinearRegression()
    model.fit(X_train, y_train)

    # --- 5) Evaluate quickly ---
    y_pred_test = model.predict(X_test)
    score = float(r2_score(y_test, y_pred_test)) if len(y_test) > 1 else 0.0

    # --- 6) Predict next-day return using latest features ---
    latest_past_returns = returns[-lag:]
    latest_vol = float(np.std(latest_past_returns))
    latest_features = np.array([list(latest_past_returns) + [latest_vol]])

    predicted_return = float(model.predict(latest_features)[0])

    last_close = float(close_prices[-1])
    predicted_close = last_close * (1 + predicted_return)

    direction = "UP" if predicted_return > 0 else "DOWN" if predicted_return < 0 else "FLAT"

    return {
        "symbol": symbol.upper(),
        "model": "LinearRegression",
        "features": {
            "lag_returns_used": lag,
            "latest_volatility": round(latest_vol, 4),
        },
        "prediction": {
            "predicted_next_day_return": round(predicted_return, 6),
            "direction": direction,
            "last_close": round(last_close, 2),
            "predicted_next_close": round(predicted_close, 2),
        },
        "model_quality": {
            "r2_score": round(score, 4),
            "note": "R2 can be low/noisy for stock returns; this is a learning baseline."
        }
    }

@app.get("/predict_many")
def predict_many(symbols: str):
    """
    Predict next-day return for multiple symbols.
    Example: /predict_many?symbols=AAPL,MSFT,TSLA,NVDA
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results = []

    for symbol in symbol_list:
        try:
            # reuse the single predict logic by calling the function body pattern again (simple for now)
            data = yf.download(symbol, period="6mo", interval="1d")

            if data.empty or len(data) < 60:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough data"})
                continue

            close_obj = data["Close"]
            if hasattr(close_obj, "columns"):
                close_obj = close_obj.iloc[:, 0]
            close_prices = close_obj.to_numpy().astype(float)

            returns = (close_prices[1:] - close_prices[:-1]) / close_prices[:-1]
            lag = 5

            if len(returns) <= lag + 10:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough returns"})
                continue

            X, y = [], []
            for t in range(lag, len(returns)):
                past_returns = returns[t-lag:t]
                vol = float(np.std(past_returns))
                X.append(list(past_returns) + [vol])
                y.append(float(returns[t]))

            X = np.array(X)
            y = np.array(y)

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, shuffle=False
            )

            model = LinearRegression()
            model.fit(X_train, y_train)

            latest_past_returns = returns[-lag:]
            latest_vol = float(np.std(latest_past_returns))
            latest_features = np.array([list(latest_past_returns) + [latest_vol]])

            predicted_return = float(model.predict(latest_features)[0])

            direction = "UP" if predicted_return > 0 else "DOWN" if predicted_return < 0 else "FLAT"

            results.append({
                "symbol": symbol,
                "direction": direction,
                "predicted_next_day_return": round(predicted_return, 6)
            })

        except Exception as e:
            results.append({"symbol": symbol, "status": "ERROR", "reason": str(e)})

    return {"count": len(results), "results": results}

@app.get("/predict_many_ridge")
def predict_many_ridge(symbols: str):
    """
    Improved ML: Ridge + Scaling + more features.
    Example: /predict_many_ridge?symbols=AAPL,MSFT,TSLA,NVDA
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results = []

    for symbol in symbol_list:
        try:
            data = yf.download(symbol, period="6mo", interval="1d", progress=False, threads=False)

            if data is None or getattr(data, "empty", True) or len(data) < 80:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough data (~80 days needed)"})
                continue

            # Close safely
            close_obj = data["Close"]
            if hasattr(close_obj, "columns"):
                close_obj = close_obj.iloc[:, 0]
            close = close_obj.to_numpy().astype(float)

            # Returns
            returns = (close[1:] - close[:-1]) / close[:-1]

            lag = 5
            if len(returns) <= lag + 30:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough returns for features"})
                continue

            X, y = [], []

            # Build dataset: for each t, predict return[t] using features from history up to t
            for t in range(lag, len(returns)):
                past5 = returns[t-lag:t]  # last 5 returns

                # Extra features (computed from close history)
                # Map return index t to close index (t corresponds to close[t+1])
                close_slice = close[: t + 1]  # up to today
                if len(close_slice) < 30:
                    continue

                sma5 = float(np.mean(close_slice[-5:]))
                sma20 = float(np.mean(close_slice[-20:]))
                momentum5 = float((close_slice[-1] / close_slice[-6]) - 1.0)  # last 5-day move
                vol20 = float(np.std(returns[max(0, t-20):t]))  # volatility over last 20 returns
                rsi14 = compute_rsi(close_slice, period=14)

                # Feature vector
                features = list(past5) + [
                    vol20,
                    (sma5 / sma20) - 1.0,
                    momentum5,
                    rsi14
                ]

                # Target
                X.append(features)
                y.append(float(returns[t]))

            if len(X) < 50:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough rows after feature build"})
                continue

            X = np.array(X, dtype=float)
            y = np.array(y, dtype=float)

            # Train/test split (time order)
            split = int(len(X) * 0.8)
            X_train, X_test = X[:split], X[split:]
            y_train, y_test = y[:split], y[split:]

            # Ridge + Scaling
            model = make_pipeline(StandardScaler(), Ridge(alpha=1.0))
            model.fit(X_train, y_train)

            # Predict next day using latest features
            latest_close_slice = close
            latest_past5 = returns[-lag:]
            sma5 = float(np.mean(latest_close_slice[-5:]))
            sma20 = float(np.mean(latest_close_slice[-20:]))
            momentum5 = float((latest_close_slice[-1] / latest_close_slice[-6]) - 1.0)
            vol20 = float(np.std(returns[-20:]))
            rsi14 = compute_rsi(latest_close_slice, period=14)

            latest_features = np.array([list(latest_past5) + [vol20, (sma5 / sma20) - 1.0, momentum5, rsi14]], dtype=float)
            pred_return = float(model.predict(latest_features)[0])

            direction = "UP" if pred_return > 0 else "DOWN" if pred_return < 0 else "FLAT"

            results.append({
                "symbol": symbol,
                "model": "Ridge(alpha=1.0)+StandardScaler",
                "direction": direction,
                "predicted_next_day_return": round(pred_return, 6),
                "feature_snapshot": {
                    "vol20": round(vol20, 4),
                    "sma5_vs_sma20": round((sma5 / sma20) - 1.0, 4),
                    "momentum5": round(momentum5, 4),
                    "rsi14": None if np.isnan(rsi14) else round(rsi14, 2)
                }
            })

        except Exception as e:
            results.append({"symbol": symbol, "status": "ERROR", "reason": str(e)})

    return {"count": len(results), "results": results}

@app.get("/predict_compare")
def predict_compare(symbols: str):
    """
    Returns Linear + Ridge(fixed) + Ridge(tuned) predictions for UI comparison.
    Example: /predict_compare?symbols=AAPL,MSFT,TSLA,NVDA
    """
    linear = predict_many(symbols)
    ridge_fixed = predict_many_ridge(symbols)
    ridge_tuned = predict_many_ridge_tuned(symbols)

    linear_map = {r.get("symbol"): r for r in (linear.get("results") or [])}
    fixed_map = {r.get("symbol"): r for r in (ridge_fixed.get("results") or [])}
    tuned_map = {r.get("symbol"): r for r in (ridge_tuned.get("results") or [])}

    merged = []
    all_symbols = [s.strip().upper() for s in symbols.split(",") if s.strip()]

    for sym in all_symbols:
        l = linear_map.get(sym, {})
        fx = fixed_map.get(sym, {})
        td = tuned_map.get(sym, {})

        merged.append({
            "symbol": sym,

            "linear": {
                "direction": l.get("direction"),
                "predicted_next_day_return": l.get("predicted_next_day_return"),
                "status": l.get("status"),
                "reason": l.get("reason"),
            },

            "ridge_fixed": {
                "direction": fx.get("direction"),
                "predicted_next_day_return": fx.get("predicted_next_day_return"),
                "status": fx.get("status"),
                "reason": fx.get("reason"),
            },

            "ridge_tuned": {
                "direction": td.get("direction"),
                "predicted_next_day_return": td.get("predicted_next_day_return"),
                "best_alpha": td.get("best_alpha"),
                "val_mae": td.get("val_mae"),
                "confidence": td.get("confidence"),
                "feature_snapshot": td.get("feature_snapshot"),
                "explanation": td.get("explanation"),
                "status": td.get("status"),
                "reason": td.get("reason"),
            },
        })

    return {"count": len(merged), "results": merged}



@app.get("/predict_many_ridge_tuned")
def predict_many_ridge_tuned(symbols: str):
    """
    Ridge tuned: tries multiple alphas and selects the best using time-based validation MAE.
    Example: /predict_many_ridge_tuned?symbols=AAPL,MSFT,TSLA,NVDA
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results = []

    alphas_to_try = [0.1, 1.0, 10.0, 50.0]

    for symbol in symbol_list:
        try:
            data = yf.download(symbol, period="6mo", interval="1d", progress=False, threads=False)

            if data is None or getattr(data, "empty", True) or len(data) < 80:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough data (~80 days needed)"})
                continue

            # Close safely
            close_obj = data["Close"]
            if hasattr(close_obj, "columns"):
                close_obj = close_obj.iloc[:, 0]
            close = close_obj.to_numpy().astype(float)

            # Returns
            returns = (close[1:] - close[:-1]) / close[:-1]
            lag = 5

            if len(returns) <= lag + 30:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough returns for features"})
                continue

            # Build dataset
            X, y = [], []
            for t in range(lag, len(returns)):
                past5 = returns[t-lag:t]
                close_slice = close[: t + 1]
                if len(close_slice) < 30:
                    continue

                sma5 = float(np.mean(close_slice[-5:]))
                sma20 = float(np.mean(close_slice[-20:]))
                momentum5 = float((close_slice[-1] / close_slice[-6]) - 1.0)
                vol20 = float(np.std(returns[max(0, t-20):t]))
                rsi14 = compute_rsi(close_slice, period=14)

                features = list(past5) + [
                    vol20,
                    (sma5 / sma20) - 1.0,
                    momentum5,
                    rsi14
                ]

                X.append(features)
                y.append(float(returns[t]))

            if len(X) < 60:
                results.append({"symbol": symbol, "status": "UNKNOWN", "reason": "Not enough rows after feature build"})
                continue

            X = np.array(X, dtype=float)
            y = np.array(y, dtype=float)

            # Time-based split: train first 80%, validate last 20%
            split = int(len(X) * 0.8)
            X_train, X_val = X[:split], X[split:]
            y_train, y_val = y[:split], y[split:]

            best_alpha = None
            best_mae = None

            for a in alphas_to_try:
                model = make_pipeline(StandardScaler(), Ridge(alpha=a))
                model.fit(X_train, y_train)
                val_pred = model.predict(X_val)
                mae = float(mean_absolute_error(y_val, val_pred))

                if best_mae is None or mae < best_mae:
                    best_mae = mae
                    best_alpha = a

                # Confidence from validation MAE (learning baseline)
                if best_mae <= 0.010:
                    confidence_label = "HIGH"
                    confidence_pct = 80
                elif best_mae <= 0.020:
                    confidence_label = "MEDIUM"
                    confidence_pct = 60
                else:
                    confidence_label = "LOW"
                    confidence_pct = 40
                    

            # Train final model with best alpha on all available data (train+val)
            final_model = make_pipeline(StandardScaler(), Ridge(alpha=best_alpha))
            final_model.fit(X, y)

            # Build latest features for next-day prediction
            latest_close_slice = close
            latest_past5 = returns[-lag:]
            sma5 = float(np.mean(latest_close_slice[-5:]))
            sma20 = float(np.mean(latest_close_slice[-20:]))
            momentum5 = float((latest_close_slice[-1] / latest_close_slice[-6]) - 1.0)
            vol20 = float(np.std(returns[-20:]))
            rsi14 = compute_rsi(latest_close_slice, period=14)
            


            latest_features = np.array(
                [list(latest_past5) + [vol20, (sma5 / sma20) - 1.0, momentum5, rsi14]],
                dtype=float
            )

            pred_return = float(final_model.predict(latest_features)[0])
            direction = "UP" if pred_return > 0 else "DOWN" if pred_return < 0 else "FLAT"
            feature_snapshot = {
                "vol20": round(vol20, 4),
                "sma5_vs_sma20": round((sma5 / sma20) - 1.0, 4),
                "momentum5": round(momentum5, 4),
                "rsi14": None if np.isnan(rsi14) else round(rsi14, 2)
                }
            explanation = explain_tuned_prediction(feature_snapshot, direction)
            


            results.append({
                "symbol": symbol,
                "model": "Ridge+StandardScaler (tuned)",
                "best_alpha": best_alpha,
                "val_mae": round(best_mae, 6),
                "direction": direction,
                "predicted_next_day_return": round(pred_return, 6),
                "confidence": {
                    "label": confidence_label,
                    "percent": confidence_pct
                    },
                "feature_snapshot": feature_snapshot,
                "explanation": explanation
            })

        except Exception as e:
            results.append({"symbol": symbol, "status": "ERROR", "reason": str(e)})

    return {"count": len(results), "results": results}
           

            

                

            
    




        
        


        
            












    

        
        
        

            
            
    
        
        


        
            



