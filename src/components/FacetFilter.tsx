import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  searchable?: boolean;
}

export function FacetFilter({ label, options, selected, onChange, searchable }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(next);
  };

  const filteredOptions = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="facet-filter" ref={rootRef}>
      <button
        type="button"
        className={`facet-filter__trigger${selected.size > 0 ? " facet-filter__trigger--active" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        {selected.size > 0 ? ` (${selected.size})` : ""}
      </button>
      {open && (
        <div className="facet-filter__panel">
          {searchable && options.length > 8 && (
            <input
              className="facet-filter__search"
              placeholder="絞り込み..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          )}
          <div className="facet-filter__list">
            {filteredOptions.length === 0 && <div className="facet-filter__empty">該当なし</div>}
            {filteredOptions.map((opt) => (
              <label key={opt} className="facet-filter__option">
                <input type="checkbox" checked={selected.has(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {selected.size > 0 && (
            <button type="button" className="facet-filter__clear" onClick={() => onChange(new Set())}>
              クリア
            </button>
          )}
        </div>
      )}
    </div>
  );
}
