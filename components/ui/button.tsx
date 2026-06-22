import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // ── shadcn defaults (kept for backward compat) ──────────────────────
        default: "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
        link: "rounded-md text-primary underline-offset-4 hover:underline",
        // ── Enotempo brand variants (angoli 2px, mai pillole) ────────────────
        // Su sfondo scuro (borgogna): bottone crema
        cream: "rounded-[2px] bg-crema text-borgogna border border-crema/60 hover:bg-crema/90",
        // Azione primaria su sfondo chiaro: verde oliva
        olive: "rounded-[2px] bg-verde text-bianco-caldo hover:bg-verde/90",
        // Contorno borgogna su sfondo chiaro
        "outline-borgogna": "rounded-[2px] border-2 border-borgogna bg-transparent text-borgogna hover:bg-borgogna/5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
