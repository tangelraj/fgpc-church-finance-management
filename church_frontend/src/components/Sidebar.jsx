import { NavLink, useNavigate } from "react-router-dom";

import {
  Church,
  LayoutDashboard,
  Users,
  HandCoins,
  Wallet,
  Receipt,
  FileText,
  ChartColumn,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Families",
    path: "/families",
    icon: Users,
  },
  {
    name: "Offerings",
    path: "/offerings",
    icon: HandCoins,
  },
  {
    name: "Expenses",
    path: "/expenses",
    icon: Wallet,
  },
  {
    name: "Receipts",
    path: "/receipts",
    icon: Receipt,
  },
  {
    name: "Vouchers",
    path: "/vouchers",
    icon: FileText,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: ChartColumn,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];


export default function Sidebar({
  isOpen,
  onClose,
}) {

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = async () => {

    await logout();

    navigate("/login", {
      replace: true,
    });

  };


  return (

    <>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            <Church size={32} />
          </div>

          <div>
            <h2>FGPC</h2>
            <span>YELAHANKA</span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>

        </div>

        <div className="sidebar-subtitle">
          CHURCH FINANCE MANAGEMENT
        </div>

        <div className="sidebar-divider" />

        <p className="sidebar-menu-label">
          MAIN MENU
        </p>

        <nav className="sidebar-navigation">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (

              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
              >

                <Icon size={21} />

                <span>{item.name}</span>

              </NavLink>

            );

          })}

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="sidebar-avatar">

              {user?.full_name
                ?.charAt(0)
                .toUpperCase() || "A"}

            </div>

            <div>

              <h4>
                {user?.full_name || "Admin"}
              </h4>

              <p>
                {user?.role || "Church Staff"}
              </p>

            </div>

          </div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >

            <LogOut size={20} />

            <span>Logout</span>

          </button>

        </div>

      </aside>

    </>

  );

}