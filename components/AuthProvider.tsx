"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserSquad } from "../lib/db";

interface AuthContextType {
  user: User | null;
  squadId: string | null;
  loading: boolean;
  setSquadId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  squadId: null,
  loading: true,
  setSquadId: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [squadId, setSquadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Check if this user already belongs to a squad
        const existingSquad = await getUserSquad(firebaseUser.uid);
        if (existingSquad) {
          setSquadId(existingSquad);
        }
      } else {
        setSquadId(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, squadId, loading, setSquadId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
