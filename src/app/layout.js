import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import ThemeManager from "@/components/layout/ThemeManager";
import SmoothScroll from "@/components/layout/SmoothScroll";
import GlobalBackground from "@/components/ui/GlobalBackground";

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
      className={`${outfit.variable} ${inter.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-obsidian text-white font-sans">
        <Providers session={session}>
          <SmoothScroll>
            <ThemeManager />
            <GlobalBackground />
            <Navbar />
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}