"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../components/AuthProvider";
import {
  createSquad,
  getSquad,
  saveProfile,
  setUserSquad,
  getProfile,
} from "../../lib/db";

const avatars = ["💪", "🏃", "🚴", "🧘", "⚡", "🔥", "🌟", "🎯", "🏋️", "🧗"];

function generateSquadId(): string {
  // 6-char alphanumeric code
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function LoginPage() {
  const { user, squadId, loading, setSquadId } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"login" | "squad">("login");
  const [squadInput, setSquadInput] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  // If already has a squad, go to dashboard
  useEffect(() => {
    if (!loading && user && squadId) {
      router.replace("/squad");
    }
    // If user is logged in but no squad, show squad step
    if (!loading && user && !squadId) {
      setStep("squad");
    }
  }, [user, squadId, loading, router]);

  // Google login
  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError("Login failed. Please try again.");
    }
  }

  // Logout
  async function handleLogout() {
    await signOut(auth);
    setStep("login");
  }

  // Create a new squad
  async function handleCreateSquad() {
    if (!user) return;
    setCreating(true);
    setError("");

    const newId = generateSquadId();
    try {
      await createSquad(newId, "Slim Squad", user.uid);
      await setUserSquad(user.uid, newId);

      // Save this user's profile in the squad
      await saveProfile({
        userId: user.uid,
        displayName: user.displayName || "You",
        avatar: avatars[0],
        squadId: newId,
        height: "",
        heightUnit: "cm",
        weight: "",
        weightUnit: "kg",
        waist: "",
        targetWeight: "",
        targetWaist: "",
        targetBMI: "",
      });

      setSquadId(newId);
      router.replace("/squad");
    } catch (e) {
      setError("Failed to create squad. Try again.");
    }
    setCreating(false);
  }

  // Join an existing squad
  async function handleJoinSquad() {
    if (!user || !squadInput.trim()) return;
    setCreating(true);
    setError("");

    const code = squadInput.trim().toUpperCase();
    try {
      const squad = await getSquad(code);
      if (!squad) {
        setError("Squad not found. Check the code and try again.");
        setCreating(false);
        return;
      }

      // Check if user already has a profile in this squad
      const existing = await getProfile(code, user.uid);

      await setUserSquad(user.uid, code);

      if (!existing) {
        // Pick a random avatar
        const avatar = avatars[Math.floor(Math.random() * avatars.length)];
        await saveProfile({
          userId: user.uid,
          displayName: user.displayName || "Friend",
          avatar,
          squadId: code,
          height: "",
          heightUnit: "cm",
          weight: "",
          weightUnit: "kg",
          waist: "",
          targetWeight: "",
          targetWaist: "",
          targetBMI: "",
        });
      }

      setSquadId(code);
      router.replace("/squad");
    } catch (e) {
      setError("Something went wrong. Try again.");
    }
    setCreating(false);
  }

  // ─── RENDER ───────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "rgba(30,41,59,0.8)",
    borderRadius: 16,
    padding: 24,
    border: "1px solid rgba(100,116,139,0.2)",
    marginTop: 24,
  };

  const inputStyle: React.CSSProperties = {
    background: "#0f172a",
    border: "1px solid rgba(100,116,139,0.3)",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: 600,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    textTransform: "uppercase",
    letterSpacing: 3,
  };

  const btnStyle = (variant: "primary" | "ghost" | "outline" = "primary"): React.CSSProperties => ({
    background:
      variant === "primary" ? "linear-gradient(135deg, #22c55e, #16a34a)" :
      variant === "ghost" ? "transparent" : "#334155",
    color: variant === "ghost" ? "#22c55e" : "#fff",
    border: variant === "ghost" ? "1px solid #22c55e" : "none",
    borderRadius: 10,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    letterSpacing: 0.5,
  });

  // ── STEP 1: Login ──
  if (step === "login" || !user) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#e2e8f0",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 56 }}>🏆</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "8px 0 4px", letterSpacing: -1 }}>
            Slim Squad
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            12-Month Weight Loss Challenge
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", margin: "0 0 20px" }}>
              Sign in with Google to get started
            </p>
            <button style={btnStyle("primary")} onClick={handleGoogleLogin}>
              <span style={{ marginRight: 8 }}>🔵</span> Sign In with Google
            </button>
            {error && (
              <p style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginTop: 12, marginBottom: 0 }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Create or Join Squad ──
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e2e8f0",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Greeting */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 40 }}>👋</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 4px" }}>
            Hey {user.displayName?.split(" ")[0] || "there"}!
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Create a squad or join one with a code
          </p>
        </div>

        {/* Create Squad */}
        <div style={cardStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#64748b", fontWeight: 600, marginBottom: 10 }}>
            Start New Squad
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
            Create a squad and share the code with your 6 friends.
          </p>
          <button style={btnStyle("primary")} onClick={handleCreateSquad} disabled={creating}>
            {creating ? "Creating..." : "🏆 Create Squad"}
          </button>
        </div>

        {/* Join Squad */}
        <div style={cardStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#64748b", fontWeight: 600, marginBottom: 10 }}>
            Join Existing Squad
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
            Enter the squad code a friend shared with you.
          </p>
          <input
            type="text"
            placeholder="e.g. SLIM7A"
            style={inputStyle}
            value={squadInput}
            onChange={(e) => setSquadInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoinSquad()}
          />
          <button style={{ ...btnStyle("ghost"), marginTop: 10 }} onClick={handleJoinSquad} disabled={creating}>
            {creating ? "Joining..." : "Join Squad →"}
          </button>
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginTop: 16 }}>
            {error}
          </p>
        )}

        {/* Logout link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span
            style={{ fontSize: 12, color: "#475569", cursor: "pointer" }}
            onClick={handleLogout}
          >
            Sign out
          </span>
        </div>
      </div>
    </div>
  );
}
