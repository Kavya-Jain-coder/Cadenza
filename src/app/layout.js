import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import AmbientVisualizer from "@/components/ui/AmbientVisualizer";
import ThemeManager from "@/components/layout/ThemeManager";
import SmoothScroll from "@/components/layout/SmoothScroll";
import CustomCursor from "@/components/ui/CustomCursor";
import NoiseOverlay from "@/components/ui/NoiseOverlay";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cadenza — AI Music Creation Platform",
  description: "A free-tier premium portfolio web product for AI-assisted music creation.",
  icons: {
    icon: '/icon.svg',
  },
};

import { auth } from "@/lib/auth";

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-obsidian text-white font-sans md:cursor-none">
        <Providers session={session}>
          <SmoothScroll>
            <ThemeManager />
            <AmbientVisualizer />
            <CustomCursor />
            <NoiseOverlay />
            <Navbar />
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}