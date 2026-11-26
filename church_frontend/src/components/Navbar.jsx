import {
  Menu,
  CalendarDays,
  CircleUserRound,
  ShieldCheck,
} from "lucide-react";

import { useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


// ==========================================
// PAGE TITLES
// ==========================================

const pageTitles = {
  "/": "Dashboard",
  "/families": "Family Management",
  "/offerings": "Offering Management",
  "/expenses": "Expense Management",
  "/receipts": "Cash Receipts",
  "/vouchers": "Payment Vouchers",
  "/reports": "Financial Reports",
  "/settings": "Settings",
};


// ==========================================
// NAVBAR COMPONENT
// ==========================================

export default function Navbar({
  onMenuClick,
}) {

  const { user } = useAuth();

  const location = useLocation();


  // ========================================
  // CURRENT PAGE TITLE
  // ========================================

  const pageTitle = location.pathname.startsWith(
    "/families/"
  )
    ? "Family Details"
    : pageTitles[location.pathname] ||
      "Church Finance";


  // ========================================
  // CURRENT DATE
  // ========================================

  const today = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }
  );


  return (

    <header className="top-navbar">

      {/* LEFT SECTION */}

      <div className="navbar-left">

        <button
          type="button"
          className="navbar-menu-button"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >

          <Menu size={25} />

        </button>


        <div>

          <h2>{pageTitle}</h2>

          <p>FGPC Yelahanka Church</p>

        </div>

      </div>


      {/* RIGHT SECTION */}

      <div className="navbar-right">

        {/* CURRENT DATE */}

        <div className="navbar-date">

          <CalendarDays size={18} />

          <span>{today}</span>

        </div>


        {/* LOGGED-IN USER */}

        <div className="navbar-user">

          <CircleUserRound size={35} />

          <div className="navbar-user-details">

            <h4>

              {user?.full_name || "Admin"}

            </h4>

            <p>

              <ShieldCheck size={13} />

              {user?.role || "Church Staff"}

            </p>

          </div>

        </div>

      </div>

    </header>

  );

}