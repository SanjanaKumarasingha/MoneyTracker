import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { AuthContext } from "../../context/AuthProvider";

const LoginPage = () => {
  const { setAuth } = useContext(AuthContext); // To use AuthContext
  const userRef = useRef(); // Reference for focusing on username input
  const [username, setUsername] = useState(""); // Username state
  const [password, setPassword] = useState(""); // Password state
  const [error, setError] = useState(""); // Error state
  const [showPassword, setShowPassword] = useState(false); // Password visibility toggle

  useEffect(() => {
    userRef.current.focus(); // Focus on username input when the component loads
  }, []);

  useEffect(() => {
    setError(""); // Reset error when username or password changes
  }, [username, password]);

  const navigate = useNavigate();

  // Form submit handler
  const handleSignIn = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    if (!username) {
      setError("Username cannot be empty");
    } else if (!password) {
      setError("Password cannot be empty");
    } else {
      // Simulate API call or authentication logic
      if (username === "test" && password === "password") {
        setError(""); // Clear error on successful login
        navigate("/dashboard"); // Redirect to dashboard
      } else {
        setError("Invalid username or password"); // Show error on invalid login
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login to MoneyTracker</h2>
        <form onSubmit={handleSignIn}>
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              ref={userRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <div className="submit-group">
            <button type="submit" className="login-button">
              Login
            </button>
          </div>

          <div className="register-link">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Register here</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
