"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppItem, GradientKey, LicenseKey, Settings } from "@/types";
import {
  ICON_GRADIENTS,
  formatBytes,
  formatDate,
  formatPrice,
} from "@/lib/ui";

/* =================================================================== types */

type DashboardData = {
  apps: AppItem[];
  keys: LicenseKey[];
  settings: Settings;
  totalDownloads: number;
};

type Props = { initial: DashboardData; showDefaultPasswordWarning: boolean };

type Tab = "apps" | "keys" | "settings";

type ModalState =
  | null
  | { type: "add-app" }
  | { type: "edit-app"; app: AppItem }
  | { type: "gen-key" }
  | { type: "key-created"; key: LicenseKey; appName: string };

/* ================================================================ helpers */

function keyStatus(k: LicenseKey): { label: string; cls: string } {
  if (k.revoked) return { label: "Revoked", cls: "pill-bad" };
  if (k.expiresAt && new Date(k.expiresAt).getTime() < Date.now())
    return { label: "Expired", cls: "pill-warn" };
  if (k.downloadCount >= k.maxDownloads) return { label: "Used up", cls: "pill-off" };
  return { label: "Active", cls: "pill-ok" };
}

async function copyText(t: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    return false;
  }
}

/* =================================================================== modal */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 className="display" style={{ fontSize: 20, fontWeight: 650, margin: 0 }}>
            {title}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================ app form modal */

const GRADIENT_KEYS: GradientKey[] = ["violet", "cyan", "emerald", "amber", "rose", "sky"];

