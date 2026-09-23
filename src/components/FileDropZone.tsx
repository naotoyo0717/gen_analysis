import { useCallback, useRef, useState } from "react";
import { loadRecordsFromFiles } from "../utils/loadRecords";
import type { LogRecord } from "../types";

interface Props {
  onLoad: (records: LogRecord[]) => void;
}

export function FileDropZone({ onLoad }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const { records, fileResults } = await loadRecordsFromFiles(files);
      onLoad(records);
      const summary = fileResults
        .map((f) => `${f.name}: ${f.count}件${f.error ? ` (${f.error})` : ""}`)
        .join(" / ");
      setStatus(summary);
    },
    [onLoad],
  );

  return (
    <div
      className={`drop-zone${isDragOver ? " drop-zone--active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <p>
        JSONログファイルをドラッグ&ドロップ、またはクリックして選択（複数選択可）
      </p>
      {status && <p className="drop-zone__status">{status}</p>}
    </div>
  );
}
