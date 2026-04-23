import React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function TwoGisMap() {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-[1.65rem] border border-[#EADFD2] bg-[#F7F1EA]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_28%),linear-gradient(160deg,rgba(252,248,243,0.96),rgba(242,233,222,0.95))]" />

      <svg
        viewBox="0 0 900 620"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="900" height="620" fill="#F4EDE4" />
        <rect x="46" y="58" width="250" height="146" rx="22" fill="#EEE4D8" />
        <rect x="322" y="70" width="160" height="102" rx="18" fill="#EFE7DC" />
        <rect x="530" y="44" width="288" height="166" rx="24" fill="#ECE2D6" />
        <rect x="88" y="258" width="194" height="118" rx="18" fill="#EFE7DB" />
        <rect x="324" y="246" width="212" height="152" rx="22" fill="#EEE4D8" />
        <rect x="584" y="268" width="190" height="132" rx="18" fill="#F1E8DC" />
        <rect x="140" y="446" width="230" height="112" rx="24" fill="#EFE5D8" />
        <rect x="456" y="446" width="248" height="100" rx="20" fill="#EFE5D8" />

        <path
          d="M-30 310 H980"
          stroke="#FFFDF9"
          strokeWidth="52"
          strokeLinecap="round"
        />
        <path
          d="M340 -20 V700"
          stroke="#FFFDF9"
          strokeWidth="42"
          strokeLinecap="round"
        />
        <path
          d="M690 -20 V700"
          stroke="#FFFDF9"
          strokeWidth="34"
          strokeLinecap="round"
        />
        <path
          d="M90 110 H860"
          stroke="#FFF8F2"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M148 540 H800"
          stroke="#FFF8F2"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M130 470 C 250 420 330 384 430 290"
          stroke="#F8F2EB"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.28))]" />

      <div className="absolute right-5 top-5 rounded-full border border-white/85 bg-white/88 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#7B6653] shadow-soft">
        2GIS
      </div>

      <div className="absolute left-[52%] top-[46%]">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white bg-[#F6E6D2] shadow-[0_12px_26px_rgba(156,123,102,0.2)]">
          <MapPin className="h-3.5 w-3.5 text-[#A07748]" strokeWidth={1.8} />
          <span className="absolute -bottom-7 left-1/2 h-5 w-px -translate-x-1/2 bg-[#D8B386]" />
        </div>
      </div>

      <div className="absolute left-5 top-5 max-w-[15rem] rounded-[1.35rem] border border-white/85 bg-white/90 px-4 py-3 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Адрес</p>
        <p className="mt-2 text-sm leading-relaxed text-stone/80">{siteConfig.location}</p>
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-[1.55rem] border border-white/85 bg-white/92 px-5 py-4 shadow-soft-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              YUVEMA
            </p>
            <p className="mt-2 font-serif text-[1.5rem] leading-none text-stone">
              Караганда
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone/76">
              Проспект Нуркена Абдирова, 15
            </p>
          </div>

          <a
            href={siteConfig.twoGisLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#DFC4A2] bg-[#F7EBDD] px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#664F39] shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F2E2CE]"
          >
            Открыть в 2GIS
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
