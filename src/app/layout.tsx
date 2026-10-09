import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";
import { NoiseOverlay } from "@/components/effects/misc";
import { CommandPalette } from "@/components/layout/command-palette";
import { DemoControls, StoreHydrator } from "@/components/layout/demo-controls";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Lumora — Hire the people who direct the machines", template: "%s · Lumora" },
  description:
    "An AI-native creative marketplace. Discover AI filmmakers, animators and designers by tools, skills and verified workflows, write structured briefs with AI, and manage engagements end to end.",
};

export const viewport: Viewport = { themeColor: "#07070B", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col overflow-x-hidden">
        <TooltipProvider delay={150}>
          <a
            href="#main"
            className="sr-only z-[200] rounded-lg bg-violet px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <StoreHydrator />
          <Nav />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CommandPalette />
          <DemoControls />
          <Toaster position="bottom-left" />
          <NoiseOverlay />
        </TooltipProvider>
      </body>
    </html>
  );
}
