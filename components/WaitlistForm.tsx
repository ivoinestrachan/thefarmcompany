"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const inputCls =
  "w-full rounded-md border hairline bg-char3 px-4 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-faint focus:border-paper/40";
const labelCls =
  "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-faint";

const EMPTY = { name: "", farm: "", location: "", email: "", site: "" };

export default function WaitlistForm() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = () => {
    setOpen(false);
    if (status !== "success") setStatus("idle");
  };

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

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const firstName = form.name.trim().split(/\s+/)[0];

  return (
    <>
      {/* trigger — a single button that opens the full form */}
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-signal px-7 py-3.5 text-[15px] font-500 text-ink transition-opacity hover:opacity-90"
        >
          Talk to us
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="menu-panel relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border hairline bg-char2 p-7 text-left sm:p-8"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 text-lg leading-none text-faint transition-colors hover:text-paper"
            >
              ✕
            </button>

            {status === "success" ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border hairline text-paper">
                  ✓
                </div>
                <h3 className="display text-2xl text-paper">You&rsquo;re on the list.</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-fog">
                  Thanks{firstName ? `, ${firstName}` : ""} — you&rsquo;re on the
                  list. We&rsquo;ll reach out as we map fields for the 2026 season.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 font-mono text-[13px] text-fog underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="display text-2xl text-paper sm:text-3xl">
                  Put the bugs to work.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fog">
                  Tell us a little about your farm and we&rsquo;ll map your first
                  field.
                </p>
                <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                  <div>
                    <label htmlFor="w-name" className={labelCls}>
                      Name
                    </label>
                    <input
                      id="w-name"
                      required
                      autoFocus
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Jane Doe"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="w-farm" className={labelCls}>
                      Farm name
                    </label>
                    <input
                      id="w-farm"
                      required
                      value={form.farm}
                      onChange={set("farm")}
                      placeholder="Green Acres"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="w-location" className={labelCls}>
                      Location
                    </label>
                    <input
                      id="w-location"
                      required
                      value={form.location}
                      onChange={set("location")}
                      placeholder="Lexington, KY"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="w-email" className={labelCls}>
                      Email
                    </label>
                    <input
                      id="w-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@farm.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="w-site" className={labelCls}>
                      Website{" "}
                      <span className="normal-case text-faint/60">(optional)</span>
                    </label>
                    <input
                      id="w-site"
                      type="text"
                      inputMode="url"
                      value={form.site}
                      onChange={set("site")}
                      placeholder="greenacres.com"
                      className={inputCls}
                    />
                  </div>

                  {status === "error" && (
                    <p role="alert" className="text-[13px] text-[#dd7a63]">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-signal px-6 py-3 text-sm font-500 text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {status === "loading" ? "Sending…" : "Submit"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
