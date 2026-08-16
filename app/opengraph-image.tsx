import { ImageResponse } from "next/og";

export const alt = "The Farming Company: Autonomous Weeding Robots";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card — the wordmark + tagline on the warm soil-black canvas.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0b0a",
          color: "#f3f1ed",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 600, letterSpacing: "-0.03em" }}>
          the farming company
        </div>
        <div style={{ fontSize: 34, color: "#a6a099", marginTop: 28 }}>
          Autonomous weeding robots. No chemicals. Living soil.
        </div>
      </div>
    ),
    { ...size }
  );
}
