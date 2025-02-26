import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import Frame from "@/components/core/Frame";

const font = Rubik({
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solaris",
  description: "Launcher for Solaris",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.className} bg-fixed bg-gradient-to-bl from-[#090210] to-[#0B0212] antialiased`}
      >
        <Frame />
        {children}
      </body>
    </html>
  );
}
