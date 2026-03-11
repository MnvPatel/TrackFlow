import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/axios";
import type { Task } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  PENDING: "var(--text-muted)",
  IN_PROGRESS: "var(--accent)",
  SUBMITTED: "var(--warning)",
  APPROVED: "var(--success)",
  REJECTED: "var(--danger)",
};

export default function Tasks() {
  const { role } = useAuth();
  const [list, setList] = useState<Task[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Task[]>("/api/tasks/")
      .then((res) => setList(res.data))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading tasks…</p>;
  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>
        {role === "ADMIN" && (
          <Link to="/tasks/new">
            <Button>New task</Button>
          </Link>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.length === 0 ? (
          <Card>No tasks yet.</Card>
        ) : (
          list.map((t) => (
            <Link key={t.id} to={`/tasks/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    {t.project?.title ?? "—"} · {t.priority} ·{" "}
                    <span style={{ color: statusColors[t.status] ?? "var(--text-muted)" }}>{t.status}</span>
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  {t.assignments?.length ?? 0} assignees
                </span>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
