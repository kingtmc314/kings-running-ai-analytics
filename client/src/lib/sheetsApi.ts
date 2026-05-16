// =============================================================
// King's Running AI Analytics — Google Sheets Write API
// Provides updateRow and deleteRow via the Apps Script endpoint
// =============================================================

import { GOOGLE_SCRIPT_URL } from "./runningData";

function getExecUrl(): string {
  let url = GOOGLE_SCRIPT_URL.trim();
  if (!url.endsWith("/exec")) url = `${url}/exec`;
  return url;
}

export interface SheetWriteResult {
  success: boolean;
  error?: string;
}

/**
 * Update a specific row in a Google Sheet.
 * @param sheet  Sheet name (e.g. "Running Log")
 * @param row    1-based row number (_row field on the record)
 * @param data   Key-value pairs matching the sheet column headers
 */
export async function updateRow(
  sheet: string,
  row: number,
  data: Record<string, unknown>
): Promise<SheetWriteResult> {
  try {
    const url = getExecUrl();
    const body = JSON.stringify({ action: "update", sheet, row, data });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (json.status === "success" || json.result === "success") return { success: true };
    // Some Apps Script deployments return 200 with error in body
    if (json.error) return { success: false, error: String(json.error) };
    return { success: true }; // Assume success if no explicit error
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Append a new row to a Google Sheet.
 * @param sheet  Sheet name (e.g. "Running Log")
 * @param data   Key-value pairs matching the sheet column headers
 */
export async function addRow(
  sheet: string,
  data: Record<string, unknown>
): Promise<SheetWriteResult> {
  try {
    const url = getExecUrl();
    const body = JSON.stringify({ action: "add", sheet, data });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (json.status === "success" || json.result === "success") return { success: true };
    if (json.error) return { success: false, error: String(json.error) };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Delete a specific row from a Google Sheet.
 * @param sheet  Sheet name
 * @param row    1-based row number (_row field on the record)
 */
export async function deleteRow(
  sheet: string,
  row: number
): Promise<SheetWriteResult> {
  try {
    const url = getExecUrl();
    const body = JSON.stringify({ action: "delete", sheet, row });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (json.status === "success" || json.result === "success") return { success: true };
    if (json.error) return { success: false, error: String(json.error) };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
