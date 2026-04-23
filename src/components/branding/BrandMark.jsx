import React from "react";
import { cn } from "@/lib/utils";

export default function BrandMark({ compact = false, className = "", tone = "gold" }) {
  const toneClass =
    tone === "light"
      ? "text-white drop-shadow-[0_8px_18px_rgba(255,255,255,0.2)]"
      : "brand-wordmark";

  return (
    <div className={cn("inline-flex items-center", className)}>
      <span
        className={cn(
          "font-sans font-bold uppercase leading-none tracking-[0.14em]",
          compact ? "text-[1.02rem]" : "text-[1.38rem]",
          toneClass,
        )}
      >
        YUVEMA
      </span>
    </div>
  );
}
