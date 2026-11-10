"use client";

import { useEffect, useState } from "react";

export type TourStep = {
  sel: string;
  t: string;
  x: string;
};

export const TOUR_SEEN_KEY = "intel_chiplet_market_signals_tour_seen";

export const TOUR_STEPS: TourStep[] = [
  {
    sel: "#tour-brand",
    t: "Intel Chiplet Market Signals",
    x: "An evidence-led market intelligence system designed for Intel Foundry. It identifies custom-silicon initiatives across 12 prospect companies and tracks 7 global competitors.",
  },
  {
    sel: "#tour-nav",
    t: "Navigation & Modules",
    x: "Easily switch between Emerging Demand (Module 1), Competitive Radar (Module 2: TSMC, Samsung, Broadcom, etc.), and Where the data comes from directly in the top navbar.",
  },
  {
    sel: "#tourBtn",
    t: "Take a Tour (Replay Anytime)",
    x: "You can click this button at any time to replay this guided spotlight walkthrough across the dashboard.",
  },
  {
    sel: "#tour-verified",
    t: "Strict 'Publish Rule'",
    x: "Zero information comes from AI memory. Every record on screen has an attributable source URL, a date in the 12-month window, and a verbatim sentence matching the source text word-for-word.",
  },
  {
    sel: "#tour-company-chips",
    t: "Shortlist Company Filter",
    x: "The research brief shortlists 5 key companies: Cerebras, AWS, Meta, Microsoft, and Tesla. Click any company chip to focus all tabs and metrics exclusively on that player.",
  },
  {
    sel: "#tour-tabs",
    t: "Intelligence Dimensions",
    x: "Switch between Overview charts, Developments, Silicon Hiring by role, Partners & suppliers, Intel ties, SEC filings, Scoring & shortlist, and All sources.",
  },
  {
    sel: "#tour-summary-tiles",
    t: "Market Signals Lake",
    x: "Live counts of verified market signals, silicon engineering job postings, supply chain relationships, and regulatory filings.",
  },
  {
    sel: "#tour-ask-btn",
    t: "Ask Intelligence",
    x: "Ask questions in plain language (e.g. 'Who packages Cerebras chips?'). Answers are grounded strictly in stored records and cite their sources.",
  },
];

let tourI = -1;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function tourEnd() {
  tourI = -1;
  document.getElementById("tourRing")?.remove();
  document.getElementById("tourPop")?.remove();
}

export function tourStart(idx = 0) {
  tourI = idx;
  tourShow();
}

export function tourShow() {
  const st = TOUR_STEPS[tourI];
  if (!st) {
    tourEnd();
    return;
  }

  let el = document.querySelector(st.sel) as HTMLElement | null;
  if (!el) {
    // If element is not on the current view, skip to next step
    if (tourI < TOUR_STEPS.length - 1) {
      tourI++;
      tourShow();
      return;
    }
    tourEnd();
    return;
  }

  const tall = el.offsetHeight > window.innerHeight * 0.6;
  el.scrollIntoView({ block: tall ? "start" : "center", behavior: "instant" });

  let ring = document.getElementById("tourRing");
  let pop = document.getElementById("tourPop");

  if (!ring) {
    ring = document.createElement("div");
    ring.id = "tourRing";
    document.body.appendChild(ring);
  }

  if (!pop) {
    pop = document.createElement("div");
    pop.id = "tourPop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Dashboard tour");
    document.body.appendChild(pop);
  }

  const r = el.getBoundingClientRect();
  const pad = 6;
  const top = Math.max(r.top, 4);
  const bottom = Math.min(r.bottom, window.innerHeight - 4);

  Object.assign(ring.style, {
    left: `${r.left - pad}px`,
    top: `${top - pad}px`,
    width: `${r.width + pad * 2}px`,
    height: `${Math.max(24, bottom - top) + pad * 2}px`,
  });

  const last = tourI === TOUR_STEPS.length - 1;
  pop.innerHTML = `
    <h4>${escapeHtml(st.t)}</h4>
    <p>${escapeHtml(st.x)}</p>
    <div class="tbar">
      <span class="n">${tourI + 1} / ${TOUR_STEPS.length}</span>
      <button type="button" data-t="end">${last ? "Close" : "Skip"}</button>
      ${tourI > 0 ? '<button type="button" data-t="back">Back</button>' : ""}
      ${!last ? '<button type="button" class="primary" data-t="next">Next</button>' : '<button type="button" class="primary" data-t="end">Done</button>'}
    </div>
  `;

  const pw = pop.offsetWidth || 340;
  const ph = pop.offsetHeight || 160;
  let left = r.right + 16;
  let ptop = top;

  if (left + pw > window.innerWidth - 8) {
    left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left));
    ptop = bottom + 14 + ph < window.innerHeight ? bottom + 14 : Math.max(8, top - ph - 14);
  }
  if (ptop + ph > window.innerHeight - 8) {
    ptop = Math.max(8, window.innerHeight - ph - 8);
  }

  pop.style.left = `${left}px`;
  pop.style.top = `${Math.max(8, ptop)}px`;

  const nextBtn = (pop.querySelector('[data-t="next"]') || pop.querySelector('[data-t="end"]')) as HTMLElement | null;
  nextBtn?.focus();
}

