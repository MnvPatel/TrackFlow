import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export default function Button({
  variant = "primary",
  children,
  style = {},
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; style?: React.CSSProperties }) {
  const base = {
    padding: "8px 16px",
    borderRadius: 6,
    fontWeight: 500,
    border: "1px solid transparent",
    cursor: "pointer",
  } as React.CSSProperties;
  const variants: Record<Variant, React.CSSProperties> = {
    primary: { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" },
    secondary: { background: "var(--bg-tertiary)", color: "var(--text-primary)", borderColor: "var(--border)" },
    danger: { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" },
    ghost: { background: "transparent", color: "var(--text-secondary)", borderColor: "var(--border)" },
  };
  return (
    <button
      type="button"
      style={{ ...base, ...variants[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
