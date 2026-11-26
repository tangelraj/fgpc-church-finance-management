import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function ProtectedRoute({

  children,

}) {

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


  if (!isAuthenticated) {

    return <Navigate to="/login" replace />;

  }


  return children;

}