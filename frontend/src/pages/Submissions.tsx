import React, { useEffect, useState } from "react";
import { api } from "../lib/axios";
import type { Task, WorkSubmission } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

export default function Submissions() {
  const { role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subsByTask, setSubsByTask] = useState<Record<string, WorkSubmission[]>>({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Task[]>("/api/tasks")
      .then(async (res) => {
        const list = res.data;
        setTasks(list);
        const map: Record<string, WorkSubmission[]> = {};
        await Promise.all(
          list.map(async (t) => {
            try {
              const subRes = await api.get<WorkSubmission[]>(`/api/submission/tasks/${t.id}/submissions`);
              if (subRes.data.length) map[t.id] = subRes.data;
            } catch {
              // ignore
            }
          })
        );
        setSubsByTask(map);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (subId: string) => {
    try {
      await api.patch(`/api/submission/${subId}/approve`);
      const { data: list } = await api.get<Task[]>("/api/tasks");
      setTasks(list);
      const map: Record<string, WorkSubmission[]> = {};
      for (const t of list) {
        try {
          const subRes = await api.get<WorkSubmission[]>(`/api/submission/tasks/${t.id}/submissions`);
          if (subRes.data.length) map[t.id] = subRes.data;
        } catch {
          //
        }
      }
      setSubsByTask(map);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleReject = async (subId: string) => {
    try {
      await api.patch(`/api/submission/${subId}/reject`);
      const { data: list } = await api.get<Task[]>("/api/tasks");
      setTasks(list);
      const map: Record<string, WorkSubmission[]> = {};
      for (const t of list) {
        try {
          const subRes = await api.get<WorkSubmission[]>(`/api/submission/tasks/${t.id}/submissions`);
          if (subRes.data.length) map[t.id] = subRes.data;
        } catch {
          //
        }
      }
      setSubsByTask(map);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;

  const taskIdsWithSubs = Object.keys(subsByTask);
  const tasksWithSubs = tasks.filter((t) => taskIdsWithSubs.includes(t.id));

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Submissions</h1>
      {tasksWithSubs.length === 0 ? (
        <Card>No submissions yet.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tasksWithSubs.map((t) => (
            <Card key={t.id}>
              <h3 style={{ margin: "0 0 12px" }}>{t.title}</h3>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>
                {t.project?.title} · {t.status}
              </div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {(subsByTask[t.id] ?? []).map((s) => (
                  <li key={s.id} style={{ marginBottom: 8 }}>
                    {s.description} — {s.percentReported}% · {s.status} · {s.submittedBy?.name ?? "—"}
                    {role === "ADMIN" && s.status === "SUBMITTED" && (
                      <span style={{ marginLeft: 8 }}>
                        <Button variant="ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => handleApprove(s.id)}>Approve</Button>
                        <Button variant="danger" style={{ padding: "2px 8px", fontSize: 12, marginLeft: 4 }} onClick={() => handleReject(s.id)}>Reject</Button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
