import Reveal from "./Reveal";

/* Founder. Drop a headshot in /public (e.g. "/ivoine.jpg") and set PHOTO
   to that path to replace the placeholder. */
const PHOTO = "/ivoine.jpg";

const LINKS: { label: string; href: string }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ivoine" },
  { label: "X", href: "https://x.com/ivoinetech" },
];

export default function Team() {
  return (
    <section
      id="team"
      className="border-y hairline bg-[#f2efe8] py-24 text-[#26241f] sm:py-32"
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal as="p" className="text-[1.25rem] font-500 text-[#26241f]">
          The team
        </Reveal>
        <Reveal
          as="h2"
          delay={80}
          className="display mt-6 text-3xl leading-[0.98] sm:text-5xl"
        >
          Built by someone who&rsquo;s farmed.
        </Reveal>

        <Reveal delay={140} className="mt-14 flex flex-col items-center">
          <div className="aspect-square w-44 overflow-hidden border border-black/10 bg-black/[0.04] sm:w-52">
            {PHOTO ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PHOTO}
                alt="Ivoine Strachan"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-black/35">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
                  Photo
                </span>
              </div>
            )}
          </div>

          <h3 className="display mt-7 text-2xl sm:text-3xl">Ivoine Strachan</h3>
          <p className="mt-2 text-lg font-500 text-[#3f5236]">CEO &amp; Founder</p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#57534a]">
            Ivoine is a mechanical engineer and roboticist. He helped start a
            farm on a friend&rsquo;s land, building the hardware himself. The
            Wiggler came out of that work, made by someone who has actually spent
            time in the dirt.
          </p>

          <div className="mt-7 flex items-center justify-center gap-5">
            {LINKS.map((l, i) => (
              <span key={l.href} className="flex items-center gap-5">
                {i > 0 && <span className="h-4 w-px bg-black/20" aria-hidden />}
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-[15px] text-[#26241f] underline-offset-4 transition-colors hover:text-[#3f5236] hover:underline"
                >
                  {l.label}
                </a>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
