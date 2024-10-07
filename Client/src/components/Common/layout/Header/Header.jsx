import React from "react";
import "./Header.css";
import { FaBell, FaUserCircle } from "react-icons/fa"; // Icons for notifications and user profile

function Header() {
  return (
    <header className="fancy-header">
      <div className="header-content">
        {/* Logo */}
        <div className="logo">
          <h1>MyDashboard</h1>
        </div>

        {/* Notification and Profile */}
        <div className="header-right">
          <div className="notifications">
            <FaBell className="icon bell-icon" />
            <span className="notification-count">3</span>
          </div>
          <div className="profile">
            <FaUserCircle className="icon profile-icon" />
            <span className="username">Sanjana</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
