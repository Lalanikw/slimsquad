"use client";

import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { id: "/squad", icon: "🏆", label: "Squad" },
  { id: "/mystats", icon: "📊", label: "My Stats" },
  { id: "/profile", icon: "👤", label: "Profile" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 480,
      background: "#0f172a",
      borderTop: "1px solid rgba(100,116,139,0.2)",
      display: "flex",
      justifyContent: "space-around",
      padding: "10px 0 20px",
      zIndex: 100,
    }}>
      {tabs.map((t) => {
        const isActive = pathname === t.id;
        return (
          <button
            key={t.id}
            onClick={() => router.push(t.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              cursor: "pointer",
              color: isActive ? "#22c55e" : "#475569",
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
