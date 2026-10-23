import { useEffect, useState } from "react";

interface Props {
  text: string;
}

export function CopyButton({ text }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 1500);
    return () => clearTimeout(timer);
  }, [state]);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("error");
    }
  };

  return (
    <button type="button" className={`copy-button copy-button--${state}`} onClick={handleClick}>
      {state === "copied" ? "コピーしました" : state === "error" ? "コピー失敗" : "コピー"}
    </button>
  );
}
