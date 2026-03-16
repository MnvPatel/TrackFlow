import { useEffect, useState } from "react";
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
    const projectSegments = [
      { label: "Active", value: a.projects.active, color: "var(--accent)" },
      { label: "Completed", value: a.projects.completed, color: "var(--success)" },
      {
        label: "Other",
        value: Math.max(a.projects.total - a.projects.active - a.projects.completed, 0),
        color: "var(--text-muted)",
      },
    ].filter((s) => s.value > 0);

    const taskSegments = [
      { label: "Pending", value: a.tasks.pending, color: "var(--text-muted)" },
      { label: "In progress", value: a.tasks.inProgress, color: "var(--accent)" },
      { label: "Submitted", value: a.tasks.submitted, color: "var(--warning)" },
      { label: "Approved", value: a.tasks.approved, color: "var(--success)" },
    ].filter((s) => s.value > 0);

    const renderPie = (segments: { label: string; value: number; color: string }[]) => {
      const total = segments.reduce((sum, s) => sum + s.value, 0);
      if (!total) {
        return (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No data
          </div>
        );
      }

      let currentAngle = 0;
      const parts = segments.map((s) => {
        const angle = (s.value / total) * 360;
        const start = currentAngle;
        const end = currentAngle + angle;
        currentAngle = end;
        return `${s.color} ${start}deg ${end}deg`;
      });

      return (
        <div>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              margin: "0 auto 12px",
              backgroundImage: `conic-gradient(${parts.join(", ")})`,
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {segments.map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 4,
                    background: s.color,
                  }}
                />
                <span style={{ color: "var(--text-secondary)" }}>
                  {s.label} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div>
        <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Card>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>Projects</div>
            {renderPie(projectSegments)}
          </Card>
          <Card>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>Tasks</div>
            {renderPie(taskSegments)}
          </Card>
        </div>
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
    const taskSegments = [
      { label: "Pending", value: a.tasks.pending, color: "var(--text-muted)" },
      { label: "In progress", value: a.tasks.inProgress, color: "var(--accent)" },
      { label: "Submitted", value: a.tasks.submitted, color: "var(--warning)" },
      { label: "Approved", value: a.tasks.approved, color: "var(--success)" },
    ].filter((s) => s.value > 0);

    const totalTasks =
      a.tasks.pending + a.tasks.inProgress + a.tasks.submitted + a.tasks.approved;

    let currentAngle = 0;
    const parts =
      totalTasks > 0
        ? taskSegments.map((s) => {
            const angle = (s.value / totalTasks) * 360;
            const start = currentAngle;
            const end = currentAngle + angle;
            currentAngle = end;
            return `${s.color} ${start}deg ${end}deg`;
          })
        : [];

    return (
      <div>
        <h1 style={{ marginBottom: 24 }}>My dashboard</h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Card>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>My tasks</div>
            {totalTasks === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No tasks yet
              </div>
            ) : (
              <>
                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    margin: "0 auto 12px",
                    backgroundImage: `conic-gradient(${parts.join(", ")})`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  {taskSegments.map((s) => (
                    <div
                      key={s.label}
                      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 4,
                          background: s.color,
                        }}
                      />
                      <span style={{ color: "var(--text-secondary)" }}>
                        {s.label} ({s.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
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

  const clientProjectSegments = [
    { label: "Active", value: a.projects.active, color: "var(--accent)" },
    { label: "Completed", value: a.projects.completed, color: "var(--success)" },
    {
      label: "Other",
      value: Math.max(a.projects.total - a.projects.active - a.projects.completed, 0),
      color: "var(--text-muted)",
    },
  ].filter((s) => s.value > 0);

  const clientTaskSegments = [
    {
      label: "Approved",
      value: a.tasks.approved,
      color: "var(--success)",
    },
    {
      label: "Pending",
      value: a.tasks.pending,
      color: "var(--accent)",
    },
  ].filter((s) => s.value > 0);

  const renderClientPie = (
    segments: { label: string; value: number; color: string }[]
  ) => {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (!total) {
      return (
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No data
        </div>
      );
    }
    let currentAngle = 0;
    const parts = segments.map((s) => {
      const angle = (s.value / total) * 360;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return `${s.color} ${start}deg ${end}deg`;
    });
    return (
      <>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            margin: "0 auto 12px",
            backgroundImage: `conic-gradient(${parts.join(", ")})`,
          }}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {segments.map((s) => (
            <div
              key={s.label}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 4,
                  background: s.color,
                }}
              />
              <span style={{ color: "var(--text-secondary)" }}>
                {s.label} ({s.value})
              </span>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My dashboard</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>Projects</div>
          {renderClientPie(clientProjectSegments)}
        </Card>
        <Card>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>Tasks</div>
          {renderClientPie(clientTaskSegments)}
        </Card>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <Card>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Projects</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.projects.total}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Active: {a.projects.active} · Completed: {a.projects.completed}
          </div>
        </Card>
        <Card>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Tasks</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.tasks.total}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Approved: {a.tasks.approved} · Pending: {a.tasks.pending}
          </div>
        </Card>
        <Card>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Open issues</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{a.issues.open}</div>
        </Card>
      </div>
    </div>
  );
}
