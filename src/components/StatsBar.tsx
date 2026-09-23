import { useRef } from "react";
import type { Stats } from "../utils/stats";
import { formatPercent } from "../utils/stats";
import { exportAnnotations, importAnnotations } from "../utils/exportImport";

interface Props {
  stats: Stats;
}

export function StatsBar({ stats }: Props) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="stats-bar">
      <div className="stats-bar__metrics">
        <div className="stats-bar__metric">
          <span className="stats-bar__metric-label">件数</span>
          <span className="stats-bar__metric-value">{stats.total}</span>
        </div>
        <div className="stats-bar__metric">
          <span className="stats-bar__metric-label">判定済み</span>
          <span className="stats-bar__metric-value">{stats.judged}</span>
        </div>
        <div className="stats-bar__metric">
          <span className="stats-bar__metric-label">ASR</span>
          <span className="stats-bar__metric-value">
            {formatPercent(stats.asr)}
            <span className="stats-bar__metric-sub">
              ({stats.hackedCount}/{stats.judged})
            </span>
          </span>
        </div>
        <div className="stats-bar__metric">
          <span className="stats-bar__metric-label">補正後ASR</span>
          <span className="stats-bar__metric-value">
            {formatPercent(stats.correctedAsr)}
            <span className="stats-bar__metric-sub">
              ({stats.correctedHackedCount}/{stats.correctedJudged})
            </span>
          </span>
        </div>
      </div>
      <div className="stats-bar__actions">
        <button type="button" onClick={() => exportAnnotations()}>
          アノテーションをエクスポート
        </button>
        <button type="button" onClick={() => importInputRef.current?.click()}>
          アノテーションをインポート
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const { imported, skipped } = await importAnnotations(file);
              alert(`インポート完了: ${imported}件（スキップ: ${skipped}件）`);
            } catch (err) {
              alert(`インポート失敗: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
              e.target.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
