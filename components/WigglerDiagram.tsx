/* -------------------------------------------------------------------------- */
/*  WigglerDiagram — our own schematic of the Wiggler, drawn from the real      */
/*  hardware: ogive nose, a segmented bellows body with a glossy top sheen,      */
/*  mid-body couplings, and an integrated electronics head (PCB vision module    */
/*  + lens). Volumetric fills give it weight; mono callouts keep it a diagram.   */
/* -------------------------------------------------------------------------- */

const STROKE = "rgba(243,241,237,0.85)";
const RIDGE = "rgba(243,241,237,0.34)";
const RIDGE_SHADOW = "rgba(5,4,3,0.6)";
const FAINT = "rgba(243,241,237,0.16)";
const LEAD = "rgba(243,241,237,0.5)";
const GREEN = "#7d9b6a";

const CY = 300;

// body radius along the axis: ogive nose → segmented body → waist → head bulb
function r(x: number): number {
  if (x <= 150) return 0;
  if (x < 260) {
    const t = (x - 150) / 110;
    return 76 * Math.pow(Math.sin((t * Math.PI) / 2), 0.85);
  }
  if (x < 640) {
    const t = (x - 260) / 380;
    return 76 + 12 * Math.sin(t * Math.PI);
  }
  if (x < 700) {
    const t = (x - 640) / 60;
    return 76 - 4 * Math.sin(t * Math.PI);
  }
  if (x <= 800) {
    const t = (x - 700) / 100;
    return 72 + 26 * Math.sin((t * Math.PI) / 2);
  }
  const t = (x - 800) / 80;
  return t >= 1 ? 0 : 98 * Math.sqrt(Math.max(0, 1 - t * t));
}

const X0 = 150;
const X1 = 880;

// closed silhouette: top edge L→R, then bottom edge R→L
function silhouette(): string {
  const top: string[] = [];
  const bot: string[] = [];
  for (let x = X0; x <= X1; x += 5) {
    top.push(`${x},${(CY - r(x)).toFixed(1)}`);
    bot.push(`${x},${(CY + r(x)).toFixed(1)}`);
  }
  return `M ${top.join(" L ")} L ${bot.reverse().join(" L ")} Z`;
}

// overlapping segment ridges across the body
const RIDGES: string[] = [];
for (let x = 272; x <= 690; x += 22) {
  const rr = r(x);
  RIDGES.push(`M ${x},${CY - rr} Q ${x + 11},${CY} ${x},${CY + rr}`);
}

// PCB dot grid on the head module
const PCB: [number, number][] = [];
for (let c = 0; c < 3; c++) for (let rI = 0; rI < 4; rI++) PCB.push([824 + c * 12, 276 + rI * 13]);

type Call = { label: string; from: [number, number]; to: [number, number]; side: "start" | "end" };
const CALLS: Call[] = [
  { label: "peristaltic drive", from: [356, 246], to: [60, 150], side: "end" },
  { label: "chassis spine", from: [470, 300], to: [60, 300], side: "end" },
  { label: "support insert", from: [540, 358], to: [60, 452], side: "end" },
  { label: "segment ring", from: [600, 246], to: [980, 160], side: "start" },
  { label: "vision sensor", from: [848, 300], to: [980, 300], side: "start" },
  { label: "moisture probe", from: [800, 360], to: [980, 452], side: "start" },
];
function leaderPoints({ from, to, side }: Call): string {
  const elbowX = side === "start" ? to[0] - 26 : to[0] + 26;
  const endX = side === "start" ? to[0] - 8 : to[0] + 8;
  return `${from[0]},${from[1]} ${elbowX},${to[1]} ${endX},${to[1]}`;
}

const SIL = silhouette();

