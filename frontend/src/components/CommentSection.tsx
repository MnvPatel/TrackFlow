import React, { useState } from "react";
import type { Comment as CommentType } from "../types";

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const s = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hour(s) ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)} day(s) ago`;
  return d.toLocaleDateString();
}

function getInitial(name: string | undefined): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return name[0].toUpperCase();
}

interface CommentSectionProps {
  comments: CommentType[];
  loading?: boolean;
  canReply: boolean;
  canAddComment: boolean;
  placeholder?: string;
  addCommentLabel?: string;
  onAddComment: (text: string) => Promise<void>;
  onReply: (parentCommentId: string, text: string) => Promise<void>;
  onRefresh: () => void;
  title?: string;
  subtitle?: string;
}

export default function CommentSection({
  comments,
  loading = false,
  canReply,
  canAddComment,
  placeholder = "Add a comment...",
  addCommentLabel = "Comment",
  onAddComment,
  onReply,
  onRefresh,
  title,
  subtitle,
}: CommentSectionProps) {
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onAddComment(newCommentText.trim());
      setNewCommentText("");
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onReply(parentId, replyText.trim());
      setReplyingToId(null);
      setReplyText("");
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reply");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {title && (
        <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 600 }}>
          {title}
        </h3>
      )}
      {subtitle && (
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      )}

      {canAddComment && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--bg-primary)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          U
        </div>
        <form onSubmit={handleSubmitComment} style={{ flex: 1, minWidth: 0 }}>
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={placeholder}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "10px 0",
                border: "none",
                borderBottom: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
              }}
            />
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="submit"
                disabled={!newCommentText.trim() || submitting}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 18,
                  background: "var(--accent)",
                  color: "var(--bg-primary)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: newCommentText.trim() && !submitting ? "pointer" : "not-allowed",
                  opacity: newCommentText.trim() && !submitting ? 1 : 0.6,
                }}
              >
                {addCommentLabel}
              </button>
            </div>
          </form>
      </div>
      )}

      {error && (
        <p style={{ color: "var(--danger)", fontSize: 13, margin: "0 0 12px" }}>{error}</p>
      )}

      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </span>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", margin: "16px 0 0", fontSize: 14 }}>
          Loading comments…
        </p>
      ) : comments.length === 0 ? (
        <p style={{ color: "var(--text-muted)", margin: "16px 0 0", fontSize: 14 }}>
          No comments yet.
        </p>
      ) : (
        <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              canReply={canReply}
              replyingToId={replyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              setReplyingToId={setReplyingToId}
              onReply={handleSubmitReply}
              submitting={submitting}
              depth={0}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: CommentType;
  canReply: boolean;
  replyingToId: string | null;
  replyText: string;
  setReplyText: (v: string) => void;
  setReplyingToId: (id: string | null) => void;
  onReply: (parentId: string) => Promise<void>;
  submitting: boolean;
  depth: number;
}

function CommentItem({
  comment,
  canReply,
  replyingToId,
  replyText,
  setReplyText,
  setReplyingToId,
  onReply,
  submitting,
  depth,
}: CommentItemProps) {
  const isReplying = replyingToId === comment.id;
  const replies = comment.replies ?? [];

  return (
    <li style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {getInitial(comment.author?.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {comment.author?.name ?? "Unknown"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <div style={{ marginTop: 4, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
            {comment.text}
          </div>
          {canReply && (
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setReplyingToId(isReplying ? null : comment.id)}
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Reply
              </button>
            </div>
          )}
          {isReplying && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                disabled={submitting}
                autoFocus
                style={{
                  width: "100%",
                  padding: "8px 0",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onReply(comment.id)}
                  disabled={!replyText.trim() || submitting}
                  style={{
                    padding: "6px 14px",
                    border: "none",
                    borderRadius: 18,
                    background: "var(--accent)",
                    color: "var(--bg-primary)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: replyText.trim() && !submitting ? "pointer" : "not-allowed",
                    opacity: replyText.trim() && !submitting ? 1 : 0.6,
                  }}
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => { setReplyingToId(null); setReplyText(""); }}
                  style={{
                    padding: "6px 14px",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <ul
          style={{
            margin: "12px 0 0 52px",
            paddingLeft: 12,
            listStyle: "none",
            borderLeft: "2px solid var(--border)",
          }}
        >
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              canReply={canReply}
              replyingToId={replyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              setReplyingToId={setReplyingToId}
              onReply={onReply}
              submitting={submitting}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
