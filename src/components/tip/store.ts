export type TipType = "success" | "error" | "warning" | "info";

export interface TipItem {
  id: number;
  message: string;
  type: TipType;
  time: number;
}

type TipListener = (tip: TipItem) => void;

const listeners = new Set<TipListener>();
const pending: TipItem[] = [];
let nextId = 1;

export function showTip(message: string, type: TipType = "info", time = 2400): number {
  const tip: TipItem = { id: nextId++, message, type, time };
  if (listeners.size === 0) {
    pending.push(tip);
    return tip.id;
  }
  listeners.forEach((listener) => listener(tip));
  return tip.id;
}

export function subscribeTip(listener: TipListener): () => void {
  listeners.add(listener);
  pending.splice(0).forEach(listener);
  return () => {
    listeners.delete(listener);
  };
}
