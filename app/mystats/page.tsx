"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";
import MemberSelector from "@/components/MemberSelector";
import {
  getAllMembers,
  getEntries,
  saveEntry,
  deleteEntry,
  MemberProfile,
  WeeklyEntry,
} from "@/lib/db";
import { calcBMI, bmiCategory, waistToCm } from "@/lib/utils";

// Wrapper that provides the Suspense boundary Next.js requires for useSearchParams
export default function MyStatsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "system-ui" }}>
        Loading...
      </div>
    }>
      <MyStatsContent />
    </Suspense>
  );
}

function MyStatsContent() {
  const { user, squadId, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [dataLoading, setDataLoading] = useState(true);

  // Log entry form
  const [showForm, setShowForm] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newWaist, setNewWaist] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !squadId)) {
      router.replace("/login");
    }
  }, [user, squadId, loading, router]);

  // Determine active member from URL param or default to current user
  useEffect(() => {
    const memberParam = searchParams.get("member");
    if (memberParam) {
      setActiveId(memberParam);
    } else if (user) {
      setActiveId(user.uid);
    }
  }, [searchParams, user]);

  // Fetch all squad members
  useEffect(() => {
    if (!squadId) return;
    async function fetchMembers() {
      const all = await getAllMembers(squadId!);
      setMembers(all);
      setDataLoading(false);
    }
    fetchMembers();
  }, [squadId]);

  // Fetch entries whenever active member changes
  useEffect(() => {
    if (!squadId || !activeId) return;
    async function fetchEntries() {
      const e = await getEntries(squadId!, activeId);
      setEntries(e);
    }
    fetchEntries();
  }, [squadId, activeId]);

  // Save a new weekly entry
  async function handleSaveEntry() {
    if (!newWeight || !squadId || !activeId) return;
    setSaving(true);

    const active = members.find((m) => m.userId === activeId);
    const bmi = calcBMI(newWeight, active?.weightUnit || "kg", active?.height || "0", active?.heightUnit || "cm");

    await saveEntry({
      userId: activeId,
      squadId,
      date: entryDate,
      weight: newWeight,
      waist: newWaist,
      bmi: bmi || "",
    });

    // Refresh entries
    const updated = await getEntries(squadId, activeId);
    setEntries(updated);

    setNewWeight("");
    setNewWaist("");
    setShowForm(false);
    setSaving(false);
  }

  // Delete an entry
  async function handleDeleteEntry(date: string) {
    if (!squadId || !activeId) return;
    if (!confirm("Remove this entry?")) return;
    await deleteEntry(squadId, activeId, date);
    const updated = await getEntries(squadId, activeId);
    setEntries(updated);
  }

  if (loading || dataLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "system-ui" }}>
        Loading...
      </div>
    );
  }

  const active = members.find((m) => m.userId === activeId);
  if (!active) return null;

  const currentBmi = entries.length > 0
    ? entries[entries.length - 1].bmi
    : calcBMI(active.weight, active.weightUnit, active.height, active.heightUnit);
  const cat = bmiCategory(currentBmi);

  const start = entries.length > 0 ? parseFloat(entries[0].weight) : parseFloat(active.weight) || 0;
  const current = entries.length > 0 ? parseFloat(entries[entries.length - 1].weight) : parseFloat(active.weight) || 0;
  const target = parseFloat(active.targetWeight) || 0;
  const totalLost = start - current;
  const needed = start - target;
  const pct = needed > 0 ? Math.max(0, Math.min(100, (totalLost / needed) * 100)) : 0;

  // Waist progress — convert everything to cm for consistent comparison
  const waistUnit = active.waistUnit || "cm";
  const targetWaistUnit = active.targetWaistUnit || "cm";
  const waistStartCm = entries.length > 0
    ? waistToCm(entries[0].waist, waistUnit)
    : waistToCm(active.waist, waistUnit);
  const waistCurrentCm = entries.length > 0
    ? waistToCm(entries[entries.length - 1].waist || active.waist, waistUnit)
    : waistToCm(active.waist, waistUnit);
  const waistTargetCm = waistToCm(active.targetWaist, targetWaistUnit);
  const waistNeeded = waistStartCm - waistTargetCm;
  const waistPct = waistNeeded > 0 ? Math.max(0, Math.min(100, ((waistStartCm - waistCurrentCm) / waistNeeded) * 100)) : 0;
  // Display value stays in user's chosen unit
  const waistDisplayCurrent = entries.length > 0
    ? entries[entries.length - 1].waist || active.waist
    : active.waist;

  const cardStyle: React.CSSProperties = {
    background: "rgba(30,41,59,0.8)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    border: "1px solid rgba(100,116,139,0.2)",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#64748b",
    fontWeight: 600,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

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

      {/* Member Selector */}
      <MemberSelector
        members={members}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          router.push(`/mystats?member=${id}`);
        }}
      />

      <div style={{ padding: "16px 20px" }}>
        {/* BMI Card */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>
            <span>BMI</span>
            <span style={{ color: cat.color, fontWeight: 700, fontSize: 12 }}>{cat.label}</span>
          </div>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: `6px solid ${cat.color}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            background: `${cat.color}15`,
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: cat.color }}>{currentBmi || "—"}</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>BMI</span>
          </div>
          {active.targetBMI && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Target: <span style={{ color: "#22c55e", fontWeight: 700 }}>{active.targetBMI}</span>
            </div>
          )}
        </div>

        {/* Progress Card */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>
            <span>Progress to Goal</span>
            <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 12 }}>{pct.toFixed(1)}%</span>
          </div>
          {[
            { label: "Started", value: `${start || "—"} ${active.weightUnit}`, color: "#e2e8f0" },
            { label: "Current", value: `${current || "—"} ${active.weightUnit}`, color: totalLost > 0 ? "#22c55e" : "#e2e8f0" },
            { label: "Target", value: `${target || "—"} ${active.weightUnit}`, color: "#f59e0b" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "#64748b" }}>{row.label}</span>
              <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
            </div>
          ))}
          <div style={{ height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, pct)}%`,
              background: "linear-gradient(90deg, #22c55e, #16a34a)",
              borderRadius: 4,
              transition: "width 0.6s ease",
            }} />
          </div>
          {totalLost > 0 && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: "#22c55e", fontWeight: 600 }}>
              🎉 Lost {totalLost.toFixed(1)} {active.weightUnit} so far!
            </div>
          )}
        </div>

        {/* Waist Card */}
        {active.waist && (
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <span>Waist</span>
              {active.targetWaist && <span style={{ color: "#f59e0b", fontSize: 12 }}>Target: {active.targetWaist} {active.targetWaistUnit || "cm"}</span>}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {waistDisplayCurrent || "—"} <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{waistUnit}</span>
            </div>
            {active.targetWaist && (
              <div style={{ height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, waistPct)}%`,
                  background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }} />
              </div>
            )}
          </div>
        )}

        {/* Log Entry */}
        {!showForm ? (
          <button
            style={{
              background: "transparent",
              color: "#22c55e",
              border: "1px solid #22c55e",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
            }}
            onClick={() => setShowForm(true)}
          >
            📝 Log This Week's Weigh-In
          </button>
        ) : (
          <div style={cardStyle}>
            <div style={cardTitleStyle}><span>New Entry</span></div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                style={{
                  background: "#0f172a",
                  border: "1px solid rgba(100,116,139,0.3)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: "#e2e8f0",
                  fontSize: 15,
                  fontWeight: 600,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Weight ({active.weightUnit})</label>
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder={active.weight || "0"}
                  style={{
                    background: "#0f172a",
                    border: "1px solid rgba(100,116,139,0.3)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: "#e2e8f0",
                    fontSize: 15,
                    fontWeight: 600,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Waist ({active.waistUnit || "cm"})</label>
                <input
                  type="number"
                  value={newWaist}
                  onChange={(e) => setNewWaist(e.target.value)}
                  placeholder={active.waist || "0"}
                  style={{
                    background: "#0f172a",
                    border: "1px solid rgba(100,116,139,0.3)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: "#e2e8f0",
                    fontSize: 15,
                    fontWeight: 600,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={handleSaveEntry}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                style={{
                  flex: 0.5,
                  background: "#334155",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {/* Entry History */}
        {entries.length > 0 && (
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <span>📋 Entries</span>
              <span style={{ fontSize: 12, color: "#22c55e" }}>{entries.length} logged</span>
            </div>
            {[...entries].reverse().map((e, i) => {
              const prev = i < entries.length - 1 ? [...entries].reverse()[i + 1] : null;
              const diff = prev ? (parseFloat(e.weight) - parseFloat(prev.weight)).toFixed(1) : null;
              const diffColor = diff && parseFloat(diff) < 0 ? "#22c55e" : diff && parseFloat(diff) > 0 ? "#ef4444" : "#64748b";
              return (
                <div key={e.date} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < entries.length - 1 ? "1px solid rgba(100,116,139,0.1)" : "none",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      Waist: {e.waist || "—"} {waistUnit} &nbsp;|&nbsp; BMI: {e.bmi || "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{e.weight} {active.weightUnit}</div>
                    {diff && <div style={{ fontSize: 11, color: diffColor, fontWeight: 600 }}>{parseFloat(diff) > 0 ? "+" : ""}{diff}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(e.date)}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 8,
                      color: "#ef4444",
                      fontSize: 14,
                      cursor: "pointer",
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}