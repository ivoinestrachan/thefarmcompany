/* -------------------------------------------------------------------------- */
/*  FooterBar — the minimal bar below the stack: wordmark left, LinkedIn +      */
/*  copyright right. Sits outside the sticky stack so nothing peeks behind it.  */
/* -------------------------------------------------------------------------- */

export default function FooterBar() {
  return (
    <footer className="bg-char">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center lg:px-10">
        <a href="#top" className="display text-lg font-500 tracking-tight text-paper">
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
