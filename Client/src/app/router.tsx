import AppLayout from "../components/AppLayout";
import Dashboard from "../pages/Dashboard";
import Transactions from "../pages/Transactions";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import ExportPage from "../pages/Export";
import Login from "../pages/Login";
// import Register from "../pages/Register";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
//   { path: "/register", element: <Register /> },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "transactions", element: <Transactions /> },
      { path: "analytics", element: <Analytics /> },
      { path: "export", element: <ExportPage /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
