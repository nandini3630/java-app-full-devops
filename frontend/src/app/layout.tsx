import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "AuctionX | Real-Time Bidding Platform",
  description: "Experience the future of bidding with real-time updates and seamless transactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-inter">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen pt-24 px-6 md:px-12 max-w-7xl mx-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
