import type { Annotation, JudgeStatus, LogRecord } from "../types";
import { judgeStatus } from "../types";
import { effectiveHacked } from "./stats";
import { textMatchesQuery } from "./highlight";

export interface FilterState {
  search: string;
  sampleIds: string; // カンマ・空白区切りの sample_id（完全一致）

  conditions: Set<string>;
  domains: Set<string>;
  attackTypes: Set<string>;
  attackNames: Set<string>;
  judgeStatuses: Set<JudgeStatus>;
}

export function initialFilterState(): FilterState {
  return {
    search: "",
    sampleIds: "",
    conditions: new Set(),
    domains: new Set(),
    attackTypes: new Set(),
    attackNames: new Set(),
    judgeStatuses: new Set(),
  };
}

export function isFilterActive(state: FilterState): boolean {
  return (
    state.search.trim() !== "" ||
    parseSampleIds(state.sampleIds).size > 0 ||
    state.conditions.size > 0 ||
    state.domains.size > 0 ||
    state.attackTypes.size > 0 ||
    state.attackNames.size > 0 ||
    state.judgeStatuses.size > 0
  );
}

// "12, 15 30" → {12, 15, 30}。数値でないものは無視する
export function parseSampleIds(input: string): Set<number> {
  const ids = new Set<number>();
  for (const token of input.split(/[\s,、]+/)) {
    if (/^\d+$/.test(token)) ids.add(Number(token));
  }
  return ids;
}

const SEARCH_FIELDS: (keyof LogRecord)[] = ["instruction", "poisoned_input", "response", "attack_str", "attack_name"];

function matchesSearch(record: LogRecord, query: string): boolean {
  if (!query.trim()) return true;
  return SEARCH_FIELDS.some((field) => {
    const v = record[field];
    return typeof v === "string" && textMatchesQuery(v, query);
  });
}

export function matchesFilter(
  record: LogRecord,
  state: FilterState,
  annotations: Map<string, Annotation>,
): boolean {
  const sampleIds = parseSampleIds(state.sampleIds);
  if (sampleIds.size > 0 && !sampleIds.has(record.sample_id)) return false;
  if (state.conditions.size > 0 && !state.conditions.has(record.condition)) return false;
  if (state.domains.size > 0 && !state.domains.has(record.domain)) return false;
  if (state.attackTypes.size > 0 && !state.attackTypes.has(record.attack_type)) return false;
  if (state.attackNames.size > 0 && !state.attackNames.has(record.attack_name)) return false;
  if (state.judgeStatuses.size > 0) {
    const status = judgeStatus(effectiveHacked(record, annotations));
    if (!state.judgeStatuses.has(status)) return false;
  }
  if (!matchesSearch(record, state.search)) return false;
  return true;
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
