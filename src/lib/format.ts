export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 10000) return `${(value / 1000).toFixed(1)}千`;
  if (value < 100000000) return `${(value / 10000).toFixed(1)}万`;
  return `${(value / 100000000).toFixed(1)}亿`;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
