// In src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  ExpensesTabRoute,
  BalancesTabRoute,
  TotalsTabRoute,
  MembersTabRoute,
  WhiteboardTabRoute,
} from "./features/groups/components/tabs/routes";
import "./App.css";
import LandingPage from "./pages/LandingPage/LandingPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Friends from "./pages/Friends/Friends";
import Activity from "./pages/Activity/Activity";
import Account from "./pages/Account/Account";
import AuthProvider from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext"; // Import our new ThemeProvider
import GroupDetails from "./pages/GroupDetails/GroupDetails";
import Groups from "./pages/Groups/Groups";
import MainLayout from "./components/layout/MainLayout/MainLayout";
import QueryProvider from "./app/providers";

// Mock authentication status - in a real app, this would come from your auth context
const isAuthenticated = true; // Set to true for testing

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      {/* Wrap everything with ThemeProvider */}
      <QueryProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page route outside the main layout */}
            <Route path="/" element={<LandingPage />} />

            {/* All protected pages inside the main layout */}
            <Route path="/" element={<MainLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/friends"
                element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <Activity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups"
                element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                }
              />
              {/* 7.4: each tab is its own lazy route, so tabs get real URLs */}
              <Route
                path="/groups/:groupId"
                element={
                  <ProtectedRoute>
                    <GroupDetails />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="expenses" replace />} />
                <Route path="expenses" element={<ExpensesTabRoute />} />
                <Route path="balances" element={<BalancesTabRoute />} />
                <Route path="totals" element={<TotalsTabRoute />} />
                <Route path="members" element={<MembersTabRoute />} />
                <Route path="whiteboard" element={<WhiteboardTabRoute />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
