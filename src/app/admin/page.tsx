import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAdmin, isDefaultPassword } from "@/lib/auth";
import { readDB } from "@/lib/db";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = readDB();
  return (
    <Dashboard
      initial={{
        apps: db.apps,
        keys: db.keys,
        settings: db.settings,
        totalDownloads: db.events.length,
      }}
      showDefaultPasswordWarning={isDefaultPassword()}
    />
  );
}
