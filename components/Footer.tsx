import Reveal from "./Reveal";
import WaitlistForm from "./WaitlistForm";

export default function Footer() {
  return (
    <footer id="contact" className="bg-char">
      {/* contact — over a field shot */}
      <div className="relative overflow-hidden border-y hairline py-28 lg:py-36">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=2400&q=80"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-char via-char/80 to-char" />
        <div className="absolute inset-0 bg-char/45" />
        <div className="grid-dot pointer-events-none absolute inset-0 opacity-25" />
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

      {/* minimal footer bar — wordmark left, LinkedIn + copyright right */}
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center lg:px-10">
        <a href="#top" className="display text-lg font-700 tracking-tight text-paper">
          thefarmcompany
        </a>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <a
            href="https://www.linkedin.com/company/the-farming-compan/"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[12px] text-fog transition-colors hover:text-paper"
          >
            LinkedIn ↗
          </a>
          <span className="font-mono text-[12px] text-faint">
            © 2026 The Farming Company. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
