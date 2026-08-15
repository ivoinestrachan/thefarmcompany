import Reveal from "./Reveal";
import WaitlistForm from "./WaitlistForm";

/* -------------------------------------------------------------------------- */
/*  Footer — the contact CTA, over a field shot. Rendered as the last stacked  */
/*  panel (the footer bar lives separately, below the stack).                  */
/* -------------------------------------------------------------------------- */

export default function Footer() {
  return (
    <section
      id="contact"
      className="relative flex items-center overflow-hidden border-y hairline bg-char py-28 lg:py-36"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=2400&q=80"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-char via-char/80 to-char" />
      <div className="pointer-events-none absolute inset-0 bg-char/45" />
      <div className="grid-dot pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative mx-auto w-full max-w-4xl px-6 text-center lg:px-10">
        <Reveal>
          <span className="eyebrow justify-center">Onboarding · 2026 season</span>
          <h2 className="display mt-6 text-4xl text-paper sm:text-5xl lg:text-6xl">
            Put the bugs to work on your land.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-300 leading-relaxed text-fog">
            We are onboarding regenerative farms for the 2026 season. Tell us
            about your acreage and we will map your first field.
          </p>
          <WaitlistForm />
        </Reveal>
      </div>
    </section>
  );
}
