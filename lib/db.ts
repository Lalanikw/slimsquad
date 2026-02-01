"use client";

import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

// ─── TYPES ──────────────────────────────────────────────────────
export interface MemberProfile {
  userId: string;
  displayName: string;
  avatar: string;
  squadId: string;
  height: string;
  heightUnit: "cm" | "in";
  weight: string;
  weightUnit: "kg" | "lbs";
  waist: string;
  targetWeight: string;
  targetWaist: string;
  targetBMI: string;
  createdAt?: Timestamp;
}

export interface WeeklyEntry {
  id: string;       // e.g. "2025-01-27" (Monday of that week)
  userId: string;
  squadId: string;
  date: string;     // ISO date string
  weight: string;
  waist: string;
  bmi: string;
  createdAt?: Timestamp;
}

export interface Squad {
  id: string;        // short invite code e.g. "SLIM7A"
  name: string;
  createdBy: string;
  createdAt?: Timestamp;
}

// ─── SQUAD ──────────────────────────────────────────────────────

// Create a new squad
export async function createSquad(squadId: string, name: string, createdBy: string) {
  const squadDoc = doc(db, "squads", squadId);
  await setDoc(squadDoc, {
    id: squadId,
    name,
    createdBy,
    createdAt: Timestamp.now(),
  });
}

// Get a squad by ID
export async function getSquad(squadId: string): Promise<Squad | null> {
  const squadDoc = doc(db, "squads", squadId);
  const snap = await getDoc(squadDoc);
  return snap.exists() ? (snap.data() as Squad) : null;
}

// ─── MEMBER PROFILE ─────────────────────────────────────────────

// Create or update a member profile
export async function saveProfile(profile: MemberProfile) {
  const profileDoc = doc(db, "squads", profile.squadId, "members", profile.userId);
  await setDoc(profileDoc, { ...profile, updatedAt: Timestamp.now() }, { merge: true });
}

// Get a single member's profile
export async function getProfile(squadId: string, userId: string): Promise<MemberProfile | null> {
  const profileDoc = doc(db, "squads", squadId, "members", userId);
  const snap = await getDoc(profileDoc);
  return snap.exists() ? (snap.data() as MemberProfile) : null;
}

// Get all members in a squad
export async function getAllMembers(squadId: string): Promise<MemberProfile[]> {
  const membersCol = collection(db, "squads", squadId, "members");
  const snap = await getDocs(membersCol);
  return snap.docs.map((d) => d.data() as MemberProfile);
}

// ─── WEEKLY ENTRIES ─────────────────────────────────────────────

// Add or update a weekly entry
export async function saveEntry(entry: Omit<WeeklyEntry, "id"> & { date: string }) {
  const entryId = entry.date; // use the date as the unique ID
  const entryDoc = doc(db, "squads", entry.squadId, "members", entry.userId, "entries", entryId);
  await setDoc(entryDoc, { ...entry, id: entryId, createdAt: Timestamp.now() }, { merge: true });
}

// Get all entries for a member, sorted by date
export async function getEntries(squadId: string, userId: string): Promise<WeeklyEntry[]> {
  const entriesCol = collection(db, "squads", squadId, "members", userId, "entries");
  const q = query(entriesCol, orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WeeklyEntry);
}

// Delete a weekly entry by date
export async function deleteEntry(squadId: string, userId: string, date: string) {
  const entryDoc = doc(db, "squads", squadId, "members", userId, "entries", date);
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(entryDoc);
}
// Stores which squad a logged-in user belongs to

export async function setUserSquad(userId: string, squadId: string) {
  const userDoc = doc(db, "users", userId);
  await setDoc(userDoc, { squadId, updatedAt: Timestamp.now() }, { merge: true });
}

export async function getUserSquad(userId: string): Promise<string | null> {
  const userDoc = doc(db, "users", userId);
  const snap = await getDoc(userDoc);
  if (snap.exists()) {
    return (snap.data() as { squadId: string }).squadId;
  }
  return null;
}
