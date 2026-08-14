/* Custom inline-SVG diagrams — no external assets, crisp at any size. */

/* The regenerative loop as an animated cycle of four stages. */
export function LoopDiagram({ className = "" }: { className?: string }) {
  const cx = 180;
  const cy = 180;
  const r = 118;

  const nodes = [
    { key: "Kill weeds", sub: "Grazer", angle: -90, color: "#86c46b" },
    { key: "Aerate", sub: "Tiller", angle: 0, color: "#4a8f5b" },
    { key: "Enrich", sub: "Castings", angle: 90, color: "#86c46b" },
    { key: "Sense", sub: "Scout", angle: 180, color: "#4a8f5b" },
  ];

  const pt = (angle: number, radius = r) => {
    const a = (angle * Math.PI) / 180;
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as const;
  };

  return (
    <svg
      viewBox="0 0 360 360"
      className={className}
      fill="none"
      role="img"
      aria-label="The regenerative loop: kill weeds, aerate, enrich, sense — repeating continuously"
    >
      <defs>
        <linearGradient id="loopRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#86c46b" />
          <stop offset="1" stopColor="#2f5d3a" />
        </linearGradient>
      </defs>

      {/* base ring */}
      <circle cx={cx} cy={cy} r={r} stroke="#f5f4f0" strokeOpacity="0.12" strokeWidth="1.5" />

      {/* animated progress arc travelling round the loop */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="url(#loopRing)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="150 591"
        transform={`rotate(-90 ${cx} ${cy})`}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`-90 ${cx} ${cy}`}
          to={`270 ${cx} ${cy}`}
          dur="7s"
          repeatCount="indefinite"
        />
      </circle>

      {/* directional arrowheads between nodes */}
      {[-45, 45, 135, 225].map((a) => {
        const [x, y] = pt(a);
        return (
          <path
            key={a}
            d="M-4 -4 L4 0 L-4 4"
            transform={`translate(${x} ${y}) rotate(${a + 90})`}
            stroke="#f5f4f0"
            strokeOpacity="0.3"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      })}

      {/* centre label */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#86c46b" letterSpacing="0.18em">
        LIVING
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="15" fill="#f5f4f0" fillOpacity="0.85">
        soil loop
      </text>

      {/* nodes */}
      {nodes.map((n) => {
        const [x, y] = pt(n.angle);
        const labelLeft = n.angle === 180;
        const labelRight = n.angle === 0;
        const tx = labelRight ? x + 16 : labelLeft ? x - 16 : x;
        const anchor = labelRight ? "start" : labelLeft ? "end" : "middle";
        const ty = n.angle === -90 ? y - 18 : n.angle === 90 ? y + 26 : y - 4;
        return (
          <g key={n.key}>
            <circle cx={x} cy={y} r="9" fill="#0a0a0a" stroke={n.color} strokeWidth="2" />
            <circle cx={x} cy={y} r="3" fill={n.color} />
            <text x={anchor === "middle" ? x : tx} y={ty} textAnchor={anchor} fontSize="12.5" fill="#f5f4f0" fillOpacity="0.9">
              {n.key}
            </text>
            <text
              x={anchor === "middle" ? x : tx}
              y={ty + 14}
              textAnchor={anchor}
              fontSize="10"
              fill={n.color}
            >
              {n.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function WormDiagram({ className = "" }: { className?: string }) {
  // The worm's centre-line path, reused for the body, segment rings and the
  // travelling particle so everything stays perfectly aligned.
  const spine =
    "M96 66 C 150 78, 138 128, 176 150 C 214 172, 262 156, 276 196 C 288 230, 250 256, 268 300";

  // Sample points along an approximate of the spine for segment ticks.
  const segments = Array.from({ length: 16 }).map((_, i) => {
    const t = i / 15;
    const x = 96 + Math.sin(t * 3.1) * 96 + t * 70;
    const y = 66 + t * 234;
    const a = Math.cos(t * 3.1) * 0.9;
    return { x, y, a };
  });

  return (
    <svg
      viewBox="0 0 360 340"
      className={className}
      fill="none"
      role="img"
      aria-label="Earthworm burrowing: intake at the surface, aeration channels, and nutrient-rich castings enriching the soil"
    >
      <defs>
        <linearGradient id="wormBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0b4a6" />
          <stop offset="0.55" stopColor="#c48472" />
          <stop offset="1" stopColor="#9c5f4d" />
        </linearGradient>
        <radialGradient id="wormGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#86c46b" stopOpacity="0.5" />
          <stop offset="1" stopColor="#86c46b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* surface line + grass tufts */}
      <path d="M20 66 H340" stroke="#f5f4f0" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="1 6" strokeLinecap="round" />
      {[36, 52, 300, 320].map((x) => (
        <g key={x} stroke="#86c46b" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
          <path d={`M${x} 66 C ${x - 2} 58, ${x - 3} 54, ${x - 1} 50`} />
          <path d={`M${x + 4} 66 C ${x + 5} 60, ${x + 6} 56, ${x + 5} 52`} />
        </g>
      ))}

      {/* aeration channels branching off the burrow (dotted) */}
      {[
        "M176 150 C 150 160, 132 178, 120 202",
        "M276 196 C 300 204, 314 222, 320 246",
        "M176 150 C 196 168, 204 190, 200 214",
      ].map((d, i) => (
        <path key={i} d={d} stroke="#f5f4f0" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="1 5" strokeLinecap="round" />
      ))}

      {/* burrow casing (loose soil around the worm) */}
      <path d={spine} stroke="#3a2817" strokeWidth="30" strokeOpacity="0.55" strokeLinecap="round" />

      {/* worm body */}
      <path d={spine} stroke="url(#wormBody)" strokeWidth="18" strokeLinecap="round" />

      {/* segment rings */}
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x - 8 * Math.cos(Math.atan(s.a))}
          y1={s.y - 8 * Math.sin(Math.atan(s.a))}
          x2={s.x + 8 * Math.cos(Math.atan(s.a))}
          y2={s.y + 8 * Math.sin(Math.atan(s.a))}
          stroke="#7a4636"
          strokeWidth="1.1"
          strokeOpacity="0.55"
        />
      ))}

      {/* clitellum band */}
      <path d="M150 78 C 138 96, 140 112, 150 120" stroke="#efd2c8" strokeWidth="18" strokeLinecap="round" opacity="0.85" />

      {/* head */}
      <circle cx="96" cy="66" r="10" fill="#c48472" />
      <circle cx="93" cy="63" r="2" fill="#3a2817" opacity="0.6" />

      {/* travelling glow at the intake mouth */}
      <circle cx="96" cy="66" r="16" fill="url(#wormGlow)">
        <animate attributeName="r" values="10;18;10" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* nutrient castings cluster at the tail */}
      {[
        [268, 300, 3.2],
        [280, 292, 2.4],
        [258, 296, 2.2],
        [274, 308, 2],
        [250, 306, 1.8],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#86c46b" opacity={0.9} />
      ))}

      {/* nutrients rising from castings back to the root zone */}
      {[
        [262, 288],
        [246, 292],
        [278, 282],
      ].map(([x, y], i) => (
        <g key={i} stroke="#86c46b" strokeWidth="1.3" strokeLinecap="round" opacity="0.75">
          <path d={`M${x} ${y} V ${y - 14}`} />
          <path d={`M${x - 3} ${y - 10} L ${x} ${y - 15} L ${x + 3} ${y - 10}`} fill="none" />
        </g>
      ))}

      {/* numbered stage labels */}
      {[
        ["1", "Intake", 116, 52],
        ["2", "Aerate", 208, 150],
        ["3", "Castings enrich", 210, 300],
      ].map(([n, label, x, y]) => (
        <g key={n as string}>
          <circle cx={x as number} cy={(y as number) - 4} r="8" fill="none" stroke="#86c46b" strokeWidth="1" />
          <text x={x as number} y={(y as number) - 0.5} textAnchor="middle" fontSize="9" fill="#86c46b">
            {n}
          </text>
          <text x={(x as number) + 14} y={(y as number) - 1} fontSize="11" fill="#f5f4f0" fillOpacity="0.7">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* A detailed, infographic-grade soil profile.                         */
/* ------------------------------------------------------------------ */
export function SoilProfile({ className = "" }: { className?: string }) {
  const bands = [
    { y: 78, h: 26, top: "#dbe6c6", bot: "#c6d6ab", label: "Residue · O", dark: false },
    { y: 104, h: 74, top: "#5c4129", bot: "#42301c", label: "Topsoil · A", dark: true },
    { y: 178, h: 96, top: "#8a6642", bot: "#6d4e30", label: "Subsoil · B", dark: true },
    { y: 274, h: 82, top: "#a89e8c", bot: "#8f8574", label: "Parent · C", dark: true },
  ];

  // deterministic texture speckle per band
  const speckle = (
    y0: number,
    y1: number,
    n: number,
    fill: string,
    seed: number
  ) =>
    Array.from({ length: n }).map((_, i) => {
      const rx = ((seed * 9301 + i * 49297) % 233280) / 233280;
      const ry = ((seed * 4021 + i * 26947) % 233280) / 233280;
      const x = 50 + rx * 380;
      const y = y0 + ry * (y1 - y0);
      return (
        <circle key={`${seed}-${i}`} cx={x} cy={y} r={0.9} fill={fill} opacity={0.5} />
      );
    });

  return (
    <svg
      viewBox="0 0 440 372"
      className={className}
      role="img"
      aria-label="Detailed soil horizon cross-section with roots, worms and fungal networks"
    >
      <defs>
        {bands.map((b, i) => (
          <linearGradient key={i} id={`band${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={b.top} />
            <stop offset="1" stopColor={b.bot} />
          </linearGradient>
        ))}
        <clipPath id="soilclip">
          <rect x="44" y="78" width="392" height="278" rx="16" />
        </clipPath>
        <radialGradient id="scan" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#86c46b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#86c46b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* depth ruler */}
      <g fontSize="9" fill="#0a0a0a" opacity="0.45">
        {[
          [78, "0"],
          [148, "20"],
          [226, "40"],
          [300, "60"],
          [352, "cm"],
        ].map(([y, t]) => (
          <g key={t as string}>
            <line
              x1="34"
              y1={y as number}
              x2="44"
              y2={y as number}
              stroke="#0a0a0a"
              strokeOpacity="0.2"
            />
            <text x="30" y={(y as number) + 3} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
      </g>

      <g clipPath="url(#soilclip)">
        {bands.map((b, i) => (
          <rect key={i} x="44" y={b.y} width="392" height={b.h} fill={`url(#band${i})`} />
        ))}

        {/* texture */}
        {speckle(104, 178, 60, "#2a1c10", 3)}
        {speckle(178, 274, 55, "#4a3018", 7)}
        {speckle(274, 356, 40, "#6f6656", 11)}

        {/* moisture droplets */}
        {[
          [96, 150],
          [120, 205],
          [78, 232],
        ].map(([x, y]) => (
          <path
            key={`w${x}`}
            d={`M${x} ${y} c 4 4 4 8 0 10 c -4 -2 -4 -6 0 -10 Z`}
            fill="#7fb2cf"
            opacity="0.75"
          />
        ))}

        {/* ---- plant + root system ---- */}
        {/* taproot */}
        <path
          d="M150 104 C 148 140, 152 168, 148 214 C 146 244, 150 262, 150 286"
          stroke="#2b1d10"
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* laterals */}
        {[
          "M150 128 C 120 134, 98 146, 78 158",
          "M151 156 C 182 162, 210 172, 230 188",
          "M149 190 C 120 200, 104 216, 90 236",
          "M150 214 C 176 224, 192 240, 206 260",
          "M150 250 C 132 262, 122 278, 116 296",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#3a2716"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {/* fine root hairs */}
        {[
          [78, 158],
          [230, 188],
          [90, 236],
          [206, 260],
          [116, 296],
        ].flatMap(([x, y], gi) =>
          [0, 1, 2].map((k) => {
            const dx = (k - 1) * 7 + (gi % 2) * 3;
            return (
              <path
                key={`${gi}-${k}`}
                d={`M${x} ${y} c ${dx} 6 ${dx * 1.2} 10 ${dx * 1.1} 15`}
                stroke="#4a331d"
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
              />
            );
          })
        )}

        {/* fungal mycelium threads (translucent) */}
        {[
          "M150 150 C 130 158, 118 172, 132 186 M132 186 C 140 176, 128 168, 150 150",
          "M180 176 C 200 180, 210 196, 196 206 M196 206 C 190 194, 206 188, 180 176",
          "M120 210 C 104 220, 100 236, 116 240",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#ffffff"
            strokeOpacity="0.4"
            strokeWidth="0.7"
            fill="none"
          />
        ))}

        {/* stem + leaves above ground */}
        <path d="M150 104 L150 30" stroke="#3f7a4b" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M150 60 C 132 52, 120 58, 116 72 C 134 74, 146 70, 150 60 Z"
          fill="#4a8f5b"
        />
        <path
          d="M150 48 C 168 40, 182 46, 186 60 C 168 62, 154 58, 150 48 Z"
          fill="#5aa06a"
        />
        <path
          d="M150 78 C 136 74, 126 78, 122 88 C 136 90, 146 86, 150 78 Z"
          fill="#4a8f5b"
        />
        <circle cx="150" cy="28" r="4" fill="#86c46b" />

        {/* ---- earthworm in burrow ---- */}
        <path
          d="M334 108 C 348 142, 322 172, 340 210 C 350 236, 330 262, 344 300"
          stroke="#3a2817"
          strokeOpacity="0.45"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M334 108 C 348 142, 322 172, 340 210 C 350 236, 330 262, 344 300"
          stroke="#c48472"
          strokeWidth="9.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* clitellum band */}
        <path
          d="M330 150 C 340 160, 336 168, 331 176"
          stroke="#e0b4a6"
          strokeWidth="9.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* segments */}
        {Array.from({ length: 12 }).map((_, i) => {
          const t = i / 12;
          const y = 116 + t * 176;
          const x = 334 + Math.sin(t * 7.2) * 9;
          return (
            <line
              key={i}
              x1={x - 4}
              y1={y}
              x2={x + 4}
              y2={y}
              stroke="#9c5f4d"
              strokeWidth="0.9"
              opacity="0.7"
            />
          );
        })}
        <circle cx="334" cy="108" r="6" fill="#c48472" />
        {/* castings */}
        {[
          [344, 300],
          [352, 292],
          [338, 296],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2.4" fill="#86c46b" />
        ))}

        {/* soil beetle */}
        <g transform="translate(104 128)">
          <ellipse cx="0" cy="0" rx="6" ry="4" fill="#20160d" />
          <line x1="-6" y1="-3" x2="-11" y2="-6" stroke="#20160d" strokeWidth="0.9" />
          <line x1="-6" y1="0" x2="-12" y2="0" stroke="#20160d" strokeWidth="0.9" />
          <line x1="-6" y1="3" x2="-11" y2="6" stroke="#20160d" strokeWidth="0.9" />
          <line x1="6" y1="-3" x2="11" y2="-6" stroke="#20160d" strokeWidth="0.9" />
          <line x1="6" y1="0" x2="12" y2="0" stroke="#20160d" strokeWidth="0.9" />
          <line x1="6" y1="3" x2="11" y2="6" stroke="#20160d" strokeWidth="0.9" />
        </g>

        {/* rocks in parent material */}
        <path
          d="M250 306 q 14 -10 30 -3 q 10 8 -2 16 q -18 6 -28 -4 Z"
          fill="#b9b1a2"
        />
        <path d="M258 306 q 10 -6 20 -1" stroke="#cfc8bb" strokeWidth="1.2" fill="none" />
        <path d="M96 320 q 10 -7 22 -2 q 7 6 -3 12 q -14 4 -19 -4 Z" fill="#aca391" />
      </g>

      {/* frame */}
      <rect
        x="44"
        y="78"
        width="392"
        height="278"
        rx="16"
        fill="none"
        stroke="#0a0a0a"
        strokeOpacity="0.1"
      />

      {/* band labels */}
      {bands.map((b) => (
        <text
          key={b.label}
          x="56"
          y={b.y + 15}
          fontSize="10"
          letterSpacing="0.04em"
          fill={b.dark ? "#ffffff" : "#0a0a0a"}
          opacity={b.dark ? 0.85 : 0.7}
        >
          {b.label}
        </text>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The flagship product — a refined product render of the soil bug.    */
/* ------------------------------------------------------------------ */
export function BugUnit({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 360"
      className={className}
      role="img"
      aria-label="The Grazer — an autonomous soil bug, product render"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="studio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f1ea" />
          <stop offset="1" stopColor="#d9d6cb" />
        </linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c8783" />
          <stop offset="0.5" stopColor="#3c4744" />
          <stop offset="1" stopColor="#171d1b" />
        </linearGradient>
        <linearGradient id="metalDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5451" />
          <stop offset="1" stopColor="#121715" />
        </linearGradient>
        <radialGradient id="lens" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#b9f29a" />
          <stop offset="0.45" stopColor="#4a8f5b" />
          <stop offset="1" stopColor="#0d1a12" />
        </radialGradient>
        <radialGradient id="contact" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1c1a14" stopOpacity="0.32" />
          <stop offset="1" stopColor="#1c1a14" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.42" r="0.7">
          <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.08" />
        </radialGradient>
      </defs>

      {/* studio backdrop */}
      <rect x="0" y="0" width="360" height="360" fill="url(#studio)" />
      <rect x="0" y="0" width="360" height="360" fill="url(#vignette)" />

      {/* contact shadow */}
      <ellipse cx="182" cy="250" rx="128" ry="26" fill="url(#contact)" />

      {/* ---- far-side legs (muted, behind body) ---- */}
      <g stroke="#5b6360" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M120 196 l -20 26 l 4 22" />
        <path d="M176 200 l 2 30 l -6 22" />
        <path d="M232 196 l 22 26 l -2 22" />
      </g>

      {/* ---- body ---- */}
      <path
        d="M96 178
           C 86 158, 120 146, 168 146
           L 214 146
           C 250 146, 268 162, 262 186
           C 256 210, 232 222, 198 222
           L 150 222
           C 116 222, 90 204, 96 178 Z"
        fill="url(#metal)"
      />
      {/* top specular highlight */}
      <path
        d="M112 162 C 140 150, 200 150, 240 160 C 210 156, 150 156, 116 168 Z"
        fill="#ffffff"
        opacity="0.28"
      />
      {/* recessed segment seams (bevelled) */}
      {[
        [150, 150, 150, 220],
        [196, 149, 200, 220],
      ].map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <path
            d={`M${x1} ${y1} C ${x1 + 6} ${(y1 + y2) / 2}, ${x1 - 4} ${
              (y1 + y2) / 2
            }, ${x2} ${y2}`}
            stroke="#0d1210"
            strokeWidth="2.4"
            fill="none"
            opacity="0.7"
          />
          <path
            d={`M${x1 + 3} ${y1} C ${x1 + 9} ${(y1 + y2) / 2}, ${x1 - 1} ${
              (y1 + y2) / 2
            }, ${x2 + 3} ${y2}`}
            stroke="#8a938f"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
        </g>
      ))}
      {/* dorsal green light channel */}
      <path
        d="M126 158 C 160 150, 220 152, 250 164"
        stroke="#7ec472"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      {/* fine panel details / vents */}
      <g stroke="#0d1210" strokeWidth="1.2" opacity="0.45">
        <line x1="118" y1="196" x2="140" y2="196" />
        <line x1="118" y1="202" x2="136" y2="202" />
      </g>

      {/* head module + multispectral sensor */}
      <path
        d="M214 150 C 250 150, 268 164, 262 186 C 256 206, 236 216, 218 214 C 236 196, 236 168, 214 150 Z"
        fill="url(#metalDark)"
      />
      <circle cx="236" cy="182" r="16" fill="#0b110e" />
      <circle cx="236" cy="182" r="12.5" fill="url(#lens)" />
      <circle cx="231" cy="177" r="3.2" fill="#eafbe0" opacity="0.9" />

      {/* sensor mast */}
      <path d="M250 156 C 262 142, 268 128, 264 116" stroke="#2b322f" strokeWidth="3" fill="none" />
      <circle cx="264" cy="113" r="4.5" fill="#7ec472" />
      <circle cx="262.5" cy="111.5" r="1.4" fill="#eafbe0" />

      {/* under-body tool pod */}
      <rect x="150" y="214" width="40" height="14" rx="7" fill="url(#metalDark)" />
      <circle cx="188" cy="224" r="7" fill="#232a27" stroke="#5aa06a" strokeWidth="1.4" />

      {/* ---- near-side legs (crisp, in front) ---- */}
      <g stroke="#1a201e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M132 206 l -30 24 l 6 26" />
        <path d="M184 212 l 2 34 l -8 24" />
        <path d="M234 206 l 30 22 l -4 26" />
      </g>
      {/* leg foot joints */}
      {[
        [102, 230],
        [186, 246],
        [264, 228],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3.4" fill="#2b322f" />
      ))}
    </svg>
  );
}

export function PulseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 24" className={className} fill="none" aria-hidden>
      <path
        d="M0 12 H12 L16 4 L22 20 L28 8 L32 12 H48"
        className="stroke-leaf"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
