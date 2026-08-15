import Reveal from "./Reveal";

/* -------------------------------------------------------------------------- */
/*  OldWay — a light break in the dark site: a line-art figure spraying weeds  */
/*  the chemical way, marked up by hand. The contrast to what the bugs do.     */
/* -------------------------------------------------------------------------- */

export default function OldWay() {
  return (
    <section className="border-y hairline bg-[#f2efe8] py-24 text-[#26241f] lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10">
        <Reveal>
          <span className="font-mono text-[0.7rem] font-500 uppercase tracking-[0.22em] text-[#8a8175]">
            The old way
          </span>
          <h2 className="display mt-5 text-3xl leading-[0.98] sm:text-5xl lg:text-6xl">
            Stop spraying your{" "}
            <span className="text-signal">soil to death.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg font-300 leading-relaxed text-[#57534a]">
            The sprays farms use don&rsquo;t only kill weeds. They also kill the
            tiny fungi and microbes that keep soil healthy, so every season the
            land needs more chemicals just to grow the same crop. Our bugs pull the
            weeds out by hand instead. No chemicals, and the soil stays alive.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mx-auto w-full max-w-sm">
            {/* photo — background removed, so the man sits straight on the panel. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/old-way.webp"
              alt="A man spraying chemical weedkiller onto a patch of dead grass"
              className="w-full"
            />

            {/* hand-drawn call-out pointing at the spray */}
            <div className="pointer-events-none absolute left-[0%] top-[38%] -rotate-6">
              <span className="hand text-2xl font-700 leading-tight text-signal sm:text-[1.75rem]">
                no more
                <br />
                of this
              </span>
            </div>
            <svg
              className="pointer-events-none absolute left-[5%] top-[50%] h-[32%] w-[34%] text-signal"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden
            >
              <path d="M10 8 C 52 4 82 40 66 80" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M52 72 L67 84 L78 69" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
