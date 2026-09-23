import { db } from "../db";
import type { Annotation } from "../types";

export async function exportAnnotations(): Promise<void> {
  const all = await db.annotations.toArray();
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `bipia_annotations_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isAnnotation(v: unknown): v is Annotation {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.key === "string" &&
    typeof r.sample_id === "number" &&
    typeof r.attack_name === "string" &&
    typeof r.condition === "string"
  );
}

export async function importAnnotations(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new Error("アノテーションファイルの形式が不正です（配列である必要があります）");
  }
  const valid = data.filter(isAnnotation);
  if (valid.length > 0) {
    await db.annotations.bulkPut(valid);
  }
  return { imported: valid.length, skipped: data.length - valid.length };
}
