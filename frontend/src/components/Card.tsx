import React from "react";

export default function Card({
  children,
  style = {},
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: 8,
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
        padding: 20,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
