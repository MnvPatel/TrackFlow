import React, { useEffect, useState } from "react";
import { api } from "../lib/axios";
import type { Notification } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Notifications() {
  const [list, setList] = useState<Notification[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get<{ success: boolean; notifications: Notification[] }>("/api/notifications")
      .then((res) => setList(res.data.notifications))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      //
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/api/notifications/read-all");
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      //
    }
  };

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;

  const unreadCount = list.filter((n) => !n.isRead).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllRead}>Mark all as read</Button>
        )}
      </div>
      {list.length === 0 ? (
        <Card>No notifications.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((n) => (
            <Card
              key={n.id}
              style={{
                opacity: n.isRead ? 0.85 : 1,
                borderLeft: n.isRead ? undefined : "4px solid var(--accent)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>{n.message}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleMarkRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
