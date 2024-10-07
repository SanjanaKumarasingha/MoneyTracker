import React from "react";
import "./StatsCard.css";

const StatsCard = ({ title, value, icon, background }) => {
  return (
    <div className="stats-card" style={{ backgroundColor: background }}>
      <div className="card-icon">{icon}</div>
      <div className="card-info">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
