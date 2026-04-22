import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const reveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

export default function PageHero({
  eyebrow,
  title,
  description,
  children,
  className = "",
  align = "left",
}) {
  return (
    <section className={cn("border-b border-[#EEE2D6] bg-marble-light py-20 md:py-24", className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <motion.div
          {...reveal}
          className={cn(
            "max-w-3xl",
            align === "center" ? "mx-auto text-center" : "",
          )}
        >
          {eyebrow && (
            <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="page-heading">{title}</h1>
          {description && (
            <p className="mt-5 max-w-2xl text-sm leading-8 text-stone/75 md:text-[15px]">
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}
