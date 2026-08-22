import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "TicketBox · Movies & Concerts",
  description: "Book seats from a live map, with holds, waitlists, and QR tickets.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#140e0a] text-amber-50 antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-[4%] py-6 md:py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
