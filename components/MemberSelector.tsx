"use client";

import { MemberProfile } from "../lib/db";

interface Props {
  members: MemberProfile[];
  activeId: string;
  onSelect: (userId: string) => void;
}

export default function MemberSelector({ members, activeId, onSelect }: Props) {
  return (
    <div style={{
      display: "flex",
      gap: 8,
      overflowX: "auto",
      padding: "16px 20px",
      background: "#1e293b",
      scrollbarWidth: "none",
    }}>
      {members.map((m) => {
        const isActive = m.userId === activeId;
        return (
          <div
            key={m.userId}
            onClick={() => onSelect(m.userId)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              minWidth: 64,
              padding: "8px 4px",
              borderRadius: 12,
              background: isActive ? "rgba(34,197,94,0.15)" : "transparent",
              border: isActive ? "2px solid #22c55e" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 22 }}>{m.avatar}</span>
            <span style={{
              fontSize: 10,
              color: isActive ? "#22c55e" : "#64748b",
              fontWeight: isActive ? 700 : 500,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 60,
            }}>
              {m.displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
