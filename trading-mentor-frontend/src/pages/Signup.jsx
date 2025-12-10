// src/pages/Signup.jsx
import { useState } from "react";
import "./Signup.css"; // we’ll create this next

function Signup() {
  // form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    birthdate: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // handle input updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // form submit -> call Spring Boot /api/auth/signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    // 1) simple validation
    if (!form.firstName || !form.lastName || !form.email ||
        !form.password || !form.confirmPassword ||
        !form.age || !form.birthdate) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    // 2) build payload exactly as backend DTO: SignupRequest
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      age: Number(form.age),
      birthdate: form.birthdate, // "YYYY-MM-DD" -> LocalDate
    };

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        // backend sends simple text error messages
        setErrorMsg(text || "Signup failed.");
      } else {
        setSuccessMsg(text || "Signup successful!");
        // clear the form
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          age: "",
          birthdate: "",
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Create Your Trading Mentor Account</h2>
        <p className="signup-subtitle">
          Practice trading, learn order matching, and track your portfolio —
          all with one free account.
        </p>

        {successMsg && <div className="signup-alert success">{successMsg}</div>}
        {errorMsg && <div className="signup-alert error">{errorMsg}</div>}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-row">
            <div className="signup-field">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Pranit"
              />
            </div>
            <div className="signup-field">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Mhatre"
              />
            </div>
          </div>

          <div className="signup-field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>

          <div className="signup-row">
            <div className="signup-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
            </div>
            <div className="signup-field">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div className="signup-row">
            <div className="signup-field">
              <label>Age</label>
              <input
                type="number"
                name="age"
                min="18"
                value={form.age}
                onChange={handleChange}
                placeholder="26"
              />
            </div>
            <div className="signup-field">
              <label>Birthdate</label>
              <input
                type="date"
                name="birthdate"
                value={form.birthdate}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="signup-submit" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="signup-hint">
            Already have an account? We’ll connect the Login page next.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
