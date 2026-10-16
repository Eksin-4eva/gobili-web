import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        className={cn("size-9 rounded-full object-cover bg-muted", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {(alt ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}
