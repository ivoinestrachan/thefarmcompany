"use client";

import { useState } from "react";

type Status = "idle" | "success";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // No backend yet — capture locally and confirm. Wire to an API/service later.
    setStatus("success");
  };

  if (status === "success") {
    return (
      <p
        role="status"
        className="mx-auto mt-10 max-w-md font-mono text-[14px] leading-relaxed text-fog"
      >
        <span className="text-signal">✓ </span>Thanks — we have{" "}
        <span className="text-paper">{email}</span> and we will reach out as we
        map fields for the 2026 season.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <input
        id="waitlist-email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@farm.com"
        className="flex-1 rounded-md border hairline bg-char2 px-5 py-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-faint focus:border-signal/60"
      />
      <button
        type="submit"
        className="rounded-md bg-signal px-6 py-3 font-mono text-sm font-700 text-ink transition-opacity hover:opacity-90"
      >
        Talk to us
      </button>
    </form>
  );
}
