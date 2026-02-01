"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import NavBar from "../../components/NavBar";
import { getAllMembers, getEntries, MemberProfile, WeeklyEntry } from "../../lib/db";
import { calcBMI } from "../../lib/utils";

interface LeaderboardMember extends MemberProfile {
  entries: WeeklyEntry[];
  lost: number;
  pct: number;
  latestBmi: string | null;
}

export default function SquadPage() {
  const { user, squadId, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !squadId)) {
      router.replace("/login");
    }
  }, [user, squadId, loading, router]);

  useEffect(() => {
    if (!squadId) return;

    async function fetchData() {
      const allMembers = await getAllMembers(squadId!);
      const enriched: LeaderboardMember[] = [];

      for (const m of allMembers) {
        const entries = await getEntries(squadId!, m.userId);
        const start = entries.length > 0 ? parseFloat(entries[0].weight) : parseFloat(m.weight) || 0;
        const current = entries.length > 0 ? parseFloat(entries[entries.length - 1].weight) : parseFloat(m.weight) || 0;
        const target = parseFloat(m.targetWeight) || 0;
        const lost = start - current;
        const needed = start - target;
        const pct = needed > 0 ? Math.max(0, Math.min(100, (lost / needed) * 100)) : 0;
        const latestBmi = entries.length > 0
          ? entries[entries.length - 1].bmi
          : calcBMI(m.weight, m.weightUnit, m.height, m.heightUnit);

        enriched.push({ ...m, entries, lost, pct, latestBmi });
      }

      // Sort by % progress descending
      enriched.sort((a, b) => b.pct - a.pct);
      setMembers(enriched);
      setDataLoading(false);
    }

    fetchData();
  }, [squadId]);

  if (loading || dataLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "system-ui" }}>
        Loading Squad...
      </div>
    );
  }

  const rankColors = ["#f59e0b", "#94a3b8", "#cd7f32"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      color: "#e2e8f0",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        padding: "28px 20px 20px",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5 }}>
          Slim Squad
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "4px 0 0", letterSpacing: 2, textTransform: "uppercase" }}>
          12-Month Challenge
        </p>
      </div>

      {/* Invite Code */}
      <div style={{ padding: "12px 20px", background: "#1e293b", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>Squad Code: </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#22c55e", letterSpacing: 3 }}>{squadId}</span>
        <span
          style={{ fontSize: 11, color: "#475569", marginLeft: 10, cursor: "pointer" }}
          onClick={() => navigator.clipboard.writeText(squadId!)}
        >
          📋 Copy
        </span>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{
          background: "rgba(30,41,59,0.8)",
          borderRadius: 16,
          padding: 18,
          border: "1px solid rgba(100,116,139,0.2)",
        }}>
          <div style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: "#64748b",
            fontWeight: 600,
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
          }}>
            <span>🏆 Leaderboard</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>% to Goal</span>
          </div>

          {members.length === 0 ? (
            <div style={{ textAlign: "center", color: "#475569", padding: "24px 0", fontSize: 14 }}>
              No members yet.<br />
              <span style={{ fontSize: 12 }}>Share the squad code so friends can join!</span>
            </div>
          ) : (
            members.map((m, i) => (
              <div
                key={m.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: i < members.length - 1 ? "1px solid rgba(100,116,139,0.1)" : "none",
                  cursor: "pointer",
                }}
                onClick={() => router.push(`/mystats?member=${m.userId}`)}
              >
                {/* Rank */}
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: rankColors[i] || "#475569",
                  minWidth: 22,
                  textAlign: "center",
                }}>
                  {i + 1}
                </span>

                {/* Avatar */}
                <span style={{ fontSize: 22 }}>{m.avatar}</span>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    {m.displayName}
                    {m.userId === user?.uid && <span style={{ fontSize: 9, background: "#22c55e", color: "#fff", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                    {m.lost > 0 ? `Lost ${m.lost.toFixed(1)} ${m.weightUnit}` : "—"}
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    {m.entries.length} entries
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, m.pct)}%`,
                      background: "linear-gradient(90deg, #22c55e, #16a34a)",
                      borderRadius: 3,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>

                {/* Percentage */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#22c55e" }}>{m.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>goal</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
