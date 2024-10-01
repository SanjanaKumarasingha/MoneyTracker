import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const userRef = useRef();
  //   const errRef = useRef();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // userRef.current.focus();
  }, []);

  useEffect(() => {
    setError("");
  }, [username, password]);

  const navigate = useNavigate();

  const handleSignIn = async (event) => {
    event.preventDefault();

    if (!username || !password) {
      setError("Username or password cannot be empty");
    } else {
      // Simulate API call or authentication logic
      if (username === "test" && password === "password") {
        setError("");
        navigate("/dashboard"); // Redirect to dashboard after successful login
      } else {
        setError("Invalid username or password");
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
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              ref={userRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
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
