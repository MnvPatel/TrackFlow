import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/axios";
import type { Project } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  ACTIVE: "var(--success)",
  ON_HOLD: "var(--warning)",
  COMPLETED: "var(--text-muted)",
};

export default function Projects() {
  const { role } = useAuth();
  const [list, setList] = useState<Project[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Project[]>("/api/projects/")
      .then((res) => setList(res.data))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading projects…</p>;
  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        {role === "ADMIN" && (
          <Link to="/projects/new">
            <Button>New project</Button>
          </Link>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.length === 0 ? (
          <Card>No projects yet.</Card>
        ) : (
          list.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    {p.client?.name ?? "—"} ·{" "}
                    <span style={{ color: statusColors[p.status] ?? "var(--text-muted)" }}>{p.status}</span>
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  {p.tasks?.length ?? 0} tasks
                </span>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
