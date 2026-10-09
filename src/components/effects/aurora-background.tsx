import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Override the three blob colors (e.g. a creator's palette). */
  colors?: [string, string, string];
  intensity?: number;
}

export function AuroraBackground({ className, colors = ["#7C5CFF", "#FF5CAA", "#FFB45C"], intensity = 0.35 }: Props) {
  const blob = "absolute rounded-full blur-[110px] will-change-transform";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="dot-grid absolute inset-0"
        style={{ maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)" }}
      />
      <div
        className={cn(blob, "-top-[20%] left-[5%] h-[55%] w-[45%]")}
        style={{ background: colors[0], opacity: intensity, animation: "aurora-drift-1 24s ease-in-out infinite" }}
      />
      <div
        className={cn(blob, "top-[5%] right-[0%] h-[50%] w-[40%]")}
        style={{ background: colors[1], opacity: intensity * 0.8, animation: "aurora-drift-2 28s ease-in-out infinite" }}
      />
      <div
        className={cn(blob, "top-[35%] left-[35%] h-[40%] w-[35%]")}
        style={{ background: colors[2], opacity: intensity * 0.55, animation: "aurora-drift-3 22s ease-in-out infinite" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
