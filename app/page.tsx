"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function Home() {
  const { user, squadId, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    } else if (squadId) {
      router.replace("/squad");
    }
    // If user is logged in but has no squadId, stay here briefly
    // then redirect to login where they can create/join a squad
    else {
      router.replace("/login");
    }
  }, [user, squadId, loading, router]);

  // Brief loading screen while auth state resolves
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f172a",
      color: "#64748b",
      fontFamily: "system-ui, sans-serif",
      fontSize: 14,
    }}>
      Loading...
    </div>
  );
}
