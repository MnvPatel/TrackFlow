import { useEffect, useState, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/axios";
import type { Notification, Role, User } from "../types";

const navByRole: Record<Role, { to: string; label: string }[]> = {
  ADMIN: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "Tasks" },
    { to: "/issues", label: "Issues" },
    { to: "/employees", label: "Employees" },
    { to: "/submissions", label: "Submissions" },
  ],
  EMPLOYEE: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "My Tasks" },
    { to: "/issues", label: "Issues" },
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
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!role) return;
    api
      .get<User>("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, [role]);

  useEffect(() => {
    if (!role) return;
    api
      .get<{ success: boolean; notifications: Notification[] }>("/api/notifications")
      .then((res) => {
        const hasUnread = (res.data.notifications ?? []).some((n) => !n.isRead);
        setHasUnreadNotifications(hasUnread);
      })
      .catch(() => setHasUnreadNotifications(false));
  }, [role, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Full-width app bar (left to right) */}
      <header
        style={{
          height: 48,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Link
          to="/"
          style={{
            color: "var(--text-primary)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          TrackFlow
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => {
              if (location.pathname === "/notifications") {
                navigate("/");
              } else {
                navigate("/notifications");
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: location.pathname === "/notifications" ? "var(--sidebar-hover)" : "var(--bg-tertiary)",
              color: location.pathname === "/notifications" ? "var(--text-primary)" : "var(--text-secondary)",
              position: "relative",
              cursor: "pointer",
            }}
            aria-label={location.pathname === "/notifications" ? "Close notifications" : "Notifications"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasUnreadNotifications && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--danger)",
                }}
                aria-hidden
              />
            )}
          </button>
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
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Profile"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 16, color: "var(--accent)", fontWeight: 600 }}>
                  {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              )}
            </button>
            {profileOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  minWidth: 220,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  boxShadow: "var(--card-shadow)",
                  padding: 16,
                  zIndex: 100,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name ?? "—"}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                    {user?.email ?? "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 4,
                      textTransform: "capitalize",
                    }}
                  >
                    {user?.role?.toLowerCase() ?? "—"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Below app bar: sidebar + main content */}
      <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
        <aside
          style={{
            width: 240,
            background: "var(--sidebar-bg)",
            color: "var(--sidebar-text)",
            padding: "16px 0",
            flexShrink: 0,
          }}
        >
          <nav style={{ padding: "0 16px" }}>
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
        </aside>
        <main style={{ flex: 1, padding: 24, overflow: "auto", minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
