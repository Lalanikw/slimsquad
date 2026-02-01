"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";
import { getProfile, saveProfile, MemberProfile } from "@/lib/db";
import { calcBMI, bmiCategory } from "@/lib/utils";

const avatars = ["💪", "🏃", "🚴", "🧘", "⚡", "🔥", "🌟", "🎯", "🏋️", "🧗"];

export default function ProfilePage() {
  const { user, squadId, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !squadId)) {
      router.replace("/login");
    }
  }, [user, squadId, loading, router]);

  useEffect(() => {
    if (!squadId || !user) return;
    async function fetchProfile() {
      const p = await getProfile(squadId!, user!.uid);
      if (p) {
        // Backfill waistUnit for existing profiles that don't have it yet
        if (!p.waistUnit) p.waistUnit = "cm";
        if (!p.targetWaistUnit) p.targetWaistUnit = "cm";
        setProfile(p);
      }
      setDataLoading(false);
    }
    fetchProfile();
  }, [squadId, user]);

  function updateField(field: keyof MemberProfile, value: string) {
    if (!profile) return;
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveProfile(updated);
  }

  function saveName() {
    if (!profile || !tempName.trim()) return;
    const updated = { ...profile, displayName: tempName.trim() };
    setProfile(updated);
    saveProfile(updated);
    setEditingName(false);
  }

  function saveAvatar(avatar: string) {
    if (!profile) return;
    const updated = { ...profile, avatar };
    setProfile(updated);
    saveProfile(updated);
    setShowAvatarPicker(false);
  }

  if (loading || dataLoading || !profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "system-ui" }}>
        Loading...
      </div>
    );
  }

  const bmi = calcBMI(profile.weight, profile.weightUnit, profile.height, profile.heightUnit);
  const cat = bmiCategory(bmi);

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
  };

  const inputStyle: React.CSSProperties = {
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
  };

  const selectStyle: React.CSSProperties = {
    background: "#0f172a",
    border: "1px solid rgba(100,116,139,0.3)",
    borderRadius: 10,
    padding: "10px 8px",
    color: "#64748b",
    fontSize: 13,
    outline: "none",
    minWidth: 56,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: 0.5,
    marginBottom: 4,
    display: "block",
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

      <div style={{ padding: "16px 20px" }}>
        {/* Name & Avatar Card */}
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: 44, cursor: "pointer", display: "inline-block" }}
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            >
              {profile.avatar}
            </div>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 8 }}>Tap to change</div>

            {showAvatarPicker && (
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 8,
                padding: "12px 0",
                background: "#0f172a",
                borderRadius: 12,
                marginBottom: 12,
              }}>
                {avatars.map((a) => (
                  <span
                    key={a}
                    onClick={() => saveAvatar(a)}
                    style={{
                      fontSize: 24,
                      cursor: "pointer",
                      padding: 6,
                      borderRadius: 8,
                      background: profile.avatar === a ? "rgba(34,197,94,0.2)" : "transparent",
                      border: profile.avatar === a ? "2px solid #22c55e" : "2px solid transparent",
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}

            {editingName ? (
              <div>
                <input
                  autoFocus
                  style={{ ...inputStyle, textAlign: "center", marginBottom: 8 }}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                />
                <button
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={saveName}
                >
                  Save
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.displayName}</div>
                <div
                  style={{ fontSize: 12, color: "#22c55e", cursor: "pointer", marginTop: 4 }}
                  onClick={() => { setEditingName(true); setTempName(profile.displayName); }}
                >
                  ✏️ Edit Name
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Measurements Card */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Measurements</div>

          {/* Height */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Height</label>
              <input type="number" style={inputStyle} value={profile.height} onChange={(e) => updateField("height", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <select style={selectStyle} value={profile.heightUnit} onChange={(e) => updateField("heightUnit", e.target.value)}>
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>

          {/* Weight */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Weight</label>
              <input type="number" style={inputStyle} value={profile.weight} onChange={(e) => updateField("weight", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <select style={selectStyle} value={profile.weightUnit} onChange={(e) => updateField("weightUnit", e.target.value)}>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>

          {/* Waist — with unit selector */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Waist</label>
              <input type="number" style={inputStyle} value={profile.waist} onChange={(e) => updateField("waist", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <select style={selectStyle} value={profile.waistUnit || "cm"} onChange={(e) => updateField("waistUnit", e.target.value)}>
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>

          {/* Live BMI */}
          {profile.height && profile.weight && (
            <div style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "#0f172a",
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>Current BMI</span>
              <span style={{ fontWeight: 700, color: cat.color, fontSize: 14 }}>
                {bmi} <span style={{ fontSize: 11, color: "#64748b" }}>({cat.label})</span>
              </span>
            </div>
          )}
        </div>

        {/* Targets Card */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>🎯 Targets (12-Month Goal)</div>

          {/* Target Weight */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Target Weight ({profile.weightUnit})</label>
            <input type="number" style={inputStyle} value={profile.targetWeight} onChange={(e) => updateField("targetWeight", e.target.value)} placeholder="0" />
          </div>

          {/* Target Waist — with unit selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Target Waist</label>
              <input type="number" style={inputStyle} value={profile.targetWaist} onChange={(e) => updateField("targetWaist", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <select style={selectStyle} value={profile.targetWaistUnit || "cm"} onChange={(e) => updateField("targetWaistUnit", e.target.value)}>
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>

          {/* Target BMI */}
          <div>
            <label style={labelStyle}>Target BMI</label>
            <input type="number" style={inputStyle} value={profile.targetBMI} onChange={(e) => updateField("targetBMI", e.target.value)} placeholder="e.g. 24.9" />
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}