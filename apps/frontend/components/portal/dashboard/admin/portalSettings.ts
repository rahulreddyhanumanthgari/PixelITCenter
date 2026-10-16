"use client";

import { useSyncExternalStore } from "react";

// Portal settings an admin changes in the Admin panel. DEMO: kept in this
// browser. The server still reads its copies from its settings file
// (apps/backend .env: COMPANY_*, REMINDER_DAYS_BEFORE_MONTH_END); with a
// settings API these become one server-side record that only admins change.

export type PortalSettings = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  remitTo: string;
  defaultPaymentTermsDays: number;
  reminderDaysBeforeMonthEnd: number;
};

export const defaultPortalSettings: PortalSettings = {
  companyName: "Pixel IT Center",
  companyAddress: "189 Tarleton Dr, Fuquay Varina, NC 27526",
  companyPhone: "+1 (336) 944-6562",
  companyEmail: "accounts@pixelitcenter.com",
  remitTo: "",
  defaultPaymentTermsDays: 30,
  reminderDaysBeforeMonthEnd: 3,
};

const KEY = "pixelit-demo-portal-settings";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: PortalSettings = defaultPortalSettings;

export function getPortalSettings(): PortalSettings {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? { ...defaultPortalSettings, ...(JSON.parse(raw) as Partial<PortalSettings>) } : defaultPortalSettings;
    } catch {
      cached = defaultPortalSettings;
    }
  }
  return cached;
}

export function savePortalSettings(next: PortalSettings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: lasts until the page reloads.
  }
  cachedRaw = JSON.stringify(next);
  cached = next;
  listeners.forEach((l) => l());
}

export function usePortalSettings(): PortalSettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getPortalSettings,
    () => defaultPortalSettings,
  );
}
