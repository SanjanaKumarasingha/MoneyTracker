import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProfilePage from "./pages/Profile/ProfilePage";
import DashboardPage from "./pages/Dashboard/Dashboard";
import NotFoundPage from "./pages/NotFound/NotFoundPage"; // For handling 404 errors
import LoginPage from "./pages/Login/LoginPage";
import SignupPage from "./pages/Login/SignupPage";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
