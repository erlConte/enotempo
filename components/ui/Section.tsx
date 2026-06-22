import { cn } from "@/lib/utils";

type SectionBg = "bianco-caldo" | "crema" | "borgogna";
type SectionPy = "sm" | "md" | "lg";

interface SectionProps {
  children: React.ReactNode;
  bg?: SectionBg;
  py?: SectionPy;
  className?: string;
  id?: string;
}

const bgMap: Record<SectionBg, string> = {
  "bianco-caldo": "bg-bianco-caldo",
  crema: "bg-[#f3ece1]",
  borgogna: "bg-borgogna",
};

const pyMap: Record<SectionPy, string> = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-24 md:py-32",
};

export function Section({ children, bg = "bianco-caldo", py = "md", className, id }: SectionProps) {
  return (
    <section id={id} className={cn(bgMap[bg], pyMap[py], "px-4", className)}>
      <div className="container mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
