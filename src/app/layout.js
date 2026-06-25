import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import AmbientVisualizer from "@/components/ui/AmbientVisualizer";

const playfair = Playfair_Display({
  variable: "--font-playfair",
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
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-obsidian text-white font-sans">
        <Providers session={session}>
          <AmbientVisualizer />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}