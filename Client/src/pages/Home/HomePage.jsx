// src/pages/HomePage.js
import React from "react";
import Button from "../../components/Common/Button/Button";
import "./HomePage.css";

function HomePage() {
  const handleButtonClick = () => {
    alert("Welcome to the Money Management App!");
  };

  return (
    <div className="homepage">
      <h1>Welcome to the Money Management App</h1>
      <p>
        Manage your finances with ease, track your expenses, and achieve your
        financial goals.
      </p>
      <Button label="Get Started" onClick={handleButtonClick} />
    </div>
  );
}

export default HomePage;
