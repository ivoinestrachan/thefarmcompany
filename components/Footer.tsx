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
        src="/hydroponics/greenhouse.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-char via-char/80 to-char" />
      <div className="pointer-events-none absolute inset-0 bg-char/45" />
      <div className="grid-dot pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative mx-auto w-full max-w-4xl px-6 text-center lg:px-10">
        <Reveal>
          <span className="eyebrow justify-center">Trial partners</span>
          <h2 className="display mt-6 text-4xl text-paper sm:text-5xl lg:text-6xl">
            Help take Wiggler from water to field.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-300 leading-relaxed text-fog">
            We&rsquo;re looking for hydroponic operators, growers, and research
            partners who want to help shape the next round of controlled trials.
          </p>
          <WaitlistForm />
        </Reveal>
      </div>
    </section>
  );
}
