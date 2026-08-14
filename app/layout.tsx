import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

// Engineered geometric grotesk for display + body — the DIN-adjacent voice.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-grotesk",
});

// Monospace for the instrument layer — labels, telemetry, command lines.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html lang="en" className={`${grotesk.variable} ${spaceMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
