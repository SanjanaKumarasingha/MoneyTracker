// src/components/dashboard/StatsCard.js
import React from "react";
import "./StatsCard.css";

const StatsCard = ({ title, value }) => {
  return (
    <div className="stats-card">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
};

export default StatsCard;
