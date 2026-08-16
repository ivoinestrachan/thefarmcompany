import Reveal from "./Reveal";

/* A quiet credibility strip — investors, set apart from the hero. */
export default function Backers() {
  return (
    <section className="border-t hairline bg-char py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal
          as="p"
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-faint"
        >
          Backed by
        </Reveal>
        <Reveal
          delay={120}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-14 gap-y-6"
        >
          <a
            href="https://www.1517fund.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-2xl text-paper/90 transition-colors hover:text-green sm:text-[1.7rem]"
          >
            1517 Fund
          </a>
          <span className="hidden h-7 w-px bg-edge sm:block" aria-hidden />
          <a
            href="https://www.mercatus.org/emergent-ventures"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-2xl text-paper/90 transition-colors hover:text-green sm:text-[1.7rem]"
          >
            Emergent Ventures
          </a>
        </Reveal>
      </div>
    </section>
  );
}
