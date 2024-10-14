import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import ProfilePage from "./pages/Profile/ProfilePage";
import DashboardPage from "./pages/Dashboard/Dashboard";
import LoginPage from "./pages/Login/LoginPage";
import SignupPage from "./pages/Login/SignupPage";
import Sidebar from "./components/Sidebar/Sidebar";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import Header from "./components/Common/layout/Header/Header";

function AppRoutes() {
  const [openSidebarToggle, setOpenSidebarToggle] = useState(false);

  const OpenSidebar = () => {
    setOpenSidebarToggle(!openSidebarToggle);
  };

  return (
    <>
      {/* <Header /> */}
      <div className="grid-container">
        {/* <Header /> */}
        <Router>
          <LocationWrapper>
            {({ location }) => (
              <>
                {location.pathname !== "/login" &&
                  location.pathname !== "/register" && (
                    <Sidebar
                      openSidebarToggle={openSidebarToggle}
                      OpenSidebar={OpenSidebar}
                    />
                  )}
                <div
                  className={
                    openSidebarToggle ? "main-content expanded" : "main-content"
                  }
                >
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<SignupPage />} />
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </>
            )}
          </LocationWrapper>
        </Router>
      </div>
    </>
  );
  function LocationWrapper({ children }) {
    const location = useLocation();
    return children({ location });
  }
}

export default AppRoutes;
