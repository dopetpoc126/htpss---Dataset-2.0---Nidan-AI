import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});



export const metadata: Metadata = {
  title: "MediSense AI - Symptom Analysis",
  description: "Advanced AI-powered symptom analysis assistant.",
};


import { UserProvider } from "@/context/UserContext";
import RichAnimatedBackground from "@/components/RichAnimatedBackground";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-hide">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-slate-950 text-slate-50 overflow-x-hidden`}
      >
        <RichAnimatedBackground />
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
