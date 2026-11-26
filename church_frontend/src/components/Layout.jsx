import { useState } from "react";

import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";

import Navbar from "./Navbar";

import "../styles/Layout.css";


export default function Layout() {

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [collapsed, setCollapsed] =
    useState(false);


  const toggleSidebar = () => {

    if (window.innerWidth <= 900) {

      setSidebarOpen((previous) => !previous);

    } else {

      setCollapsed((previous) => !previous);

    }

  };


  return (

    <div
      className={`app-layout ${
        collapsed ? "layout-collapsed" : ""
      }`}
    >

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-layout">

        <Navbar onMenuClick={toggleSidebar} />

        <main className="main-content">

          <Outlet />

        </main>

        <footer className="layout-footer">

          <p>
            © {new Date().getFullYear()}
            {" "}FGPC Yelahanka Church.
            All Rights Reserved.
          </p>

          <span>
            Church Finance Management System
          </span>

        </footer>

      </div>

    </div>

  );

}