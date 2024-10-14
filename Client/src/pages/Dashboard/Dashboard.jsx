import React from "react";
import "./Dashboard.css";
import Header from "../../components/Common/layout/Header/Header";
import StatsCard from "../../components/Dashboard/StatsCard";
import ActivityChart from "../../components/Dashboard/ActivityChart";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";
import ToggleModeButton from "../../components/Common/layout/ToggleModeButton";

function DashboardPage() {
  return (
    <div className="dashboard-page">
      {/* Dark/Light Mode Toggle */}
      {/* <ToggleModeButton /> */}

      {/* Main Content */}
      <div className="dash-main-content">
        {/* <Header /> */}
        <div className="dashboard-content">
          <div className="stats-cards">
            <StatsCard
              title="Total Balance"
              value="$12,345.67"
              icon="💰"
              background="#28a745"
            />
            <StatsCard
              title="Monthly Income"
              value="$2,300.00"
              icon="📈"
              background="#007bff"
            />
            <StatsCard
              title="Monthly Expenses"
              value="$1,600.00"
              icon="📉"
              background="#dc3545"
            />
            <StatsCard
              title="Savings"
              value="$700.00"
              icon="💵"
              background="#ffc107"
            />
          </div>

          <div className="recent-transactions-section">
            <RecentTransactions />
          </div>

          <div className="charts-section">
            <ActivityChart />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
