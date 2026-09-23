import { useMemo, useState } from "react";
import "./App.css";
import { FileDropZone } from "./components/FileDropZone";
import { FilterBar } from "./components/FilterBar";
import { RecordList } from "./components/RecordList";
import { DetailPanel } from "./components/DetailPanel";
import { StatsBar } from "./components/StatsBar";
import type { LogRecord } from "./types";
import { recordKey } from "./types";
import { initialFilterState, isFilterActive, matchesFilter, uniqueSorted } from "./utils/filter";
import { computeStats } from "./utils/stats";
import { useAnnotationsMap, upsertAnnotation } from "./hooks/useAnnotations";

function App() {
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [filterState, setFilterState] = useState(initialFilterState());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const annotations = useAnnotationsMap();

  const handleLoad = (newRecords: LogRecord[]) => {
    setRecords((prev) => {
      const merged = new Map(prev.map((r) => [recordKey(r), r]));
      for (const r of newRecords) merged.set(recordKey(r), r);
      return Array.from(merged.values());
    });
  };

  const conditions = useMemo(() => uniqueSorted(records.map((r) => r.condition)), [records]);
  const domains = useMemo(() => uniqueSorted(records.map((r) => r.domain)), [records]);
  const attackTypes = useMemo(() => uniqueSorted(records.map((r) => r.attack_type)), [records]);
  const attackNames = useMemo(() => uniqueSorted(records.map((r) => r.attack_name)), [records]);

  const filteredRecords = useMemo(
    () => records.filter((r) => matchesFilter(r, filterState, annotations)),
    [records, filterState, annotations],
  );

  const stats = useMemo(() => computeStats(filteredRecords, annotations), [filteredRecords, annotations]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((r) => recordKey(r) === selectedKey) ?? records.find((r) => recordKey(r) === selectedKey) ?? null,
    [filteredRecords, records, selectedKey],
  );
  const selectedAnnotation = selectedKey ? annotations.get(selectedKey) : undefined;

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">BIPIA攻撃ログビューア</h1>
        <FileDropZone onLoad={handleLoad} />
      </header>

      {records.length === 0 ? (
        <div className="app__placeholder">
          <p>JSONログファイルを読み込むとここに一覧が表示されます。</p>
        </div>
      ) : (
        <>
          <StatsBar stats={stats} />
          <FilterBar
            state={filterState}
            onChange={setFilterState}
            conditions={conditions}
            domains={domains}
            attackTypes={attackTypes}
            attackNames={attackNames}
            onClearAll={() => setFilterState(initialFilterState())}
          />
          <div className="app__body">
            <div className="app__list-pane">
              <div className="app__list-count">
                {filteredRecords.length}件表示中 {isFilterActive(filterState) ? `（全${records.length}件中）` : ""}
              </div>
              <RecordList
                records={filteredRecords}
                annotations={annotations}
                selectedKey={selectedKey}
                onSelect={(r) => setSelectedKey(recordKey(r))}
              />
            </div>
            <div className="app__detail-pane">
              <DetailPanel
                record={selectedRecord}
                annotation={selectedAnnotation}
                onAnnotationChange={(patch) => {
                  if (selectedRecord) upsertAnnotation(selectedRecord, patch);
                }}
                searchQuery={filterState.search}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
