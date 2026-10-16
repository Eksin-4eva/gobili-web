import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { showTip, subscribeTip, type TipItem, type TipType } from "@/components/tip/store";
import { AUTH_EXPIRED_EVENT, AUTH_EXPIRED_MESSAGE } from "@/lib/authError";

export function $tip(message: string, type: TipType = "info"): number {
  return showTip(message, type);
}

const typeClass: Record<TipType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
};

export default function TipProvider() {
  const [tips, setTips] = useState<TipItem[]>([]);

  useEffect(() => {
    const onExpired = () => {
      showTip(AUTH_EXPIRED_MESSAGE, "error");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    const unsubscribe = subscribeTip((tip) => {
      setTips((prev) => [...prev, tip]);
      if (tip.time > 0) {
        window.setTimeout(() => {
          setTips((prev) => prev.filter((item) => item.id !== tip.id));
        }, tip.time);
      }
    });
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
      unsubscribe();
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
      {tips.map((tip) => (
        <div
          key={tip.id}
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg",
            typeClass[tip.type],
          )}
        >
          <span className="truncate">{tip.message}</span>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setTips((prev) => prev.filter((item) => item.id !== tip.id))}
          >
            <X className="size-3.5 opacity-60" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
