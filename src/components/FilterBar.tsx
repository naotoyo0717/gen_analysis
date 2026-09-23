import { FacetFilter } from "./FacetFilter";
import type { FilterState } from "../utils/filter";
import type { JudgeStatus } from "../types";

interface Props {
  state: FilterState;
  onChange: (next: FilterState) => void;
  conditions: string[];
  domains: string[];
  attackTypes: string[];
  attackNames: string[];
  onClearAll: () => void;
}

const JUDGE_STATUS_OPTIONS: { value: JudgeStatus; label: string }[] = [
  { value: "hacked", label: "攻撃成功 (hacked)" },
  { value: "defended", label: "防御成功 (defended)" },
  { value: "unjudged", label: "未判定" },
];

export function FilterBar({ state, onChange, conditions, domains, attackTypes, attackNames, onClearAll }: Props) {
  return (
    <div className="filter-bar">
      <input
        className="filter-bar__search"
        type="text"
        placeholder="検索: instruction / poisoned_input / response / attack_str / attack_name"
        value={state.search}
        onChange={(e) => onChange({ ...state, search: e.target.value })}
      />
      <div className="filter-bar__facets">
        <FacetFilter
          label="Condition"
          options={conditions}
          selected={state.conditions}
          onChange={(next) => onChange({ ...state, conditions: next })}
        />
        <FacetFilter
          label="Domain"
          options={domains}
          selected={state.domains}
          onChange={(next) => onChange({ ...state, domains: next })}
        />
        <FacetFilter
          label="Attack Type"
          options={attackTypes}
          selected={state.attackTypes}
          onChange={(next) => onChange({ ...state, attackTypes: next })}
          searchable
        />
        <FacetFilter
          label="Attack Name"
          options={attackNames}
          selected={state.attackNames}
          onChange={(next) => onChange({ ...state, attackNames: next })}
          searchable
        />
        <div className="facet-filter">
          <div className="judge-filter">
            {JUDGE_STATUS_OPTIONS.map((opt) => {
              const active = state.judgeStatuses.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`judge-filter__chip judge-filter__chip--${opt.value}${active ? " judge-filter__chip--active" : ""}`}
                  onClick={() => {
                    const next = new Set(state.judgeStatuses);
                    if (next.has(opt.value)) next.delete(opt.value);
                    else next.add(opt.value);
                    onChange({ ...state, judgeStatuses: next });
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <button type="button" className="filter-bar__clear-all" onClick={onClearAll}>
          フィルタ全解除
        </button>
      </div>
    </div>
  );
}
