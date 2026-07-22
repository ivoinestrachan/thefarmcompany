export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col justify-end overflow-hidden"
    >
      {/* Background farm image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=2400&q=80"
        alt="Rows of crops leading to green hills"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-paper/30 via-transparent to-paper/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-paper/50 via-paper/12 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="rise max-w-4xl">
          <h1 className="display text-[12vw] text-ink sm:text-[9vw] lg:text-[6.5rem] [text-shadow:0_2px_30px_rgba(245,244,240,0.9),0_1px_8px_rgba(245,244,240,0.9)]">
            Autonomous bugs
            <br />
            that kill weeds.
          </h1>
          <p className="mt-8 max-w-xl text-lg font-400 leading-relaxed text-ink [text-shadow:0_1px_16px_rgba(245,244,240,1),0_0_6px_rgba(245,244,240,1)]">
            We build soil bugs — small autonomous machines that hunt and kill
            weeds mechanically, with zero chemicals. Then they rebuild your soil
            and stream the health of every acre back to you, in real time.
          </p>
        </div>
      </div>
    </section>
  );
}
