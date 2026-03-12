import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/axios";
import type { Task } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import TaskCard from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";

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
            <TaskCard
              key={t.id}
              task={t}
              showProject={true}
              showPercent={true}
              showAssignees={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
