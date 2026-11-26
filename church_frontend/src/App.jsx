import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Families from "./pages/Families";
import FamilyDetails from "./pages/FamilyDetails";

import Offerings from "./pages/Offerings";
import Receipts from "./pages/Receipts";

import Expenses from "./pages/Expenses";
import Vouchers from "./pages/Vouchers";

import ComingSoon from "./pages/ComingSoon";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import { useAuth } from "./context/AuthContext";

import Reports from "./pages/Reports";

import Settings from "./pages/Settings";


export default function App() {

  const {
    isAuthenticated,
    loading,
  } = useAuth();


  if (loading) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "#54265f",
          fontWeight: 600,
        }}
      >

        Loading FGPC Church Finance...

      </div>

    );

  }


  return (

    <Routes>

      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/" replace />
            : <Login />
        }
      />


      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >

        <Route
          index
          element={<Dashboard />}
        />

        <Route
          path="families"
          element={<Families />}
        />

        <Route
          path="families/:id"
          element={<FamilyDetails />}
        />

        <Route
          path="offerings"
          element={<Offerings />}
        />

        <Route
          path="receipts"
          element={<Receipts />}
        />

        <Route
          path="expenses"
          element={<Expenses />}
        />

        <Route
          path="vouchers"
          element={<Vouchers />}
        />

        <Route
            path="reports"
            element={<Reports />}
        />

        <Route
            path="settings"
            element={<Settings />}
        />

      </Route>


      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

      

    </Routes>

  );

}