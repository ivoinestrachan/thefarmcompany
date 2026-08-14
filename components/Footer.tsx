import Reveal from "./Reveal";
import WaitlistForm from "./WaitlistForm";

export default function Footer() {
  return (
    <footer id="contact" className="bg-char">
      {/* contact */}
      <div className="relative overflow-hidden border-y hairline py-24 lg:py-32">
        <div className="grid-dot pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
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
      </div>

      {/* minimal footer bar — wordmark left, copyright right */}
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-8 sm:flex-row sm:items-center lg:px-10">
        <a href="#top" className="display text-lg font-700 tracking-tight text-paper">
          thefarmcompany
        </a>
        <span className="font-mono text-[12px] text-faint">
          © 2026 The Farming Company. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