/**
 * Client component that manages tour lifecycle, global events, and auto-start on first render.
 */
export function AppTour() {
  useEffect(() => {
    // 1. Automatically trigger the tour after UI renders on the browser (no click required)
    let autoTimer: ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== "undefined" && !window.location.search.includes("tour=0")) {
      autoTimer = setTimeout(() => {
        tourStart(0);
      }, 450);
    }

    // 2. Global click delegation for tour popover controls and tour buttons
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Handle click on any Take a Tour button
      if (target.closest("#tourBtn, .tour-trigger")) {
        e.preventDefault();
        tourStart(0);
        return;
      }

      // Handle clicks inside the tour popover
      const popBtn = target.closest("#tourPop [data-t]") as HTMLElement | null;
      if (popBtn) {
        e.preventDefault();
        const action = popBtn.dataset.t;
        if (action === "end") {
          tourEnd();
        } else if (action === "next") {
          if (tourI < TOUR_STEPS.length - 1) {
            tourI++;
            tourShow();
          } else {
            tourEnd();
          }
        } else if (action === "back") {
          if (tourI > 0) {
            tourI--;
            tourShow();
          }
        }
      }
    };

    // 3. Keyboard navigation: ArrowRight (Next), ArrowLeft (Back), Escape (Close)
    const onKey = (e: KeyboardEvent) => {
      if (tourI < 0) return;
      if (e.key === "Escape") {
        tourEnd();
      } else if (e.key === "ArrowRight") {
        if (tourI < TOUR_STEPS.length - 1) {
          tourI++;
          tourShow();
        } else {
          tourEnd();
        }
      } else if (e.key === "ArrowLeft") {
        if (tourI > 0) {
          tourI--;
          tourShow();
        }
      }
    };

    // 4. Update ring and popover on resize or scroll
    const onPositionUpdate = () => {
      if (tourI >= 0) {
        tourShow();
      }
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onPositionUpdate);
    window.addEventListener("scroll", onPositionUpdate, { passive: true });

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onPositionUpdate);
      window.removeEventListener("scroll", onPositionUpdate);
      tourEnd();
    };
  }, []);

  return null;
}

/**
 * Prominent Welcome Callout Banner on the dashboard.
 * Gives users an unmistakable, clear entry point to the guided tour.
 */
export function TourBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem("intel_chiplet_tour_banner_dismissed");
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {}
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem("intel_chiplet_tour_banner_dismissed", "1");
    } catch {}
  }

  function handleStart() {
    tourStart(0);
  }

  if (dismissed) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft/60 p-3.5 shadow-xs transition animate-in fade-in">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-xs">
          <CompassIcon />
        </span>
        <div>
          <span className="text-xs font-semibold text-foreground sm:text-sm">
            New to Intel Chiplet Market Signals? Take an interactive tour
          </span>
          <span className="block text-xs text-muted">
            A quick 1-minute walkthrough explaining verified proof, silicon engineering hiring, and scoring.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleStart}
          className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 cursor-pointer transition"
        >
          Start Guided Tour →
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1.5 text-xs text-muted hover:bg-accent-soft hover:text-foreground cursor-pointer"
          title="Dismiss"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Take a Tour launcher button with id="tourBtn".
 */
export function TourButton({ className = "" }: { className?: string }) {
  return (
    <button
      id="tourBtn"
      type="button"
      onClick={() => tourStart(0)}
      className={`group flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft/60 px-3 py-1.5 text-xs font-semibold text-accent shadow-xs transition hover:bg-accent hover:text-white cursor-pointer ${className}`}
      title="Take an interactive walk through this platform"
    >
      <CompassIcon />
      <span>Take a Tour</span>
    </button>
  );
}

function CompassIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-accent transition-transform group-hover:rotate-45"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
