// src/pages/TradingAccountModal.jsx
import { useState } from "react";
import "./TradingAccountModal.css"; // we'll add this in step 3

function TradingAccountModal({ currentUser, onClose }) {
  // Pre-fill from logged-in user if available
  const [form, setForm] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    email: currentUser?.email || "",
    phone: "",
    birthdate: "",
    addressLine1: "",
    city: "",
    country: "",
    state: "",
    zip:"",
    jobTitle: "",
    incomeRange: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.birthdate) return "Birthdate is required.";
    if (!form.addressLine1.trim()) return "Address is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.country.trim()) return "Country is required.";
    if (!form.state.trim()) return "State is required";
    if (!form.zip.trim()) return "Zip code is required";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!currentUser || !currentUser.userId) {
      setError("User ID is missing. Please login again.");
      return;
    }

    const payload = {
      userId: currentUser.userId, // must match backend DTO
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      birthdate: form.birthdate,
      addressLine1: form.addressLine1,
      city: form.city,
      country: form.country,
      state: form.state,
      zip: form.zip,
      jobTitle: form.jobTitle,
      incomeRange: form.incomeRange,
    };

    try {
      setSubmitting(true);

      const res = await fetch("http://localhost:8080/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create trading account.");
      }

      const data = await res.json();

      setSuccess(
        `Trading account created successfully. Account No: ${data.accountNumber || "generated"}`
      );

      // Optionally: close modal after short delay
      // setTimeout(onClose, 1500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while creating the account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-modal-card">
      <div className="account-modal-header">
        <h2>Create Trading Account</h2>
        <p>
          Fill in your basic details to open a{" "}
          <span className="highlight">paper trading</span> account.
        </p>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <form className="account-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label>First Name*</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Last Name*</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="form-field full">
            <label>Email*</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Phone*</label>
            <input
              type="tel"
              name="phone"
              placeholder="+1 555 123 4567"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Birthdate*</label>
            <input
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
            />
          </div>

          <div className="form-field full">
            <label>Address*</label>
            <input
              type="text"
              name="addressLine1"
              placeholder="Street / Apartment"
              value={form.addressLine1}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>City*</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Country*</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>State</label>
            <input
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Zip-Code</label>
            <input
            type="text"
            name="zip"
            value={form.zip}
            onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Job Title</label>
            <input
              type="text"
              name="jobTitle"
              placeholder="Software Engineer, Student, etc."
              value={form.jobTitle}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Income Range</label>
            <select
              name="incomeRange"
              value={form.incomeRange}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="<25k">&lt; $25,000</option>
              <option value="25-50k">$25,000 – $50,000</option>
              <option value="50-100k">$50,000 – $100,000</option>
              <option value="100k+">$100,000+</option>
            </select>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Trading Account"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TradingAccountModal;
