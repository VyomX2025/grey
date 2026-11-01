import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { CompactToolbar } from "@/components/CompactToolbar";
import { SafetyDisclosure } from "@/components/SafetyDisclosure";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "GREY. — Emergency operations demo",
  description:
    "Hackathon prototype: explainable reassessment alerts on synthetic patient observations. Not for clinical use.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable} font-sans antialiased`}>
        <CompactToolbar />
        <main className="mx-auto max-w-[1400px] px-3 py-4">{children}</main>
        <SafetyDisclosure />
      </body>
    </html>
  );
}
