import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[12px] font-medium whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-aurora text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-10px_rgba(124,92,255,0.8)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_40px_-8px_rgba(255,92,170,0.7)] hover:-translate-y-px active:translate-y-0",
  secondary: "glass text-foreground hover:bg-white/10 hover:border-white/20",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

function Shimmer({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-20 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover/btn:opacity-100 group-hover/btn:[animation:sweep_0.9s_ease-out]"
    />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function GradientButton({ variant = "primary", size = "md", className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      <Shimmer show={variant === "primary"} />
      {children}
    </button>
  );
}

interface LinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function GradientLink({ href, variant = "primary", size = "md", className, children }: LinkProps) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      <Shimmer show={variant === "primary"} />
      {children}
    </Link>
  );
}
