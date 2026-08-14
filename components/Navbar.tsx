"use client";

import { useEffect, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Header — anime.js-style lab bar: a lowercase wordmark with a living tick,   */
/*  an inline monospace nav, and a solid-signal CTA. Collapses to a full-screen */
/*  overlay on small screens.                                                   */
/* -------------------------------------------------------------------------- */

const LINKS: { label: string; href: string }[] = [];

const SOCIALS: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: "X", href: "#", icon: <IconX /> },
  { label: "Instagram", href: "#", icon: <IconInstagram /> },
  { label: "LinkedIn", href: "#", icon: <IconLinkedIn /> },
  { label: "YouTube", href: "#", icon: <IconYouTube /> },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled && !open
            ? "border-b hairline bg-char/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a
            href="#top"
            aria-label="The Farming Company — home"
            className="text-paper"
          >
            <span className="display text-xl font-700 tracking-tight">
              thefarmcompany
            </span>
          </a>

          {/* desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-[13px] text-fog transition-colors hover:text-paper"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              className="rounded-md bg-signal px-4 py-2 font-mono text-[13px] font-700 text-ink transition-opacity hover:opacity-90"
            >
              Talk to us
            </a>
          </div>

          {/* mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="group flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper md:hidden"
          >
            <span>{open ? "Close" : "Menu"}</span>
            <span className="relative flex h-4 w-6 flex-col justify-between">
              <span
                className={`block h-[2px] w-full origin-center rounded-full bg-current transition-transform duration-300 ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-full rounded-full bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-[2px] w-full origin-center rounded-full bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="menu-panel grid-dot absolute inset-0 overflow-y-auto bg-char">
            <div className="mx-auto flex min-h-full max-w-7xl flex-col px-6 pb-16 pt-32">
              <nav className="flex flex-col">
                {[...LINKS, { label: "Talk to Us", href: "#contact" }].map(
                  (l, i) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      data-active={i === 0 ? "true" : "false"}
                      style={{ ["--i" as string]: i }}
                      className="menu-item menu-link display py-2.5 text-[11vw] font-700 leading-[1.05] tracking-tight sm:text-5xl"
                    >
                      {l.label}
                    </a>
                  )
                )}
              </nav>

              <div
                className="menu-item mt-12 max-w-3xl border-t hairline pt-8"
                style={{ ["--i" as string]: LINKS.length + 1 }}
              >
                <div className="flex items-center gap-7 text-fog">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="transition-colors hover:text-signal"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* --- icons --------------------------------------------------------------- */

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconLinkedIn() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.05 3.76-2.05C21.6 8.59 22 11.2 22 14.3V21h-4v-5.9c0-1.4-.02-3.2-1.95-3.2-1.96 0-2.25 1.53-2.25 3.1V21h-4V9Z" />
    </svg>
  );
}
function IconYouTube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23 12s0-3.2-.41-4.74a2.5 2.5 0 0 0-1.76-1.77C19.29 5.08 12 5.08 12 5.08s-7.29 0-8.83.41a2.5 2.5 0 0 0-1.76 1.77C1 8.8 1 12 1 12s0 3.2.41 4.74a2.5 2.5 0 0 0 1.76 1.77c1.54.41 8.83.41 8.83.41s7.29 0 8.83-.41a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12Zm-13 3.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}
