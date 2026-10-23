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
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        copyWithExecCommand(text);
      }
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

// HTTP配信（非セキュアコンテキスト）では Clipboard API が使えないため、textarea + execCommand で代替する
function copyWithExecCommand(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) throw new Error("execCommand copy failed");
  } finally {
    document.body.removeChild(textarea);
  }
}
