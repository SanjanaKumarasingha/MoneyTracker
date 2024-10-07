import React from "react";
import "./NotFoundPage.css";

const NotFoundPage = () => {
  return (
    <div className="not-found-container">
      <div className="water-effect">404</div>
      <div className="error-message">
        <h2>Page Not Found</h2>
        <p>
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" className="home-link">
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default NotFoundPage;
