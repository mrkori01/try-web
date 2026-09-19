import { unzipSync } from "fflate";

export interface ExtractedEntry {
  /** Posix path relative to the web-app root (no leading slash). */
  rel: string;
  data: Buffer;
}

/**
 * Extracts a .zip web-app bundle in memory.
 *
 * - Guarantees an index.html exists at the root after extraction.
 * - If the zip wraps everything in a single top-level folder
 *   (e.g. `my-game/index.html`), that folder is stripped automatically.
 * - Rejects path-traversal entries and macOS junk.
 * - Throws Error with a user-friendly message on problems.
 */
export function extractZipToEntries(zip: Uint8Array): ExtractedEntry[] {
  let map: Record<string, Uint8Array>;
  try {
    map = unzipSync(zip);
  } catch {
    throw new Error("That file doesn't look like a valid .zip archive.");
  }

  const entries = Object.entries(map)
    .map(([raw, data]) => ({
      name: raw.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, ""),
      data,
    }))
    .filter(
      ({ name }) =>
        name &&
        !name.endsWith("/") &&
        !name.split("/").some((seg) => seg === ".." || seg === "") &&
        !name.startsWith("__MACOSX/") &&
        !name.endsWith(".DS_Store")
    );

  if (entries.length === 0) throw new Error("The .zip archive is empty.");

  let prefix = "";
  if (!entries.some((e) => e.name === "index.html")) {
    const tops = new Set(entries.map((e) => e.name.split("/")[0]));
    if (tops.size === 1) {
      const top = [...tops][0];
      if (entries.some((e) => e.name === `${top}/index.html`)) prefix = `${top}/`;
    }
    if (!prefix)
      throw new Error(
        'The .zip must contain an "index.html" at its root (or inside a single top-level folder).'
      );
  }

  return entries
    .filter((e) => e.name.startsWith(prefix) && e.name !== prefix)
    .map((e) => ({ rel: e.name.slice(prefix.length), data: Buffer.from(e.data) }));
}
