// src/pages/DashboardPage.js
import React from "react";
import "./Dashboard.css";
// import Sidebar from "../../components/Common/layout/Sidebar/Sidebar";
import Header from "../../components/Common/layout/Header/Header";
import StatsCard from "../../components/Dashboard/StatsCard";
import ActivityChart from "../../components/Dashboard/ActivityChart";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";

function DashboardPage() {
  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      {/* <Sidebar /> */}

      {/* Main Content */}
      <div className="main-content">
        <Header />
        <div className="dashboard-content">
          <div className="stats-cards">
            <StatsCard title="Total Balance" value="$12,345.67" />
            <StatsCard title="Monthly Income" value="$2,300.00" />
            <StatsCard title="Monthly Expenses" value="$1,600.00" />
            <StatsCard title="Savings" value="$700.00" />
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
