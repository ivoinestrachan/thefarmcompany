import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";

// Handwriting for the marked-up "old way" annotation.
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-hand",
});

// Geist — a clean, neutral grotesque (closest free match to Anduril's
// Helvetica Now Display) for display + body.
const grotesk = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-grotesk",
});

// Geist Mono for the instrument layer — labels, telemetry, coordinates.
const spaceMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-space-mono",
});

const title = "The Farming Company";
const description =
  "The Farming Company builds autonomous soil bugs that clear weeds, rebuild soil, and give farmers a live view of every acre.";

export const metadata: Metadata = {
  metadataBase: new URL("https://thefarmingcompany.ai"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: title,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#252423",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${grotesk.variable} ${spaceMono.variable} ${caveat.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
