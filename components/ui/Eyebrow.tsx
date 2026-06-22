import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-[12px] font-semibold uppercase tracking-[.22em] text-verde",
        className
      )}
    >
      {children}
    </p>
  );
}
