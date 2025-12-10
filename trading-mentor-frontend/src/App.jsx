// src/App.jsx
import { useState } from "react";
import "./App.css";
import StocksListing from "./pages/StocksListing.jsx";
import Signup from "./pages/Signup.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import TradingAccountModal from "./pages/TradingAccountModal";
import Funds from "./pages/Funds.jsx";



const MENU_ITEMS = [
  "Dashboard",
  "Portfolio",
  "Trade History",
  "Funds",
  "Stocks Listing",
  "Profile",
]

function App() {
  // Keeps the track of which page is selected
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [currentUser, setCurrentUser] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  

const handleLoginSuccess = (user) => {
  setCurrentUser(user);
  setActiveMenu("Dashboard"); // after login, go back to dashboard
};

  const handleMenuClick = (item) => {
    setActiveMenu(item);
  };

  /*const getUserInitials = (user) => {
    if (!user) return "PM"; // default initials when not logged in
  
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    const initials = `${first}${last}`.trim();
  
    // Fallback if for some reason first/last are missing
    if (!initials && user.email) {
      return user.email[0].toUpperCase();
    }
  
    return initials.toUpperCase();
  };*/
  const getUserInitials = (user) => {
    if (!user) return "PM"; // fallback
    const first = user.firstName?.[0] ?? "";
    const last = user.lastName?.[0] ?? "";
    return (first + last || "TM").toUpperCase();
  };

  /*const handleOpenAccountModal = () => {
    // Optional: force login before account creation
    if (!currentUser) {
      alert("Please login or sign up before creating a trading account.");
      setActiveMenu("Login");
      return;
    }
    setShowAccountModal(true);
  };*/

  const handleCloseAccountModal = () => {
    setActiveMenu("Dashboard");
  };
  



  const renderContent = ()=> {
    switch (activeMenu) {
      case "Dashboard":
        return(
          <>
          <h1>Welcome to Trading Mentor</h1>
            <p>
              Learn trading with zero real money risk. We’ll plug in live/
              trending AI-picked stocks and catchy copy here later.
            </p>
          </>
        );
        case "Portfolio":
        return (
          <>
            <h1>Your Portfolio</h1>
            <p>
              This page will show your open positions, total P&amp;L, and asset
              allocation when we hook it to the backend.
            </p>
          </>
        );
        case "Trade History":
        return (
          <>
            <h1>Trade History</h1>
            <p>
              Here we’ll list all executed trades from the <code>user_trades</code> and{" "}
              <code>trades</code> tables (with filters and export later).
            </p>
          </>
        );
        case "Funds":
        return <Funds />;
        ;
        case "Stocks Listing":
        return <StocksListing currentUser={currentUser} />;// so we know who is placing orders
        
        case "Profile":
        return (
          <>
            <h1>Profile</h1>
            <p>
              Basic user details, preferences, and maybe risk profile/AI
              recommendations can go here.
            </p>
          </>
        );
        case "SignUp":
          return <Signup />;
      case "Login":
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case "ForgotPassword":
        return (
       <ForgotPassword onBackToLogin={() => setActiveMenu("Login")} />
        );
        case "OpenTradingAccount":
  return (
    <TradingAccountModal
      currentUser={currentUser}
      onClose={handleCloseAccountModal}
    />
  );

  
        default:
          return null;
    }
  };

  return(
    <div className="app-root">
      {/*Top Navigation Horizantal Bar*/}
      <header className="top-nav">
        {/* LEFT: Brand */}
        <div className="nav-left">
          <div className="brand-logo">TM</div>
          <div className="brand-text">
            <div className="brand-title">Trading Mentor</div>
            <div className="brand-subpoints">
              <span>. Practice Trading</span>
              <span>. Learn Order Matching</span>
              <span>. Track Portfolio</span>
            </div>
          </div>
        </div>
        {/* CENTER: Trading types */}
        <nav className="nav-center">
          <button className="trade-type active">Equity</button>
          <button className="trade-type active">Derivatives</button>
          <button className="trade-type active">Mutual Funds</button>
          <button className="trade-type active">Commodities</button>
        </nav>
        {/* RIGHT: User / Auth / Account */}
        <div className="nav-right">
        <div className="user-initials">{getUserInitials(currentUser)}</div>
        <button
            className="nav-btn primary"
            onClick={() =>
              currentUser ? setCurrentUser(null) : setActiveMenu("Login")
            }
          >
            {currentUser ? "Logout" : "Login"}
          </button>

          {!currentUser && (
            <button
              className="nav-btn primary"
              onClick={() => setActiveMenu("SignUp")}
            >
              Sign Up
            </button>
          )}
          {/*<button className="nav-btn primary accent" onClick={handleOpenAccountModal}> + Add Trading account</button> */}
          <button className="nav-btn primary"
  onClick={() => {
      if (!currentUser) {
        alert("Please login or sign up before creating a trading account.");
        setActiveMenu("Login");
      } else {
        setActiveMenu("OpenTradingAccount");
      }
  }}
>
  + Add Trading Account
</button>

        </div>
      </header>
      {/* MAIN LAYOUT: sidebar + dashboard content */}
      <main className="main-layout">
        {/* Left vertical menu */}
        <aside className="sidebar">
          <div className="sidebar-title">Menu</div>
          <ul className="sidebar-list">
            {MENU_ITEMS.map((item) => (
              <li
                key={item}
                className={
                  item === activeMenu ? "sidebar-item active" : "sidebar-item"
                }
                onClick={() => handleMenuClick(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content area */}
        <section className="content">{renderContent()}</section>
      </main>
    </div>
  );
}

export default App;
