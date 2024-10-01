import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("All fields are required");
    } else if (password !== confirmPassword) {
      setError("Passwords do not match");
    } else {
      setError("");
      // Simulate account creation logic
      navigate("/login");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Register for MoneyTracker</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>
          <button type="submit" className="auth-button">
            Register
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login here</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
