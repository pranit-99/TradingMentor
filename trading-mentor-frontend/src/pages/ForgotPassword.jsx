import React, { useState } from "react";
import "./ForgotPassword.css";

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !newPassword) {
      setMessage("Please enter both email and new password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const text = await res.text();

      if (!res.ok) throw new Error(text);

      setMessage("Password updated successfully! Redirecting to login...");
      setLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        if (onBackToLogin) onBackToLogin();
      }, 2000);

    } catch (err) {
      setLoading(false);
      setMessage(err.message || "Error resetting password.");
    }
  };

  return (
    <div className="fp-page">
      <div className="fp-card">
        <h2 className="fp-title">Reset Password</h2>
        <p className="fp-subtitle">Enter your email and new password.</p>

        {message && <div className="fp-alert">{message}</div>}

        <form onSubmit={handleReset} className="fp-form">

          <div className="fp-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="fp-field">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button className="fp-btn" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <button className="fp-back-btn" onClick={onBackToLogin}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
