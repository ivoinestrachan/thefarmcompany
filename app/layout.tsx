import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
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

const headline = "The Farming Company — Autonomous Weeding Robots";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: headline,
    template: "%s · The Farming Company",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "The Farming Company",
    "thefarmingcompany",
    "autonomous weeding robot",
    "weeding robot",
    "farm robot",
    "agricultural robotics",
    "regenerative agriculture",
    "soil health",
    "chemical-free weeding",
    "the Wiggler",
  ],
  authors: [{ name: "Ivoine Strachan" }],
  creator: "Ivoine Strachan",
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: headline,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: headline,
    description: SITE_DESCRIPTION,
    creator: "@ivoinetech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#0d0b0a",
};

// Organization structured data — tells Google this is a company entity, with
// its socials and founder, which is what powers brand search results.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "thefarmingcompany",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description: SITE_DESCRIPTION,
  sameAs: ["https://www.linkedin.com/in/ivoine", "https://x.com/ivoinetech"],
  founder: {
    "@type": "Person",
    name: "Ivoine Strachan",
    jobTitle: "CEO & Founder",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${grotesk.variable} ${spaceMono.variable} ${caveat.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
