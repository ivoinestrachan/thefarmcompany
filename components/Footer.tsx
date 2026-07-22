import Reveal from "./Reveal";

export default function Footer() {
  return (
    <footer id="contact" className="bg-paper">
      {/* CTA */}
      <div className="border-y hairline bg-paper py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-10">
          <Reveal>
            <h2 className="display text-4xl text-ink sm:text-5xl lg:text-6xl">
              Put the herd to work on your land.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg font-300 leading-relaxed text-ink/65">
              We're onboarding regenerative farms for the 2026 season. Tell us
              about your acreage and we'll map your first field.
            </p>
            <form className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                placeholder="you@farm.com"
                className="flex-1 rounded-full border hairline bg-bone px-5 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-ink/30"
              />
              <button
                type="submit"
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-85"
              >
                Chat w us
              </button>
            </form>
          </Reveal>
        </div>
      </div>

      {/* Footer bar */}
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  className="stroke-ink"
                  strokeWidth="1.2"
                />
                <path
                  d="M12 18v-7m0 0c0-1.6 1.3-3 3-3 0 1.6-1.3 3-3 3Zm0 0c0-1.6-1.3-3-3-3 0 1.6 1.3 3 3 3Z"
                  className="stroke-ink"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[15px] font-500">The Farming Company</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/55">
              Living machines for regenerative soil. Building the herd that heals
              the land.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            <FooterCol
              title="Product"
              links={["The Herd", "Dashboard", "Soil science", "Pricing"]}
            />
            <FooterCol
              title="Company"
              links={["About", "Careers", "Research", "Press"]}
            />
            <FooterCol
              title="Connect"
              links={["Contact", "X / Twitter", "LinkedIn", "Newsletter"]}
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-4 border-t hairline pt-6 text-[13px] text-ink/45 sm:flex-row">
          <span>© 2026 The Farming Company. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink">
              Privacy
            </a>
            <a href="#" className="hover:text-ink">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-[12px] font-500 uppercase tracking-wider text-ink/40">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-ink/65 transition-colors hover:text-ink">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
