"use client";

import { useSyncExternalStore } from "react";

// DEMO: which students an admin deleted, kept in this browser (by PixelIT ID).
// Deleted students disappear from Talent, Placements and the Add placement
// student list. With the backend this becomes a real delete (or archive) on the
// server, admin-only and logged; what happens to their placements and invoices
// is decided then.

const KEY = "pixelit-demo-deleted-students";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: string[] = [];

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      cached = [];
    }
  }
  return cached;
}

function write(pics: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pics));
  } catch {
    // Storage blocked: lasts until the page reloads.
  }
  cachedRaw = JSON.stringify(pics);
  cached = pics;
  listeners.forEach((l) => l());
}

const EMPTY: string[] = [];

/** PixelIT IDs of deleted students. */
export function useDeletedStudents(): string[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

export function deleteStudent(pic: string) {
  const now = read();
  if (!now.includes(pic)) write([...now, pic]);
}

/** Demo only: bring every deleted student back. */
export function restoreDeletedStudents() {
  write([]);
}
