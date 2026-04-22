import React from "react";
import { cn } from "@/lib/utils";

export default function BrandMark({ compact = false, className = "", tone = "gold" }) {
  const toneClass =
    tone === "light"
      ? "text-white drop-shadow-[0_8px_18px_rgba(255,255,255,0.2)]"
      : "gold-shimmer";

  return (
    <div className={cn("inline-flex items-center", className)}>
      <span
        className={cn(
          "font-sans font-semibold uppercase leading-none tracking-[0.24em]",
          compact ? "text-[0.94rem]" : "text-[1.12rem]",
          toneClass,
        )}
      >
        YUVEMA
      </span>
    </div>
  );
}