export default function WigglerDiagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-120 -10 1300 610" className={className} role="img" aria-label="Schematic anatomy diagram of the Wiggler W-04 field robot">
      <defs>
        <radialGradient id="wd-glow" cx="50%" cy="48%" r="54%">
          <stop offset="0%" stopColor="rgba(242,239,233,0.08)" />
          <stop offset="100%" stopColor="rgba(242,239,233,0)" />
        </radialGradient>
        {/* volumetric body: lit from top */}
        <linearGradient id="wd-body" x1="0" y1={CY - 125} x2="0" y2={CY + 125} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3a362f" />
          <stop offset="32%" stopColor="#201e19" />
          <stop offset="72%" stopColor="#121009" />
          <stop offset="100%" stopColor="#090807" />
        </linearGradient>
        {/* glossy top sheen */}
        <linearGradient id="wd-sheen" x1="0" y1={CY - 120} x2="0" y2={CY + 10} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(243,241,237,0.28)" />
          <stop offset="100%" stopColor="rgba(243,241,237,0)" />
        </linearGradient>
        <clipPath id="wd-clip">
          <path d={SIL} />
        </clipPath>
      </defs>

      <ellipse cx="500" cy="300" rx="500" ry="210" fill="url(#wd-glow)" />

      {/* title block */}
      <text x="60" y="64" fill="rgba(243,241,237,0.55)" fontFamily="var(--font-mono), monospace" fontSize="15" letterSpacing="3">ANATOMY · WIGGLER W-04</text>
      <line x1="60" y1="78" x2="300" y2="78" stroke={FAINT} strokeWidth="1" />

      {/* ---- body ---- */}
      <path d={SIL} fill="url(#wd-body)" />
      <g clipPath="url(#wd-clip)">
        {/* top sheen */}
        <rect x={X0} y={CY - 125} width={X1 - X0} height={135} fill="url(#wd-sheen)" />
        {/* segment ridges — a dark shadow then a light crest for depth */}
        {RIDGES.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke={RIDGE_SHADOW} strokeWidth="3" transform="translate(-2.5,0)" />
            <path d={d} fill="none" stroke={RIDGE} strokeWidth="1.5" />
          </g>
        ))}
        {/* waist / head seam */}
        <path d={`M 690,${CY - r(690)} Q 702,${CY} 690,${CY + r(690)}`} fill="none" stroke={RIDGE_SHADOW} strokeWidth="3" />
        {/* electronics head module */}
        <rect x="814" y="264" width="52" height="72" rx="5" fill="#0c0b0a" stroke={STROKE} strokeWidth="1.8" />
        {PCB.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.8" fill="rgba(243,241,237,0.55)" />
        ))}
        {/* camera lens */}
        <circle cx="786" cy={CY} r="16" fill="#0a0908" stroke={STROKE} strokeWidth="1.8" />
        <circle cx="786" cy={CY} r="7.5" fill="none" stroke={GREEN} strokeWidth="2.2" />
        <circle cx="781" cy={CY - 5} r="2.5" fill="rgba(243,241,237,0.9)" />
      </g>
      {/* crisp outline on top of everything */}
      <path d={SIL} fill="none" stroke={STROKE} strokeWidth="2.2" strokeLinejoin="round" />

      {/* mid-body couplings (sit over the seam) */}
      {[452, 516].map((x) => (
        <g key={x}>
          <rect x={x - 9} y={CY - 12} width="18" height="24" rx="2.5" fill="#0c0b0a" stroke={STROKE} strokeWidth="1.6" />
          <circle cx={x} cy={CY - 6} r="2" fill={STROKE} />
          <circle cx={x} cy={CY + 6} r="2" fill={STROKE} />
        </g>
      ))}

      {/* callouts */}
      {CALLS.map((c) => (
        <g key={c.label}>
          <polyline points={leaderPoints(c)} fill="none" stroke={LEAD} strokeWidth="1.25" />
          <circle cx={c.from[0]} cy={c.from[1]} r="3.4" fill={GREEN} />
          <text x={c.to[0]} y={c.to[1]} dy="0.34em" textAnchor={c.side === "start" ? "start" : "end"} fill="rgba(243,241,237,0.92)" fontFamily="var(--font-mono), monospace" fontSize="16" letterSpacing="0.3">
            {c.label}
          </text>
        </g>
      ))}

      {/* how it works */}
      <text x="500" y="542" textAnchor="middle" fill="rgba(243,241,237,0.6)" fontFamily="var(--font-mono), monospace" fontSize="14.5" letterSpacing="0.3">
        peristaltic drive — the body contracts in a travelling wave and crawls the row like an earthworm.
      </text>
      <text x="500" y="568" textAnchor="middle" fill="rgba(243,241,237,0.38)" fontFamily="var(--font-mono), monospace" fontSize="13.5" letterSpacing="0.3">
        no wheels, no soil compaction · pulls weeds mechanically · zero chemicals
      </text>
    </svg>
  );
}
