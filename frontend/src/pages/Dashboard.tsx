import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/axios";
import type { AdminAnalytics, EmployeeAnalytics, ClientAnalytics } from "../types";
import Card from "../components/Card";

export default function Dashboard() {
  const { role } = useAuth();
  const [data, setData] = useState<AdminAnalytics | EmployeeAnalytics | ClientAnalytics | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (role === "ADMIN") {
          const { data: r } = await api.get<{ success: boolean; analytics: AdminAnalytics }>("/api/analytics/admin");
          if (!cancelled) setData(r.analytics);
        } else if (role === "EMPLOYEE") {
          const { data: r } = await api.get<{ success: boolean; analytics: EmployeeAnalytics }>("/api/analytics/employee");
          if (!cancelled) setData(r.analytics);
        } else if (role === "CLIENT") {
          const { data: r } = await api.get<{ success: boolean; analytics: ClientAnalytics }>("/api/analytics/client");
          if (!cancelled) setData(r.analytics);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => { cancelled = true; };
  }, [role]);

  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;
  if (!data) return <p>Loading…</p>;

  if (role === "ADMIN") {
    const a = data as AdminAnalytics;
    return (
      <div>
        <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Projects</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.projects.total}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Active: {a.projects.active} · Done: {a.projects.completed}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Tasks</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.tasks.total}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Pending: {a.tasks.pending} · Approved: {a.tasks.approved}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Employees</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.users.employees}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Clients</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.users.clients}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Open issues</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.issues.open}</div>
          </Card>
        </div>
      </div>
    );
  }

  if (role === "EMPLOYEE") {
    const a = data as EmployeeAnalytics;
    return (
      <div>
        <h1 style={{ marginBottom: 24 }}>My dashboard</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Assigned tasks</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.tasks.assigned}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Pending</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.tasks.pending}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>In progress</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.tasks.inProgress}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Submitted</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.tasks.submitted}</div>
          </Card>
          <Card>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Projects</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.projects.workingOn}</div>
          </Card>
        </div>
      </div>
    );
  }

  const a = data as ClientAnalytics;
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        <Card>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Projects</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.projects.total}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Active: {a.projects.active}</div>
        </Card>
        <Card>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Tasks</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.tasks.total}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Approved: {a.tasks.approved}</div>
        </Card>
        <Card>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Open issues</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.issues.open}</div>
        </Card>
      </div>
    </div>
  );
}
