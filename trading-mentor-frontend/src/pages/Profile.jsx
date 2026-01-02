import React, { useEffect, useMemo, useState } from "react";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const userId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    if (!userId) {
      setErr("No active user. Please log in again.");
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`http://localhost:8080/api/profile/${userId}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed: ${res.status}`);
        }
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        setErr(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const money = useMemo(() => {
    if (!profile) return { cash: 0, reserved: 0, available: 0 };

    const cash = Number(profile.cashBalance ?? 0);
    const reserved = Number(profile.reservedCash ?? 0);
    const available = cash - reserved;

    return { cash, reserved, available };
  }, [profile]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  return (
    <div className="profile-page">
      <div className="profile-header-row">
        <div>
          <div className="profile-kicker">TradingMentor</div>
          <h2 className="profile-title">My Profile</h2>
          <div className="profile-sub">
            User ID: <b>{userId || "-"}</b>
            {profile?.accountNumber && (
              <> • Account: <b>{profile.accountNumber}</b></>
            )}
          </div>
        </div>

        <div className="profile-header-actions">
          <button className="profile-btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Loading / error states */}
      {loading && <div className="profile-info">Loading profile…</div>}
      {err && !loading && <div className="profile-error">{err}</div>}

      {!loading && !err && profile && (
        <>
          {/* Money summary cards */}
          <div className="profile-cards">
            <div className="profile-card">
              <div className="profile-card-label">Cash Balance</div>
              <div className="profile-card-value">
                ${money.cash.toFixed(2)}
              </div>
              <div className="profile-card-hint">Total cash in account</div>
            </div>

            <div className="profile-card">
              <div className="profile-card-label">Reserved Cash</div>
              <div className="profile-card-value">
                ${money.reserved.toFixed(2)}
              </div>
              <div className="profile-card-hint">
                Blocked for open BUY orders
              </div>
            </div>

            <div className="profile-card profile-card-accent">
              <div className="profile-card-label">Available to Trade</div>
              <div
                className={
                  "profile-card-value " +
                  (money.available < 100 ? "profile-bad" : "profile-good")
                }
              >
                ${money.available.toFixed(2)}
              </div>
              <div className="profile-card-hint">
                Cash Balance − Reserved Cash
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="profile-layout">
            {/* Left: personal info */}
            <div className="profile-section">
              <div className="profile-section-head">
                <h3>Personal details</h3>
                <span className="profile-tag">User</span>
              </div>

              <div className="profile-grid">
                <Field label="First name" value={profile.firstName} />
                <Field label="Last name" value={profile.lastName} />
                <Field label="Email" value={profile.email} />
                <Field label="Age" value={profile.age} />
                <Field
                  label="Birthdate"
                  value={
                    profile.birthdate
                      ? new Date(profile.birthdate).toLocaleDateString()
                      : "-"
                  }
                />
                <Field
                  label="Joined"
                  value={
                    profile.createdAt
                      ? new Date(profile.createdAt).toLocaleString()
                      : "-"
                  }
                />
              </div>
            </div>

            {/* Right: account info */}
            <div className="profile-section">
              <div className="profile-section-head">
                <h3>Account details</h3>
                <span className="profile-tag profile-tag-green">
                  Trading Account
                </span>
              </div>

              <div className="profile-grid">
                <Field
                  label="Account number"
                  value={profile.accountNumber || "-"}
                />
                <Field label="Phone" value={profile.phone || "-"} />
                <Field label="Job title" value={profile.jobTitle || "-"} />
                <Field
                  label="Income range"
                  value={profile.incomeRange || "-"}
                />

                <Field label="Address line 1" value={profile.addressLine1 || "-"} />
                <Field label="City" value={profile.city || "-"} />
                <Field label="State" value={profile.state || "-"} />
                <Field label="Country" value={profile.country || "-"} />
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !err && !profile && (
        <div className="profile-empty">
          No profile found for this user.
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="profile-field">
      <div className="profile-field-label">{label}</div>
      <div className="profile-field-value">{value || "-"}</div>
    </div>
  );
}
