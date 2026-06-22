import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  align?: "center" | "left";
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  align = "center",
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-borgogna leading-tight",
          titleClassName
        )}
      >
        {title}
      </h2>
    </div>
  );
}