function AppFormModal({
  existing,
  onClose,
  onSaved,
  showError,
}: {
  existing: AppItem | null;
  onClose: () => void;
  onSaved: () => void;
  showError: (msg: string) => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [version, setVersion] = useState(existing?.version ?? "1.0.0");
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [icon, setIcon] = useState(existing?.icon ?? "📦");
  const [color, setColor] = useState<GradientKey>(existing?.color ?? "violet");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("description", description);
      fd.set("version", version);
      fd.set("price", String(Number(price) || 0));
      fd.set("icon", icon || "📦");
      fd.set("color", color);
      if (file) fd.set("file", file);

      const res = await fetch(existing ? `/api/admin/apps/${existing.id}` : "/api/admin/apps", {
        method: existing ? "PATCH" : "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data.error || "Could not save the application.");
      } else {
        onSaved();
      }
    } catch {
      showError("Network error while saving.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={existing ? "Edit application" : "Add application"} onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ display: "flex", gap: 14 }}>
          <div className="field" style={{ width: 86 }}>
            <label>Icon</label>
            <input
              className="input"
              style={{ textAlign: "center", fontSize: 20, padding: "9px 6px" }}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Name *</label>
            <input
              className="input"
              placeholder="e.g. Photo Editor Pro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            className="textarea"
            placeholder="What does this app do? Show buyers what's inside."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Version</label>
            <input className="input" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Price</label>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="499"
            />
          </div>
        </div>

        <div className="field">
          <label>Tile color</label>
          <div style={{ display: "flex", gap: 10 }}>
            {GRADIENT_KEYS.map((g) => (
              <button
                key={g}
                type="button"
                aria-label={g}
                className={`swatch ${color === g ? "selected" : ""}`}
                style={{ background: ICON_GRADIENTS[g] }}
                onClick={() => setColor(g)}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>{existing ? "Replace app file (optional)" : "App file *"}</label>
          <input
            type="file"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required={!existing}
          />
          <span className="faint" style={{ fontSize: 12.5 }}>
            {existing
              ? `Current file: ${existing.fileName} (${formatBytes(existing.fileSize)}). Upload a new file only to replace it.`
              : "The installer/archive buyers will download — .zip, .exe, .apk, .dmg, anything."}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" /> Uploading…
              </>
            ) : existing ? (
              "Save changes"
            ) : (
              "Add application"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================ key form modal */

function KeyFormModal({
  apps,
  onClose,
  onCreated,
  showError,
}: {
  apps: AppItem[];
  onClose: () => void;
  onCreated: (key: LicenseKey) => void;
  showError: (msg: string) => void;
}) {
  const [appId, setAppId] = useState(apps[0]?.id ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("3");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          customerName,
          customerEmail,
          maxDownloads: Number(maxDownloads) || 3,
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) showError(data.error || "Could not generate the key.");
      else onCreated(data.key as LicenseKey);
    } catch {
      showError("Network error while generating key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Generate license key" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Application *</label>
          <select className="select" value={appId} onChange={(e) => setAppId(e.target.value)} required>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name} (v{a.version})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Customer name</label>
            <input
              className="input"
              placeholder="e.g. Rahul Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Customer email</label>
            <input
              className="input"
              type="email"
              placeholder="optional"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Max downloads</label>
            <input
              className="input"
              type="number"
              min="1"
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Expires on (optional)</label>
            <input className="input" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !appId}>
            {busy ? (
              <>
                <span className="spinner" /> Generating…
              </>
            ) : (
              "Generate key"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ================================================================ dashboard */

export default function Dashboard({ initial, showDefaultPasswordWarning }: Props) {
  const router = useRouter();
  const [apps, setApps] = useState(initial.apps);
  const [keys, setKeys] = useState(initial.keys);
  const [settings, setSettings] = useState(initial.settings);
  const [totalDownloads, setTotalDownloads] = useState(initial.totalDownloads);
  const [tab, setTab] = useState<Tab>("apps");
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(msg: string, error = false) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, error });
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }
  const showError = (msg: string) => showToast(msg, true);

  async function refresh() {
    const res = await fetch("/api/admin/state");
    if (res.ok) {
      const d = await res.json();
      setApps(d.apps);
      setKeys(d.keys);
      setSettings(d.settings);
      setTotalDownloads(d.totalDownloads);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function deleteApp(app: AppItem) {
    if (!window.confirm(`Delete "${app.name}"? Its file will be removed and all its license keys deleted.`)) return;
    const res = await fetch(`/api/admin/apps/${app.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast(`"${app.name}" deleted`);
      refresh();
    } else showError("Could not delete the application.");
  }

  async function toggleKey(k: LicenseKey) {
    const res = await fetch(`/api/admin/keys/${k.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revoked: !k.revoked }),
    });
    if (res.ok) {
      showToast(k.revoked ? "Key re-activated" : "Key revoked");
      refresh();
    } else showError("Could not update the key.");
  }

  async function deleteKey(k: LicenseKey) {
    if (!window.confirm(`Delete key ${k.key}?`)) return;
    const res = await fetch(`/api/admin/keys/${k.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Key deleted");
      refresh();
    } else showError("Could not delete the key.");
  }

  async function handleCopy(id: string, text: string) {
    if (await copyText(text)) {
      setCopiedId(id);
      showToast("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 1600);
    } else showError("Could not copy — select and copy manually.");
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast("Settings saved");
        router.refresh(); // updates nav/footer text
      } else showError("Could not save settings.");
    } finally {
      setSettingsBusy(false);
    }
  }

  const appById = (id: string) => apps.find((a) => a.id === id);
  const activeKeys = keys.filter((k) => keyStatus(k).label === "Active").length;
  const storageUsed = apps.reduce((s, a) => s + a.fileSize, 0);

  return (
    <div className="wrap" style={{ paddingTop: 46 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 className="display" style={{ fontSize: 30, fontWeight: 700, margin: 0 }}>
            Dashboard
          </h1>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
            Manage your applications and license keys
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>

      {showDefaultPasswordWarning && (
        <div
          style={{
            border: "1px solid rgba(255,194,75,0.35)",
            background: "rgba(255,194,75,0.07)",
            color: "var(--warn)",
            borderRadius: 14,
            padding: "13px 18px",
            fontSize: 13.5,
            marginBottom: 24,
            lineHeight: 1.55,
          }}
        >
          ⚠️ You&apos;re using the <b>default admin password</b> (admin123). Set{" "}
          <code className="mono" style={{ fontSize: 12.5 }}>ADMIN_PASSWORD</code> in a{" "}
          <code className="mono" style={{ fontSize: 12.5 }}>.env.local</code> file and restart the
          server to secure your dashboard.
        </div>
      )}

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 30 }}>
        <div className="stat">
          <div className="num">{apps.length}</div>
          <div className="lbl">Applications</div>
        </div>
        <div className="stat" style={{ ["--stat-glow" as string]: "rgba(61,220,151,0.25)" }}>
          <div className="num">{activeKeys}</div>
          <div className="lbl">Active keys</div>
        </div>
        <div className="stat" style={{ ["--stat-glow" as string]: "rgba(56,217,245,0.25)" }}>
          <div className="num">{totalDownloads}</div>
          <div className="lbl">Total downloads</div>
        </div>
        <div className="stat" style={{ ["--stat-glow" as string]: "rgba(255,194,75,0.22)" }}>
          <div className="num">{formatBytes(storageUsed)}</div>
          <div className="lbl">Storage used</div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div className="tabs" role="tablist">
          <button className={`tab ${tab === "apps" ? "active" : ""}`} onClick={() => setTab("apps")} role="tab">
            Applications
          </button>
          <button className={`tab ${tab === "keys" ? "active" : ""}`} onClick={() => setTab("keys")} role="tab">
            License keys
          </button>
          <button className={`tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")} role="tab">
            Settings
          </button>
        </div>
        {tab === "apps" && (
          <button className="btn btn-primary" onClick={() => setModal({ type: "add-app" })}>
            + Add application
          </button>
        )}
        {tab === "keys" && (
          <button
            className="btn btn-primary"
            onClick={() => (apps.length ? setModal({ type: "gen-key" }) : showError("Add an application first."))}
          >
            + Generate key
          </button>
        )}
      </div>

      {/* ---- apps tab ---- */}
      {tab === "apps" && (
        <>
          {apps.length === 0 ? (
            <div className="card" style={{ padding: "70px 30px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🚀</div>
              <h3 className="display" style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                Add your first application
              </h3>
              <p className="muted" style={{ fontSize: 14.5, maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.65 }}>
                Upload your app file, set a price, then generate license keys for your customers.
              </p>
              <button className="btn btn-primary" onClick={() => setModal({ type: "add-app" })}>
                + Add application
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {apps.map((app) => {
                const appKeys = keys.filter((k) => k.appId === app.id);
                const appDownloads = appKeys.reduce((s, k) => s + k.downloadCount, 0);
                return (
                  <div key={app.id} className="card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <span className="app-icon app-icon-sm" style={{ background: ICON_GRADIENTS[app.color] }} aria-hidden>
                        {app.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="display" style={{ fontSize: 17, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {app.name}
                        </div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                          v{app.version} · {formatBytes(app.fileSize)}
                        </div>
                      </div>
                      <span className="chip">{formatPrice(app.price, settings.currency)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      <span className="chip mono" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        📄 {app.fileName}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {appKeys.length} key{appKeys.length === 1 ? "" : "s"} · {appDownloads} download{appDownloads === 1 ? "" : "s"}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: "edit-app", app })}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteApp(app)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---- keys tab ---- */}
      {tab === "keys" && (
        <>
          {keys.length === 0 ? (
            <div className="card" style={{ padding: "70px 30px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🔑</div>
              <h3 className="display" style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                No license keys yet
              </h3>
              <p className="muted" style={{ fontSize: 14.5, maxWidth: 460, margin: "0 auto", lineHeight: 1.65 }}>
                {apps.length === 0
                  ? "Add an application first, then generate keys for your customers."
                  : "Generate a key for a customer and send it to them — they'll use it to download your app."}
              </p>
            </div>
          ) : (
            <div className="card" style={{ overflowX: "auto", padding: "6px 6px 2px" }}>
              <table className="table" suppressHydrationWarning>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Application</th>
                    <th>Customer</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys
                    .slice()
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((k) => {
                      const st = keyStatus(k);
                      const app = appById(k.appId);
                      return (
                        <tr key={k.id}>
                          <td>
                            <button
                              className="chip mono"
                              style={{ cursor: "pointer", fontSize: 13, color: "var(--ink)" }}
                              title="Click to copy"
                              onClick={() => handleCopy(k.id, k.key)}
                            >
                              {copiedId === k.id ? "✓ Copied" : k.key}
                            </button>
                          </td>
                          <td>
                            {app ? (
                              <span style={{ whiteSpace: "nowrap" }}>
                                {app.icon} {app.name}
                              </span>
                            ) : (
                              <span className="faint">deleted app</span>
                            )}
                          </td>
                          <td>
                            {k.customerName || k.customerEmail ? (
                              <>
                                <div style={{ fontSize: 13.5 }}>{k.customerName || "—"}</div>
                                <div className="faint" style={{ fontSize: 12 }}>{k.customerEmail}</div>
                              </>
                            ) : (
                              <span className="faint">—</span>
                            )}
                          </td>
                          <td className="mono" style={{ fontSize: 13 }}>
                            {k.downloadCount} / {k.maxDownloads}
                            {k.expiresAt && (
                              <div className="faint" style={{ fontSize: 11.5 }}>
                                exp {formatDate(k.expiresAt)}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`pill ${st.cls}`} suppressHydrationWarning>
                              {st.label}
                            </span>
                          </td>
                          <td className="muted" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                            {formatDate(k.createdAt)}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => toggleKey(k)}>
                                {k.revoked ? "Activate" : "Revoke"}
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteKey(k)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ---- settings tab ---- */}
      {tab === "settings" && (
        <div className="card" style={{ padding: "30px 30px 26px", maxWidth: 640 }}>
          <h3 className="display" style={{ fontSize: 19, fontWeight: 650, margin: "0 0 20px" }}>
            Store settings
          </h3>
          <form onSubmit={saveSettings}>
            <div style={{ display: "flex", gap: 14 }}>
              <div className="field" style={{ flex: 2 }}>
                <label>Store name</label>
                <input
                  className="input"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  required
                />
              </div>
              <div className="field" style={{ width: 110 }}>
                <label>Currency</label>
                <input
                  className="input"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="field">
              <label>Tagline</label>
              <input
                className="input"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
            </div>
            <div className="field">
              <label>How buyers contact you (shown on the store page)</label>
              <textarea
                className="textarea"
                value={settings.contactInfo}
                onChange={(e) => setSettings({ ...settings, contactInfo: e.target.value })}
                placeholder={"e.g. WhatsApp: +91 98xxxxxx21\nEmail: sales@mydomain.com"}
              />
              <span className="faint" style={{ fontSize: 12.5 }}>
                Since purchases happen manually, buyers use this to reach you and receive their key.
              </span>
            </div>
            <button className="btn btn-primary" disabled={settingsBusy}>
              {settingsBusy ? (
                <>
                  <span className="spinner" /> Saving…
                </>
              ) : (
                "Save settings"
              )}
            </button>
          </form>
          <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "26px 0 18px" }} />
          <p className="faint" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            🔒 Admin password is set with the <code className="mono">ADMIN_PASSWORD</code> environment
            variable (see <code className="mono">.env.example</code>). Sessions last 7 days.
          </p>
        </div>
      )}

      {/* ---- modals ---- */}
      {modal?.type === "add-app" && (
        <AppFormModal existing={null} onClose={() => setModal(null)} onSaved={() => { setModal(null); showToast("Application added"); refresh(); }} showError={showError} />
      )}
      {modal?.type === "edit-app" && (
        <AppFormModal existing={modal.app} onClose={() => setModal(null)} onSaved={() => { setModal(null); showToast("Application updated"); refresh(); }} showError={showError} />
      )}
      {modal?.type === "gen-key" && (
        <KeyFormModal
          apps={apps}
          onClose={() => setModal(null)}
          onCreated={(key) => {
            refresh();
            setModal({ type: "key-created", key, appName: appById(key.appId)?.name ?? "" });
          }}
          showError={showError}
        />
      )}
      {modal?.type === "key-created" && (
        <Modal title="Key generated 🎉" onClose={() => setModal(null)}>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>
            Send this key to your customer{modal.appName ? ` — it unlocks ` : ""}
            {modal.appName && <b style={{ color: "var(--ink)" }}>{modal.appName}</b>}.
            {modal.key.customerName && (
              <>
                {" "}
                For <b style={{ color: "var(--ink)" }}>{modal.key.customerName}</b>
                {modal.key.customerEmail ? ` (${modal.key.customerEmail})` : ""}.
              </>
            )}
          </p>
          <div
            className="mono"
            style={{
              fontSize: 21,
              letterSpacing: "0.14em",
              textAlign: "center",
              padding: "18px 12px",
              borderRadius: 14,
              background: "rgba(109,92,255,0.1)",
              border: "1px solid rgba(109,92,255,0.4)",
              marginBottom: 18,
              wordBreak: "break-all",
            }}
          >
            {modal.key.key}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleCopy("new", modal.type === "key-created" ? modal.key.key : "")}>
              Copy key
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* toast */}
      {toast && <div className={`toast ${toast.error ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
}
