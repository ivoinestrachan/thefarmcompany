"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "The Herd", href: "#herd" },
  { label: "Soil", href: "#soil" },
  { label: "Dashboard", href: "#dashboard" },
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b hairline bg-paper/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <a href="#top" className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[15px] font-500 tracking-tight">
            The Farming Company
          </span>
        </a>

        <div className="hidden items-center gap-10 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-ink/60 transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <a
            href="#dashboard"
            className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-85"
          >
            Chat w us
          </a>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center md:hidden"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-px w-5 bg-ink transition-transform ${
                open ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-5 bg-ink transition-transform ${
                open ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      {open && (
        <div className="border-t hairline bg-paper/95 px-6 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-ink/70"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-ink px-4 py-2.5 text-center text-sm font-medium text-paper"
            >
              Chat w us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" className="stroke-ink" strokeWidth="1.2" />
      <path
        d="M12 18c0-3 0-5 0-7m0 0c0-1.6 1.3-3 3-3 0 1.6-1.3 3-3 3Zm0 0c0-1.6-1.3-3-3-3 0 1.6 1.3 3 3 3Z"
        className="stroke-ink"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
