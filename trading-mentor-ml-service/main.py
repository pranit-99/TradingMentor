from fastapi import FastAPI
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from fastapi.middleware.cors import CORSMiddleware
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

import yfinance as yf
import numpy as np

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

@app.get("/health")
def health():
    return {"status": "ok"}




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

    
    

    

@app.get("/health")
def health_check():
    return {"status": "ML service is running"}


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
                period="1mo",
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

        results.append({
            "symbol": symbol,
            "trend": trend,
            "risk": risk_label,
            "risk_score": risk_score,
            "volatility": round(vol, 4),
            "short_avg": round(short_avg, 2),
            "long_avg": round(long_avg, 2)
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
    Returns both Linear and Ridge predictions for easy UI comparison.
    Example: /predict_compare?symbols=AAPL,MSFT,TSLA,NVDA
    """
    linear = predict_many(symbols)
    ridge = predict_many_ridge(symbols)

    # Build maps by symbol for quick merge
    linear_map = {r.get("symbol"): r for r in (linear.get("results") or [])}
    ridge_map = {r.get("symbol"): r for r in (ridge.get("results") or [])}

    merged = []
    all_symbols = [s.strip().upper() for s in symbols.split(",") if s.strip()]

    for sym in all_symbols:
        l = linear_map.get(sym, {})
        rd = ridge_map.get(sym, {})

        merged.append({
            "symbol": sym,

            "linear": {
                "direction": l.get("direction"),
                "predicted_next_day_return": l.get("predicted_next_day_return"),
                "status": l.get("status"),
                "reason": l.get("reason"),
            },

            "ridge": {
                "direction": rd.get("direction"),
                "predicted_next_day_return": rd.get("predicted_next_day_return"),
                "status": rd.get("status"),
                "reason": rd.get("reason"),
                "feature_snapshot": rd.get("feature_snapshot"),
            },
        })

    return {"count": len(merged), "results": merged}




        
        


        
            



