import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import HomePage from "./pages/Home/HomePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import DashboardPage from "./pages/Dashboard/Dashboard";
import NotFoundPage from "./pages/NotFound/NotFoundPage"; // For handling 404 errors
import LoginPage from "./pages/Login/LoginPage";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Add more routes as needed */}
        <Route path="*" element={<NotFoundPage />} />
        {/* Fallback for undefined routes */}
      </Routes>
    </Router>
  );
}

export default AppRoutes;
