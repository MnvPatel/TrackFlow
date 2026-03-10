import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import type { Issue } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

export default function IssueDetail() {
  const { issueId } = useParams<{ issueId: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!issueId) return;
    api.get<Issue>(`/api/issues/${issueId}`)
      .then((res) => setIssue(res.data))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [issueId]);

  const handleConvert = async () => {
    if (!issueId || !window.confirm("Convert this issue to a task?")) return;
    setLoading(true);
    try {
      await api.patch(`/api/issues/${issueId}/convert`);
      setIssue((prev) => (prev ? { ...prev, status: "CONVERTED_TO_TASK" } : null));
      navigate("/tasks");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Convert failed");
    } finally {
      setLoading(false);
    }
  };

  if (err && !issue) return <p style={{ color: "var(--danger)" }}>{err}</p>;
  if (!issue) return <p>Loading…</p>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/issues" style={{ color: "var(--text-secondary)" }}>← Issues</Link>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 8px" }}>{issue.title}</h1>
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>Status: {issue.status}</div>
        </div>
        {role === "ADMIN" && issue.status !== "CONVERTED_TO_TASK" && (
          <Button onClick={handleConvert} disabled={loading}>{loading ? "Converting…" : "Convert to task"}</Button>
        )}
      </div>
      <Card>
        <div style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{issue.description}</div>
        {issue.createdBy && (
          <div style={{ marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>
            Created by {issue.createdBy.name}
          </div>
        )}
      </Card>
    </div>
  );
}
