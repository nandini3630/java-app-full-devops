import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "AuctionX | Stellar Precision Bidding",
  description: "Experience the next generation of real-time digital auctions with ultra-low latency and cyber-luxury design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="bg-stellar-glow" />
          <Navbar />
          <main className="relative z-10">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
