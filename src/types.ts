export type GradientKey = "violet" | "cyan" | "emerald" | "amber" | "rose" | "sky";

/** How buyers get the app after entering their key. */
export type DeliveryType = "webapp" | "link";

export interface AppItem {
  id: string;
  name: string;
  description: string;
  version: string;
  price: number;
  icon: string; // emoji shown on the icon tile
  color: GradientKey; // gradient used for the icon tile
  delivery: DeliveryType; // "webapp" = runs on this site, "link" = unlocks a hidden URL
  linkUrl?: string; // secret URL revealed to key holders (delivery === "link")
  fileName: string; // display name of the upload (e.g. my-game.zip)
  fileSize: number; // bytes
  createdAt: string; // ISO
}

export interface LicenseKey {
  id: string;
  key: string; // formatted like XXXX-XXXX-XXXX-XXXX
  appId: string;
  customerName: string;
  customerEmail: string;
  maxDownloads: number;
  downloadCount: number;
  expiresAt: string | null; // ISO date or null = never
  revoked: boolean;
  createdAt: string;
}

export interface DownloadEvent {
  id: string;
  keyId: string;
  appId: string;
  at: string; // ISO
}

export interface Settings {
  storeName: string;
  tagline: string;
  currency: string;
  contactInfo: string; // how buyers reach you to purchase a key
}

export interface DB {
  apps: AppItem[];
  keys: LicenseKey[];
  events: DownloadEvent[];
  settings: Settings;
}
