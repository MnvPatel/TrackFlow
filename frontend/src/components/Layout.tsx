import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/axios";
import type { Role } from "../types";

const navByRole: Record<Role, { to: string; label: string }[]> = {
  ADMIN: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "Tasks" },
    { to: "/employees", label: "Employees" },
    { to: "/submissions", label: "Submissions" },
  ],
  EMPLOYEE: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "My Tasks" },
    { to: "/submissions", label: "Submissions" },
  ],
  CLIENT: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "My Projects" },
    { to: "/issues", label: "Issues" },
  ],
};

export default function Layout() {
  const { role, logout: clearAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }
    clearAuth();
    navigate("/login");
  };

  if (!role) return null;
  const nav = navByRole[role];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          padding: "16px 0",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--sidebar-hover)" }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "none", fontWeight: 700, fontSize: "1.25rem" }}>
            Task Portal
          </Link>
        </div>
        <nav style={{ marginTop: 16 }}>
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: "block",
                padding: "10px 16px",
                color: "inherit",
                textDecoration: "none",
                background: location.pathname === to || (to !== "/" && location.pathname.startsWith(to)) ? "var(--sidebar-hover)" : "transparent",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "16px" }}>
          <Link to="/notifications" style={{ color: "inherit", textDecoration: "none" }}>
            Notifications
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            height: 48,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 16,
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            style={{
              padding: "6px 10px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
            }}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-secondary)",
            }}
          >
            Logout
          </button>
        </header>
        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
